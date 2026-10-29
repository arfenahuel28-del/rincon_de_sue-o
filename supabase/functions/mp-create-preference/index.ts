// ==========================================================
// RINCÓN DE SUEÑO – Mercado Pago: crear el link de pago
//
// La tienda llama a esta función cuando el cliente elige pagar con tarjeta.
// Busca el pedido en la base, arma el cobro en Mercado Pago y devuelve la
// dirección de la página segura de Mercado Pago donde el cliente paga.
// Los datos de la tarjeta los carga el cliente en Mercado Pago: nunca pasan
// por la tienda ni por esta función.
//
// Secrets que necesita (Supabase → Edge Functions → Secrets):
//   MP_ACCESS_TOKEN   Access Token de tu cuenta de Mercado Pago (secreto)
//   SITE_URL          Dirección de tu tienda, ej: https://www.mitienda.com.ar
//   MP_STATEMENT      (opcional) Texto que ve el cliente en el resumen de su tarjeta (hasta 22 letras)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// ==========================================================

const MP_API = 'https://api.mercadopago.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Qué medios de Mercado Pago se ocultan según lo que eligió el cliente en la tienda
const EXCLUDED: Record<string, string[]> = {
  debito: ['credit_card', 'ticket', 'atm', 'bank_transfer'],
  credito: ['debit_card', 'prepaid_card', 'ticket', 'atm', 'bank_transfer'],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return reply({ error: 'Método no permitido' }, 405);

  const token = Deno.env.get('MP_ACCESS_TOKEN');
  const site = (Deno.env.get('SITE_URL') || '').replace(/\/+$/, '');
  const sbUrl = Deno.env.get('SUPABASE_URL');
  const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token || !site || !sbUrl || !sbKey) return reply({ error: 'Falta configurar la función' }, 500);

  let input: { orderNumber?: string; email?: string; method?: string };
  try { input = await req.json(); } catch (_e) { return reply({ error: 'Datos inválidos' }, 400); }
  const number = String(input.orderNumber || '');
  const email = String(input.email || '').trim().toLowerCase();
  const method = String(input.method || '');
  if (!/^BK-\d{6,}$/.test(number) || !email || !EXCLUDED[method]) return reply({ error: 'Datos inválidos' }, 400);

  // El pedido se lee con la clave de servicio; para pagarlo hay que conocer el número y el email con el que se hizo
  const q = `${sbUrl}/rest/v1/orders?number=eq.${encodeURIComponent(number)}&select=number,total,status,payment_status,customer_email,customer_name,order_items(name,unit_price,quantity)`;
  const r = await fetch(q, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!r.ok) return reply({ error: 'No se pudo leer el pedido' }, 502);
  const order = (await r.json())[0];
  if (!order || String(order.customer_email).toLowerCase() !== email) return reply({ error: 'Pedido no encontrado' }, 404);
  if (order.status !== 'pendiente_pago' || order.payment_status !== 'pendiente') return reply({ error: 'Este pedido ya no se puede pagar online' }, 409);

  const items = (order.order_items || []).map((i: { name: string; unit_price: number | string; quantity: number }) => ({
    title: String(i.name).slice(0, 250),
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    currency_id: 'ARS',
  }));
  const sum = items.reduce((t: number, i: { quantity: number; unit_price: number }) => t + i.quantity * i.unit_price, 0);
  if (!items.length || Math.abs(sum - Number(order.total)) > 0.01) return reply({ error: 'El total del pedido no coincide' }, 409);

  const back = `${site}/pedido.html`;
  const preference = {
    items,
    payer: { email, name: String(order.customer_name || '').slice(0, 80) },
    external_reference: number,
    back_urls: { success: back, pending: back, failure: back },
    auto_return: 'approved',
    notification_url: `${sbUrl}/functions/v1/mp-webhook`,
    payment_methods: { excluded_payment_types: EXCLUDED[method].map((id) => ({ id })) },
    statement_descriptor: (Deno.env.get('MP_STATEMENT') || 'RINCON DE SUENO').slice(0, 22),
    binary_mode: false,
  };

  const mp = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `${number}-${method}` },
    body: JSON.stringify(preference),
  });
  const data = await mp.json().catch(() => ({}));
  if (!mp.ok) { console.error('Mercado Pago rechazó la preferencia', mp.status, JSON.stringify(data)); return reply({ error: 'Mercado Pago no pudo crear el pago' }, 502); }

  const checkoutUrl = token.startsWith('TEST-') && data.sandbox_init_point ? data.sandbox_init_point : data.init_point;
  if (!checkoutUrl) return reply({ error: 'Mercado Pago no devolvió el link de pago' }, 502);
  return reply({ checkoutUrl });
});
