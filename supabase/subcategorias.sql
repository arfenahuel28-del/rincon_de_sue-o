-- ==========================================================
-- RINCÓN DE SUEÑO – filtros por categoría (Supabase)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se corre UNA vez, después de schema.sql. Si lo corrés de nuevo no pasa
-- nada: no borra tus filtros ni tus productos.
--
-- Qué permite: dentro de cada categoría, crear filtros (grupos) con sus
-- opciones. Ejemplo, en la categoría "Sábanas":
--   Filtro "Medida": 1 plaza, 2 plazas, Queen, King
--   Filtro "Composición": Algodón, Poliéster, Microfibra
-- Cada producto de esa categoría elige sus opciones y los clientes pueden
-- filtrar por ellas.
--
-- Qué crea: attribute_groups (con la categoría a la que pertenece) y
-- attribute_values (todos leen, solo el admin escribe). Las elecciones de
-- cada producto se guardan dentro de products.art: no se modifica ninguna
-- tabla existente.
--
-- Si ya habías corrido una versión anterior de este archivo (cuando los
-- grupos eran generales, sin categoría), la última sección limpia esos grupos
-- viejos, que ya no se usan.
-- ==========================================================

create table if not exists public.attribute_groups (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category_id text references public.categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
-- Por si la tabla ya existía de la versión anterior
alter table public.attribute_groups add column if not exists category_id text references public.categories(id) on delete cascade;
create index if not exists attribute_groups_category_idx on public.attribute_groups(category_id, sort_order);

create table if not exists public.attribute_values (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  group_id text not null references public.attribute_groups(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists attribute_values_group_idx on public.attribute_values(group_id, sort_order);

alter table public.attribute_groups enable row level security;
alter table public.attribute_values enable row level security;

-- Grupos: todos leen; solo el administrador escribe
drop policy if exists attribute_groups_read on public.attribute_groups;
create policy attribute_groups_read on public.attribute_groups for select to anon, authenticated using (true);
drop policy if exists attribute_groups_admin_insert on public.attribute_groups;
create policy attribute_groups_admin_insert on public.attribute_groups for insert to authenticated with check ((select public.is_admin()));
drop policy if exists attribute_groups_admin_update on public.attribute_groups;
create policy attribute_groups_admin_update on public.attribute_groups for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists attribute_groups_admin_delete on public.attribute_groups;
create policy attribute_groups_admin_delete on public.attribute_groups for delete to authenticated using ((select public.is_admin()));

-- Valores: igual
drop policy if exists attribute_values_read on public.attribute_values;
create policy attribute_values_read on public.attribute_values for select to anon, authenticated using (true);
drop policy if exists attribute_values_admin_insert on public.attribute_values;
create policy attribute_values_admin_insert on public.attribute_values for insert to authenticated with check ((select public.is_admin()));
drop policy if exists attribute_values_admin_update on public.attribute_values;
create policy attribute_values_admin_update on public.attribute_values for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists attribute_values_admin_delete on public.attribute_values;
create policy attribute_values_admin_delete on public.attribute_values for delete to authenticated using ((select public.is_admin()));

-- Limpieza: los grupos de la versión anterior no pertenecían a ninguna categoría
delete from public.attribute_groups where category_id is null;
