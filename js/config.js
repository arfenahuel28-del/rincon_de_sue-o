/* ==========================================================
   BLACK – configuración de la tienda
   Todo lo que cambia entre "demo" y "producción" está acá.
   ========================================================== */
window.BLACK_CONFIG = {
  business: {
    name: 'BLACK Lubricentro y Cosmética Vehicular',
    // ⚠️ Datos de ejemplo: reemplazar por los reales.
    phone: '+54 9 358 123 4567',
    whatsapp: '5493581234567',          // formato internacional, sin + ni espacios
    instagram: 'black.lubricentro',
    address: 'Av. San Martín 1234',
    city: 'Río Cuarto, Córdoba',
    hours: [
      ['Lunes a viernes', '8:00 – 20:00'],
      ['Sábados', '8:00 – 14:00'],
    ],
  },

  /* ---------- SUPABASE ----------
     1) Pegá tu Project URL entre las comillas (Project Settings → API).
     2) La clave publishable es pública: puede estar en la web.
     ⚠️ NUNCA pongas acá la clave "secret" ni la "service_role". */
  supabase: {
    url: 'PEGAR_URL_AQUI',   // ej: 'https://abcdefghijk.supabase.co'
    anonKey: 'PEGAR_CLAVE_PUBLISHABLE_AQUI',   // empieza con sb_publishable_
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
