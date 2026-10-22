/* ==========================================================
   RINCÓN DE SUEÑO – configuración de la tienda
   Todo lo que cambia entre "demo" y "producción" está acá.
   ========================================================== */
window.BLACK_CONFIG = {
  business: {
    name: 'Rincón de Sueño Blanquería',
    // ⚠️ REEMPLAZAR: datos de ejemplo. Cargá los reales antes de publicar.
    phone: '+54 9 000 000 0000',                  // REEMPLAZAR
    whatsapp: '5490000000000',                    // REEMPLAZAR (formato internacional, sin + ni espacios)
    instagram: 'rincondesueno.blanqueria',        // REEMPLAZAR
    address: 'Calle y número (REEMPLAZAR)',       // REEMPLAZAR
    city: 'Ciudad, Provincia (REEMPLAZAR)',       // REEMPLAZAR
    hours: [                                      // REEMPLAZAR
      ['Lunes a viernes', '9:00 – 13:00 y 16:30 – 20:00'],
      ['Sábados', '9:00 – 13:00'],
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

  delivery: [
    { id: 'retiro', label: 'Retiro en el local', note: 'Sin costo. Te avisamos cuando tu pedido esté listo.', needsAddress: false },
    { id: 'envio', label: 'Envío a domicilio', note: 'El costo y la zona de entrega se coordinan con el local.', needsAddress: true },
  ],
};
