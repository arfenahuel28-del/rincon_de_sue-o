-- ==========================================================
-- RINCÓN DE SUEÑO – stock por color / estampa (Supabase)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se corre UNA vez, DESPUÉS de schema.sql y de ventas.sql. Si lo corrés
-- de nuevo no pasa nada: NO borra ni modifica productos ni pedidos.
--
-- Qué hace:
--   · Cuando un producto tiene colores con cantidad, cada venta (online o
--     en el local) descuenta del color elegido, y cancelar/anular lo devuelve.
--   · Guarda el color en cada línea de los pedidos online (columna nueva
--     order_items.color), así el panel lo muestra sin leer las observaciones.
--   · Los productos con colores SIN cantidades cargadas siguen funcionando
--     como antes (un solo stock para todos los colores).
--
-- Reemplaza (create or replace) las funciones create_order,
-- update_order_status, create_store_sale y cancel_store_sale. No toca tablas
-- salvo agregar la columna color a order_items.
-- ==========================================================

do $$
begin
  if to_regclass('public.store_sales') is null then
    raise exception 'Primero corré supabase/ventas.sql y después este archivo.';
  end if;
end $$;

alter table public.order_items add column if not exists color text not null default '' check (char_length(color) <= 30);

-- Suma de las cantidades de todos los colores. Devuelve NULL si el producto no
-- tiene colores o si algún color no tiene cantidad cargada (modo "stock único").
create or replace function public.color_total(p_art jsonb) returns integer
language sql immutable as $$
  select case
    when jsonb_typeof(p_art->'colors') = 'array'
     and jsonb_array_length(p_art->'colors') > 0
     and not exists (select 1 from jsonb_array_elements(p_art->'colors') c where jsonb_typeof(c->'stock') is distinct from 'number')
    then (select coalesce(sum((c->>'stock')::integer), 0)::integer from jsonb_array_elements(p_art->'colors') c)
  end
$$;

-- Suma p_delta (negativo = vender, positivo = devolver) a la cantidad de un color.
--   p_strict = true : el color tiene que existir y alcanzar; si no, corta con error.
--   p_strict = false: si no se puede aplicar, devuelve el art sin cambios.
create or replace function public.color_adjust(p_art jsonb, p_color text, p_delta integer, p_strict boolean) returns jsonb
language plpgsql immutable as $$
declare cur integer;
begin
  if public.color_total(p_art) is null then return p_art; end if;
  select (c->>'stock')::integer into cur from jsonb_array_elements(p_art->'colors') c where c->>'name' = p_color limit 1;
  if cur is null then
    if p_strict then raise exception using message = 'Elegí un color disponible', errcode = 'P0001'; end if;
    return p_art;
  end if;
  if cur + p_delta < 0 then
    if p_strict then raise exception using message = 'No hay stock suficiente del color ' || p_color || ' (quedan ' || cur || ')', errcode = 'P0001'; end if;
    return p_art;
  end if;
  return jsonb_set(p_art, '{colors}', (
    select jsonb_agg(case when c->>'name' = p_color then jsonb_set(c, '{stock}', to_jsonb(cur + p_delta)) else c end order by ord)
    from jsonb_array_elements(p_art->'colors') with ordinality as t(c, ord)
  ));
end;
$$;
revoke execute on function public.color_total(jsonb) from public, anon;
revoke execute on function public.color_adjust(jsonb, text, integer, boolean) from public, anon;

-- ---------- Crear pedido (lo llama la tienda) ----------
create or replace function public.create_order(p_payload jsonb, p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  existing public.orders;
  item jsonb;
  product_row public.products;
  v_order_id bigint;
  v_order_number text;
  v_total numeric(12,2) := 0;
  items_snapshot jsonb := '[]'::jsonb;
  qty integer;
  v_color text;
  v_art jsonb;
  v_new_stock integer;
  unit numeric(12,2);
  line_total numeric(12,2);
  delivery jsonb := coalesce(p_payload->'delivery', '{}'::jsonb);
  customer jsonb := coalesce(p_payload->'customer', '{}'::jsonb);
begin
  if p_idempotency_key is null or char_length(p_idempotency_key) < 16 then raise exception using message = 'Clave de idempotencia inválida', errcode = '22023'; end if;
  select * into existing from public.orders where idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('number', existing.number, 'status', existing.status, 'total', existing.total, 'createdAt', existing.created_at, 'duplicate', true); end if;
  if length(trim(coalesce(customer->>'name',''))) < 2 or length(trim(coalesce(customer->>'phone',''))) < 8 or position('@' in coalesce(customer->>'email','')) < 2 then raise exception using message = 'Datos del cliente inválidos', errcode = '22023'; end if;
  if coalesce(delivery->>'method','') not in ('retiro','envio') then raise exception using message = 'Método de entrega inválido', errcode = '22023'; end if;
  if delivery->>'method' = 'envio' and length(trim(coalesce(delivery->>'address',''))) < 5 then raise exception using message = 'La dirección es obligatoria', errcode = '22023'; end if;
  if jsonb_typeof(p_payload->'items') is distinct from 'array' or jsonb_array_length(p_payload->'items') = 0 then raise exception using message = 'El pedido no tiene productos', errcode = '22023'; end if;

  v_order_number := 'BK-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  insert into public.orders(number, idempotency_key, customer_name, customer_phone, customer_email, delivery_method, delivery_address, notes, total)
  values (v_order_number, p_idempotency_key, trim(customer->>'name'), trim(customer->>'phone'), lower(trim(customer->>'email')), delivery->>'method', coalesce(delivery->>'address',''), coalesce(delivery->>'notes',''), 0)
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_payload->'items') loop
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 or qty > 100 then raise exception using message = 'Cantidad inválida', errcode = '22023'; end if;
    select * into product_row from public.products where id = item->>'productId' and active = true for update;
    if not found or product_row.sold_out or product_row.stock < qty then raise exception using message = 'Producto sin stock o no disponible', errcode = 'P0001'; end if;
    v_color := left(trim(coalesce(item->>'color', '')), 30);
    if public.color_total(product_row.art) is not null then
      v_art := public.color_adjust(product_row.art, v_color, -qty, true);
      v_new_stock := public.color_total(v_art);
    else
      v_art := product_row.art;
      v_new_stock := product_row.stock - qty;
    end if;
    unit := product_row.price; line_total := unit * qty; v_total := v_total + line_total;
    insert into public.order_items(order_id, product_id, name, color, unit_price, quantity, subtotal) values (v_order_id, product_row.id, product_row.name, v_color, unit, qty, line_total);
    update public.products set stock = v_new_stock, sold_out = (v_new_stock = 0), art = v_art where id = product_row.id;
    items_snapshot := items_snapshot || jsonb_build_array(jsonb_build_object('productId', product_row.id, 'name', product_row.name, 'color', v_color, 'unitPrice', unit, 'quantity', qty, 'subtotal', line_total));
  end loop;

  update public.orders set total = v_total where id = v_order_id;
  return jsonb_build_object('number', v_order_number, 'status', 'pendiente_pago', 'payment', jsonb_build_object('status','pendiente'), 'total', v_total, 'items', items_snapshot, 'createdAt', now());
end;
$$;

-- ---------- Cambiar estado de un pedido (solo admin) ----------
create or replace function public.update_order_status(p_number text, p_status public.order_status) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders; item record; prod public.products; v_art jsonb;
begin
  if not public.is_admin() then raise exception using message = 'No autorizado', errcode = '42501'; end if;
  select * into o from public.orders where number = p_number for update;
  if not found then raise exception using message = 'Pedido inexistente', errcode = 'P0002'; end if;
  if o.status = 'cancelado' and p_status <> 'cancelado' then raise exception using message = 'Un pedido cancelado no puede reabrirse', errcode = '22023'; end if;
  if p_status = 'cancelado' and o.status <> 'cancelado' and o.stock_restored_at is null then
    for item in select product_id, quantity, color from public.order_items where order_id = o.id loop
      select * into prod from public.products where id = item.product_id for update;
      if found then
        v_art := public.color_adjust(prod.art, item.color, item.quantity, false);
        if v_art is distinct from prod.art then
          update public.products set art = v_art, stock = public.color_total(v_art), sold_out = false where id = prod.id;
        else
          update public.products set stock = stock + item.quantity, sold_out = false where id = prod.id;
        end if;
      end if;
    end loop;
    update public.orders set stock_restored_at = now() where id = o.id;
  end if;
  update public.orders set status = p_status where id = o.id returning * into o;
  return jsonb_build_object('number', o.number, 'status', o.status, 'total', o.total, 'stockRestoredAt', o.stock_restored_at);
end;
$$;

-- ---------- Registrar una venta en el local (solo admin) ----------
create or replace function public.create_store_sale(p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  product_row public.products;
  v_sale_id bigint;
  v_number text;
  v_total numeric(12,2) := 0;
  v_method text := coalesce(p_payload->>'payment', '');
  v_product_id text;
  v_name text;
  v_color text;
  qty integer;
  v_art jsonb;
  v_new_stock integer;
  unit numeric(12,2);
  line_total numeric(12,2);
begin
  if not public.is_admin() then raise exception using message = 'No autorizado', errcode = '42501'; end if;
  if v_method not in ('efectivo','transferencia','debito','credito','mercadopago','otro') then
    raise exception using message = 'Medio de pago inválido', errcode = '22023';
  end if;
  if jsonb_typeof(p_payload->'items') is distinct from 'array'
     or jsonb_array_length(p_payload->'items') = 0
     or jsonb_array_length(p_payload->'items') > 50 then
    raise exception using message = 'La venta no tiene productos', errcode = '22023';
  end if;

  v_number := 'VL-' || lpad(nextval('public.store_sale_seq')::text, 6, '0');
  insert into public.store_sales(number, customer_name, payment_method, notes, total)
  values (v_number, left(trim(coalesce(p_payload->>'customer', '')), 160), v_method, left(trim(coalesce(p_payload->>'notes', '')), 500), 0)
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(p_payload->'items') loop
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 or qty > 1000 then raise exception using message = 'Cantidad inválida', errcode = '22023'; end if;
    v_color := left(trim(coalesce(item->>'color', '')), 30);
    v_product_id := nullif(trim(coalesce(item->>'productId', '')), '');

    if v_product_id is not null then
      select * into product_row from public.products where id = v_product_id for update;
      if not found then raise exception using message = 'El producto ya no existe', errcode = 'P0002'; end if;
      if product_row.stock < qty then
        raise exception using message = 'Stock insuficiente de "' || product_row.name || '" (quedan ' || product_row.stock || ')', errcode = 'P0001';
      end if;
      v_name := product_row.name;
      unit := coalesce((item->>'unitPrice')::numeric, product_row.price);
      if public.color_total(product_row.art) is not null then
        v_art := public.color_adjust(product_row.art, v_color, -qty, true);
        v_new_stock := public.color_total(v_art);
      else
        v_art := product_row.art;
        v_new_stock := product_row.stock - qty;
      end if;
      update public.products set stock = v_new_stock, sold_out = (v_new_stock = 0), art = v_art where id = product_row.id;
    else
      v_name := left(trim(coalesce(item->>'name', '')), 160);
      if char_length(v_name) < 1 then raise exception using message = 'Falta el nombre del producto', errcode = '22023'; end if;
      unit := (item->>'unitPrice')::numeric;
      if unit is null then raise exception using message = 'Falta el precio del producto', errcode = '22023'; end if;
    end if;

    if unit < 0 then raise exception using message = 'Precio inválido', errcode = '22023'; end if;
    line_total := unit * qty;
    v_total := v_total + line_total;
    insert into public.store_sale_items(sale_id, product_id, name, color, unit_price, quantity, subtotal)
    values (v_sale_id, v_product_id, v_name, v_color, unit, qty, line_total);
  end loop;

  update public.store_sales set total = v_total where id = v_sale_id;
  return jsonb_build_object('number', v_number, 'total', v_total);
end;
$$;

-- ---------- Anular una venta del local (solo admin) ----------
create or replace function public.cancel_store_sale(p_number text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.store_sales; item record; prod public.products; v_art jsonb;
begin
  if not public.is_admin() then raise exception using message = 'No autorizado', errcode = '42501'; end if;
  select * into s from public.store_sales where number = p_number for update;
  if not found then raise exception using message = 'Venta inexistente', errcode = 'P0002'; end if;
  if s.status = 'anulada' then
    return jsonb_build_object('number', s.number, 'status', s.status);
  end if;
  for item in select product_id, quantity, color from public.store_sale_items where sale_id = s.id and product_id is not null loop
    select * into prod from public.products where id = item.product_id for update;
    if found then
      v_art := public.color_adjust(prod.art, item.color, item.quantity, false);
      if v_art is distinct from prod.art then
        update public.products set art = v_art, stock = public.color_total(v_art), sold_out = false where id = prod.id;
      else
        update public.products set stock = stock + item.quantity, sold_out = false where id = prod.id;
      end if;
    end if;
  end loop;
  update public.store_sales set status = 'anulada', stock_restored_at = now() where id = s.id returning * into s;
  return jsonb_build_object('number', s.number, 'status', s.status);
end;
$$;
