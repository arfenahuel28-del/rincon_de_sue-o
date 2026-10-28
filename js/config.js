/* ==========================================================
   RINCÓN DE SUEÑO – configuración de la tienda
   Todo lo que cambia entre "demo" y "producción" está acá.
   ========================================================== */
window.BLACK_CONFIG = {
  business: {
    name: 'Rincón de Sueño Blanquería',
    // ⚠️ REEMPLAZAR: datos de ejemplo. Cargá los reales antes de publicar.
    phone: '+54 9 358 4158832',                  // REEMPLAZAR
    whatsapp: '5493584158832',                    // REEMPLAZAR (formato internacional, sin + ni espacios)
    instagram: 'rincondesueno_',        // REEMPLAZAR
    address: 'Chiclana 238',       // REEMPLAZAR
    city: 'Rio Cuarto, Cordoba',       // REEMPLAZAR
    hours: [                                      // REEMPLAZAR
      ['Lunes a viernes', '9:30 – 13:00 y 16:30 – 20:00'],
      ['Sábados', '9:30 – 13:00'],
    ],
  },

  /* ---------- SUPABASE ----------
     1) Pegá tu Project URL entre las comillas (Project Settings → API).
     2) La clave publishable es pública: puede estar en la web.
     ⚠️ NUNCA pongas acá la clave "secret" ni la "service_role". */
  supabase: {
    url: 'https://jmwagybpqgvalcrslakw.supabase.co',
    anonKey: 'sb_publishable_NquUhhiXXqL-4va0KqBrHQ_ljpqZYR-',
  },

  /* Se desactiva solo cuando Supabase está bien configurado (ver js/store.js).
     Mientras la URL no esté puesta, la web sigue funcionando en modo demo. */
  demoMode: false,

  /* Ya no se usan con Supabase; quedan por si más adelante hay otro backend. */
  endpoints: {
    products: '',
    orders: '',
    paymentPreference: '',  // POST → { orderNumber } → { checkoutUrl } (Mercado Pago)
  },

  payments: { provider: 'none' },

  /* Medios de pago que ve el cliente al hacer el pedido. Cambiá el texto de "note" para dar los datos
     (por ejemplo el alias de la transferencia). */
  paymentMethods: [
    { id: 'efectivo', label: 'Efectivo', note: 'Pagás en el local al retirar tu pedido, o al recibirlo si coordinamos el envío.' },
    { id: 'transferencia', label: 'Transferencia', note: 'Alias: rincondesueno.rio4 · Titular: Leonardo Nahuel Arfenoni. Después de transferir, mandanos el comprobante por WhatsApp con tu número de pedido.' },
    { id: 'debito', label: 'Tarjeta de débito', note: 'Pagás con tu tarjeta en el local al retirar tu pedido.' },
    { id: 'credito', label: 'Tarjeta de crédito', note: 'Pagás con tu tarjeta en el local al retirar tu pedido. Consultá las cuotas disponibles.' },
  ],

  delivery: [
    { id: 'retiro', label: 'Retiro en el local', note: 'Sin costo. Te avisamos cuando tu pedido esté listo.', needsAddress: false },
    { id: 'envio', label: 'Envío a domicilio', note: 'El costo y la zona de entrega se coordinan con el local.', needsAddress: true },
  ],
};
