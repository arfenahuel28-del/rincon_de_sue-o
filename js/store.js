/* ==========================================================
   BLACK – capa de datos de la tienda
   Catálogo · Carrito · Pedidos · Pagos

   Conectado a Supabase. Si la URL de Supabase no está configurada
   en js/config.js, funciona en modo demo (datos locales).
   ========================================================== */
(function () {
  'use strict';

  const cfg = window.BLACK_CONFIG;
  const KEYS = { cart: 'black_cart_v1', orders: 'black_orders_v1', last: 'black_last_order_v1', seq: 'black_order_seq_v1', idem: 'black_idem_v1' };

  /* ---------- Supabase ---------- */
  const sbCfg = cfg.supabase || {};
  const SB_ON = /^https:\/\/[^/\s]+\.supabase\.co\/?$/i.test(sbCfg.url || '') && !!sbCfg.anonKey;
  if (!SB_ON) cfg.demoMode = true;

  let sbPromise = null;
  /* Carga la librería de Supabase una sola vez y devuelve el cliente. */
  function getSB() {
    if (!SB_ON) return Promise.reject(new Error('Supabase no está configurado en js/config.js'));
    if (sbPromise) return sbPromise;
    sbPromise = new Promise((resolve, reject) => {
      const make = () => {
        try { resolve(window.supabase.createClient(sbCfg.url.replace(/\/$/, ''), sbCfg.anonKey)); } catch (e) { sbPromise = null; reject(e); }
      };
      if (window.supabase && window.supabase.createClient) { make(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload = make;
      s.onerror = () => { sbPromise = null; reject(new Error('No se pudo cargar Supabase')); };
      document.head.appendChild(s);
    });
    return sbPromise;
  }

  /* Fila de la base (snake_case) → producto de la web (camelCase) */
  const rowToProduct = (r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
    price: Number(r.price),
    stock: r.stock,
    soldOut: !!r.sold_out,
    category: r.category_id,
    featured: !!r.featured,
    active: r.active !== false,
    image: r.image_url || '',
    art: r.art && r.art.shape ? r.art : { shape: 'bottle', color: '#e11d2e' },
  });

  /* Estados que maneja el panel de administración */
  const ORDER_STATUS = {
    pendiente_pago: 'Pendiente de pago',
    pago_aprobado: 'Pago aprobado',
    pago_rechazado: 'Pago rechazado',
    en_preparacion: 'En preparación',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  const PAYMENT_STATUS = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

  /* ---------- Utilidades ---------- */
  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignorar */ } },
  };
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const fmt = (n) => money.format(n).replace(/\u00a0/g, ' ');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const waLink = (text) => `https://wa.me/${cfg.business.whatsapp}` + (text ? `?text=${encodeURIComponent(text)}` : '');

  /* Compartir el link del catálogo (productos.html).
     Celular: abre el menú de compartir del teléfono. Si no existe, copia el link.
     Devuelve 'shared', 'cancelled', 'copied' o 'manual'. */
  async function shareCatalog() {
    const url = new URL('productos.html', location.href).href;
    const title = `Catálogo de ${cfg.business.name}`;
    const text = `Mirá los productos de ${cfg.business.name}:`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    }
    try { await navigator.clipboard.writeText(url); return 'copied'; } catch (e) { /* sigue abajo */ }
    window.prompt('Copiá este link del catálogo:', url);
    return 'manual';
  }

  /* ---------- Catálogo ---------- */
  const Catalog = {
    async load() {
      if (SB_ON) {
        try {
          const sb = await getSB();
          const [c, p] = await Promise.all([
            sb.from('categories').select('*').order('sort_order'),
            sb.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).order('name'),
          ]);
          if (c.error || p.error) throw (c.error || p.error);
          window.BLACK_CATEGORIES = c.data.map((x) => ({ id: x.id, name: x.name, icon: x.icon }));
          window.BLACK_PRODUCTS = p.data.map(rowToProduct);
        } catch (e) {
          console.warn('No se pudo leer el catálogo de Supabase; se usa el catálogo local.', e);
        }
        return;
      }
      if (!cfg.endpoints.products) {
        const saved = storage.get('black_admin_catalog_v1', null);
        if (saved && Array.isArray(saved.products)) window.BLACK_PRODUCTS = saved.products;
        return;
      }
      try {
        const r = await fetch(cfg.endpoints.products);
        if (!r.ok) throw new Error('catalog');
        const d = await r.json();
        window.BLACK_PRODUCTS = d.products || d;
        if (d.categories) window.BLACK_CATEGORIES = d.categories;
      } catch (e) { /* si falla, queda el catálogo local */ }
    },
    categories() { return window.BLACK_CATEGORIES || []; },
    products() { return (window.BLACK_PRODUCTS || []).filter((p) => p.active !== false); },
    get(id) { return this.products().find((p) => p.id === id); },
    categoryName(id) { const c = this.categories().find((x) => x.id === id); return c ? c.name : ''; },
    isAvailable(p) { return !p.soldOut && p.stock > 0; },
  };

  /* ---------- Carrito (persiste en localStorage entre páginas) ---------- */
  const Cart = {
    _read() {
      const v = storage.get(KEYS.cart, []);
      return Array.isArray(v) ? v.filter((i) => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0) : [];
    },
    _write(items) {
      storage.set(KEYS.cart, items);
      document.dispatchEvent(new CustomEvent('cart:change'));
    },
    count() { return this._read().reduce((n, i) => n + i.qty, 0); },
    qtyOf(id) { const it = this._read().find((i) => i.id === id); return it ? it.qty : 0; },
    lines() {
      return this._read()
        .map((i) => {
          const p = Catalog.get(i.id);
          return p ? { product: p, qty: i.qty, unitPrice: p.price, subtotal: p.price * i.qty } : null;
        })
        .filter(Boolean);
    },
    total() { return this.lines().reduce((sum, l) => sum + l.subtotal, 0); },
    add(id, qty = 1) {
      const p = Catalog.get(id);
      if (!p || !Catalog.isAvailable(p)) return { ok: false, reason: 'sin_stock' };
      const items = this._read();
      const it = items.find((i) => i.id === id);
      const current = it ? it.qty : 0;
      if (current >= p.stock) return { ok: false, reason: 'max' };
      const next = Math.min(current + qty, p.stock);
      if (it) it.qty = next; else items.push({ id, qty: next });
      this._write(items);
      return { ok: true, qty: next };
    },
    setQty(id, qty) {
      if (qty <= 0) return this.remove(id);
      const p = Catalog.get(id);
      if (!p) return this.remove(id);
      const items = this._read();
      const it = items.find((i) => i.id === id);
      if (!it) return;
      it.qty = Math.min(qty, p.stock);
      this._write(items);
    },
    remove(id) { this._write(this._read().filter((i) => i.id !== id)); },
    clear() { this._write([]); },
    reconcile() {
      const notes = [];
      const out = [];
      this._read().forEach((i) => {
        const p = Catalog.get(i.id);
        if (!p || !Catalog.isAvailable(p)) { notes.push(`${p ? p.name : 'Un producto'} ya no está disponible y lo quitamos del carrito.`); return; }
        if (i.qty > p.stock) { notes.push(`Ajustamos ${p.name} al stock disponible (${p.stock}).`); out.push({ id: i.id, qty: p.stock }); return; }
        out.push(i);
      });
      if (notes.length) this._write(out);
      return notes;
    },
  };

  /* ---------- Pedidos ---------- */
  const nextNumber = () => {
    const n = (storage.get(KEYS.seq, 0) || 0) + 1;
    storage.set(KEYS.seq, n);
    return 'BK-' + String(n).padStart(6, '0');
  };
  const newKey = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'k-' + Date.now() + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  };

  const Orders = {
    buildPayload(form, lines) {
      const items = lines.map((l) => ({ productId: l.product.id, name: l.product.name, unitPrice: l.unitPrice, quantity: l.qty, subtotal: l.subtotal }));
      const method = cfg.delivery.find((d) => d.id === form.delivery) || cfg.delivery[0];
      return {
        customer: { name: form.name, phone: form.phone, email: form.email },
        delivery: { method: method.id, label: method.label, address: method.needsAddress ? form.address : '', notes: form.notes },
        items,
        total: items.reduce((s, i) => s + i.subtotal, 0),
      };
    },
    /* Con Supabase: la función create_order recalcula precios, verifica y
       descuenta stock, y asigna el número de pedido. El navegador no decide nada. */
    async submit(payload) {
      let order;
      if (SB_ON) {
        const sb = await getSB();
        let key = storage.get(KEYS.idem, null);
        if (typeof key !== 'string' || key.length < 16) { key = newKey(); storage.set(KEYS.idem, key); }
        const { data, error } = await sb.rpc('create_order', { p_payload: payload, p_idempotency_key: key });
        if (error) { const e = new Error('orders'); e.detail = error.message; throw e; }
        order = Object.assign({}, payload, data, {
          payment: data.payment || { status: 'pendiente', provider: null, providerPaymentId: null },
        });
        delete order.duplicate;
        storage.remove(KEYS.idem);
      } else if (cfg.endpoints.orders) {
        const res = await fetch(cfg.endpoints.orders, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('orders');
        order = await res.json();
      } else {
        order = Object.assign({}, payload, {
          number: nextNumber(),
          createdAt: new Date().toISOString(),
          status: 'pendiente_pago',
          payment: { status: 'pendiente', provider: null, providerPaymentId: null },
          demo: true,
        });
        storage.set(KEYS.orders, storage.get(KEYS.orders, []).concat(order));
      }
      storage.set(KEYS.last, order);
      Cart.clear();
      return order;
    },
    last() { return storage.get(KEYS.last, null); },
  };

  /* ---------- Pagos (sin integración real todavía) ---------- */
  const Payments = {
    enabled() { return cfg.payments.provider === 'mercadopago' && !!cfg.endpoints.paymentPreference; },
    async begin(order) {
      if (!this.enabled()) return { redirected: false };
      const res = await fetch(cfg.endpoints.paymentPreference, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: order.number }) });
      if (!res.ok) throw new Error('payment');
      const data = await res.json();
      if (!data.checkoutUrl) throw new Error('payment');
      window.location.assign(data.checkoutUrl);
      return { redirected: true };
    },
  };

  /* Si falta assets/logo/logo.png, se muestra el nombre en texto en vez de una imagen rota */
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('brand-logo')) {
      const span = document.createElement('span');
      span.className = 'brand-text';
      span.textContent = 'BLACK';
      t.replaceWith(span);
    }
  }, true);

  window.BLACK = { cfg, Catalog, Cart, Orders, Payments, ORDER_STATUS, PAYMENT_STATUS, fmt, esc, norm, waLink, shareCatalog, storage, SB_ON, getSB, rowToProduct };
})();
