// ==========================================================
// RINCÓN DE SUEÑO – Mercado Pago: aviso de pago
//
// Mercado Pago avisa a esta función cada vez que cambia un pago. La función
// NO confía en el aviso: consulta el pago directamente a Mercado Pago, controla
// que corresponda a un pedido y que el monto alcance, y recién ahí marca el
// pedido como "Pago aprobado" (o "Pago rechazado") en tu panel.
//
// IMPORTANTE: esta función se despliega SIN verificación JWT, porque Mercado
// Pago no tiene una sesión de Supabase (ver supabase/MERCADOPAGO.md).
//
// Secrets (Supabase → Edge Functions → Secrets):
//   MP_ACCESS_TOKEN     Access Token de tu cuenta de Mercado Pago (secreto)
//   MP_WEBHOOK_SECRET   (recomendado) "Clave secreta" de las notificaciones de Mercado Pago
// ==========================================================

const MP_API = 'https://api.mercadopago.com';
const ok = (body: unknown = { ok: true }, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

// Firma de Mercado Pago: HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con la clave secreta
async function validSignature(req: Request, dataId: string, secret: string): Promise<boolean> {
  const sig = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';
  const parts: Record<string, string> = {};
  sig.split(',').forEach((p) => { const i = p.indexOf('='); if (i > 0) parts[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  if (mac.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  const token = Deno.env.get('MP_ACCESS_TOKEN');
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  const sbUrl = Deno.env.get('SUPABASE_URL');
  const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token || !sbUrl || !sbKey) return ok({ error: 'Falta configurar la función' }, 500);

  const url = new URL(req.url);
  let dataId = url.searchParams.get('data.id') || '';
  let type = url.searchParams.get('type') || url.searchParams.get('topic') || '';
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (!dataId && body && body.data && body.data.id) dataId = String(body.data.id);
      if (!type && body && body.type) type = String(body.type);
    } catch (_e) { /* sin cuerpo */ }
  }
  // Solo nos interesan los avisos de pagos
  if (type !== 'payment' || !dataId) return ok({ ignored: true });

  if (secret) {
    const queryId = url.searchParams.get('data.id') || dataId;
    if (!(await validSignature(req, queryId, secret))) return ok({ error: 'Firma inválida' }, 401);
  }

  // Se consulta el pago real a Mercado Pago
  const pr = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (pr.status === 404) return ok({ ignored: true });
  if (!pr.ok) return ok({ error: 'No se pudo consultar el pago' }, 502);   // Mercado Pago reintenta
  const payment = await pr.json();
  const number = String(payment.external_reference || '');
  if (!/^BK-\d{6,}$/.test(number)) return ok({ ignored: true });

  const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };
  const or = await fetch(`${sbUrl}/rest/v1/orders?number=eq.${encodeURIComponent(number)}&select=number,total,status,payment_status`, { headers });
  if (!or.ok) return ok({ error: 'No se pudo leer el pedido' }, 502);
  const order = (await or.json())[0];
  if (!order) return ok({ ignored: true });

  let patch: Record<string, string> | null = null;
  let only: string[] = [];   // estados desde los que se permite el cambio (evita pisar un pedido ya avanzado o cancelado)
  if (payment.status === 'approved') {
    if (Number(payment.transaction_amount) + 0.01 < Number(order.total)) {
      console.error('Monto menor al del pedido', number, payment.transaction_amount, order.total);
      return ok({ ignored: 'monto' });
    }
    patch = { payment_status: 'aprobado', status: 'pago_aprobado' };
    only = ['pendiente_pago', 'pago_rechazado'];
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    patch = { payment_status: 'rechazado', status: 'pago_rechazado' };
    only = ['pendiente_pago'];
  }
  if (!patch || !only.includes(order.status)) return ok({ unchanged: true });

  const upd = await fetch(`${sbUrl}/rest/v1/orders?number=eq.${encodeURIComponent(number)}&status=eq.${order.status}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!upd.ok) return ok({ error: 'No se pudo actualizar el pedido' }, 502);
  return ok({ updated: number, payment_status: patch.payment_status });
});
