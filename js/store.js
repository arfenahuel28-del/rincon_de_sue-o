/* ==========================================================
   RINCÓN DE SUEÑO – capa de datos de la tienda
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

  /* Colores disponibles de un producto. Se guardan dentro de la columna art (jsonb) como
     art.colors = [{ name: 'Rojo', hex: '#c0392b' }, ...], así no hace falta cambiar la base. */
  const cleanColors = (art) => (art && Array.isArray(art.colors) ? art.colors : [])
    .filter((c) => c && typeof c.name === 'string' && c.name.trim())
    .map((c) => {
      const out = { name: c.name.trim().slice(0, 30), hex: /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '#cccccc' };
      /* stock: unidades de ese color (opcional). image: foto de la estampa (opcional, solo https o ruta del sitio). */
      if (Number.isInteger(c.stock) && c.stock >= 0) out.stock = c.stock;
      if (typeof c.image === 'string' && /^(https:\/\/|assets\/)/.test(c.image) && c.image.length <= 500) out.image = c.image;
      return out;
    });

  /* Fotos del producto: art.images = [url, ...] (la primera es la principal). Se acepta solo https o rutas del sitio. */
  const okUrl = (u) => typeof u === 'string' && /^(https:\/\/|assets\/)/.test(u) && u.length <= 500;
  const cleanImages = (art, main) => {
    const list = (art && Array.isArray(art.images) ? art.images : []).filter(okUrl);
    if (okUrl(main) && !list.includes(main)) list.unshift(main);
    return list.filter((u, i) => list.indexOf(u) === i).slice(0, 8);
  };
  /* Subcategorías del producto: art.attrs = { idDelGrupo: [idDelValor, ...] } */
  const cleanAttrs = (art) => {
    const out = {};
    const src = art && art.attrs && typeof art.attrs === 'object' && !Array.isArray(art.attrs) ? art.attrs : {};
    Object.keys(src).forEach((g) => {
      const vals = Array.isArray(src[g]) ? src[g].filter((v) => typeof v === 'string') : [];
      if (vals.length) out[g] = vals;
    });
    return out;
  };

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
    image: cleanImages(r.art, r.image_url)[0] || r.image_url || '',
    images: cleanImages(r.art, r.image_url),
    attrs: cleanAttrs(r.art),
    art: r.art && r.art.shape ? r.art : { shape: 'folded', color: '#b9a3b0' },
    colors: cleanColors(r.art),
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
          /* Subcategorías: si todavía no se creó la tabla, la tienda funciona igual sin filtros */
          try {
            const [g, v] = await Promise.all([
              sb.from('attribute_groups').select('*').order('sort_order'),
              sb.from('attribute_values').select('*').order('sort_order'),
            ]);
            if (g.error || v.error) throw (g.error || v.error);
            window.BLACK_ATTRS = g.data.filter((x) => x.category_id).map((x) => ({ id: x.id, categoryId: x.category_id, name: x.name, values: v.data.filter((y) => y.group_id === x.id).map((y) => ({ id: y.id, name: y.name })) }));
          } catch (e2) { window.BLACK_ATTRS = []; }
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
    /* Filtros de una categoría (grupos con sus opciones). Solo cuentan los grupos que tienen opciones. */
    attrGroups(categoryId) { return (window.BLACK_ATTRS || []).filter((g) => g.values && g.values.length && (!categoryId || g.categoryId === categoryId)); },
    /* Las del producto, listas para mostrar: [{ id, name, values: [{id, name}] }] */
    attrsOf(p) {
      const mine = (p && p.attrs) || {};
      return this.attrGroups(p && p.category)
        .map((g) => ({ id: g.id, name: g.name, values: g.values.filter((v) => (mine[g.id] || []).includes(v.id)) }))
        .filter((g) => g.values.length);
    },
    images(p) { return p && Array.isArray(p.images) && p.images.length ? p.images : (p && p.image ? [p.image] : []); },
    get(id) { return this.products().find((p) => p.id === id); },
    categoryName(id) { const c = this.categories().find((x) => x.id === id); return c ? c.name : ''; },
    isAvailable(p) { return !p.soldOut && p.stock > 0; },
    colors(p) { return p && Array.isArray(p.colors) ? p.colors : []; },
    colorStock(p, name) { const c = this.colors(p).find((x) => x.name === name); return c && Number.isInteger(c.stock) ? c.stock : null; },
    colorImage(p, name) { const c = this.colors(p).find((x) => x.name === name); return c && c.image ? c.image : ''; },
    colorHex(p, name) { const c = this.colors(p).find((x) => x.name === name); return c ? c.hex : ''; },
  };

  /* ---------- Carrito (persiste en localStorage entre páginas) ----------
     Cada línea es { id, qty, color }. El mismo producto puede estar en varias líneas
     (una por color), pero el stock es uno solo: la suma de todas no puede superarlo. */
  const Cart = {
    _read() {
      const v = storage.get(KEYS.cart, []);
      return Array.isArray(v)
        ? v.filter((i) => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0)
            .map((i) => ({ id: i.id, qty: i.qty, color: typeof i.color === 'string' ? i.color : '' }))
        : [];
    },
    _write(items) {
      storage.set(KEYS.cart, items);
      document.dispatchEvent(new CustomEvent('cart:change'));
    },
    count() { return this._read().reduce((n, i) => n + i.qty, 0); },
    qtyOf(id, color = '') { const it = this._read().find((i) => i.id === id && i.color === color); return it ? it.qty : 0; },
    /* Unidades máximas que se pueden tener en una línea (producto + color). Si el color tiene stock propio manda ese; si no, el stock general. */
    limitOf(id, color = '') {
      const p = Catalog.get(id);
      if (!p) return 0;
      const cs = Catalog.colorStock(p, color);
      if (cs !== null) return cs;
      const others = this._read().filter((i) => i.id === id && i.color !== color && Catalog.colorStock(p, i.color) === null).reduce((n, i) => n + i.qty, 0);
      return Math.max(0, p.stock - others);
    },
    totalOf(id) { return this._read().filter((i) => i.id === id).reduce((n, i) => n + i.qty, 0); },
    lines() {
      return this._read()
        .map((i) => {
          const p = Catalog.get(i.id);
          return p ? { product: p, qty: i.qty, color: i.color, unitPrice: p.price, subtotal: p.price * i.qty } : null;
        })
        .filter(Boolean);
    },
    total() { return this.lines().reduce((sum, l) => sum + l.subtotal, 0); },
    add(id, qty = 1, color = '') {
      const p = Catalog.get(id);
      if (!p || !Catalog.isAvailable(p)) return { ok: false, reason: 'sin_stock' };
      const colors = Catalog.colors(p);
      if (colors.length && !colors.some((c) => c.name === color)) return { ok: false, reason: 'color' };
      if (!colors.length) color = '';
      const items = this._read();
      const it = items.find((i) => i.id === id && i.color === color);
      const have = it ? it.qty : 0;
      const room = this.limitOf(id, color) - have;
      if (Catalog.colorStock(p, color) === 0) return { ok: false, reason: 'sin_stock' };
      if (room <= 0) return { ok: false, reason: 'max' };
      const inc = Math.min(qty, room);
      if (it) it.qty += inc; else items.push({ id, qty: inc, color });
      this._write(items);
      return { ok: true, qty: it ? it.qty : inc };
    },
    setQty(id, qty, color = '') {
      if (qty <= 0) return this.remove(id, color);
      const p = Catalog.get(id);
      if (!p) return this.remove(id, color);
      const items = this._read();
      const it = items.find((i) => i.id === id && i.color === color);
      if (!it) return;
      const next = Math.min(qty, this.limitOf(id, color));
      if (next <= 0) return this.remove(id, color);
      it.qty = next;
      this._write(items);
    },
    remove(id, color = '') { this._write(this._read().filter((i) => !(i.id === id && i.color === color))); },
    clear() { this._write([]); },
    reconcile() {
      const notes = [];
      const out = [];
      const used = {};
      this._read().forEach((i) => {
        const p = Catalog.get(i.id);
        if (!p || !Catalog.isAvailable(p)) { notes.push(`${p ? p.name : 'Un producto'} ya no está disponible y lo quitamos del carrito.`); return; }
        const colors = Catalog.colors(p);
        let color = i.color;
        if (colors.length) {
          if (!color) { notes.push(`${p.name} ahora se vende en varios colores: lo quitamos del carrito. Volvé a agregarlo eligiendo el color.`); return; }
          if (!colors.some((c) => c.name === color)) { notes.push(`El color ${color} de ${p.name} ya no está disponible y lo quitamos del carrito.`); return; }
        } else color = '';
        const cs = Catalog.colorStock(p, color);
        const key = cs !== null ? i.id + '|' + color : i.id;
        const left = (cs !== null ? cs : p.stock) - (used[key] || 0);
        const label = p.name + (color ? ` (${color})` : '');
        if (left <= 0) { notes.push(`${label} ya no tiene stock suficiente y lo quitamos del carrito.`); return; }
        const qty = Math.min(i.qty, left);
        if (qty < i.qty) notes.push(`Ajustamos ${label} al stock disponible (${left}).`);
        used[key] = (used[key] || 0) + qty;
        const same = out.find((o) => o.id === i.id && o.color === color);
        if (same) same.qty += qty; else out.push({ id: i.id, qty, color });
      });
      if (notes.length || JSON.stringify(out) !== JSON.stringify(this._read())) this._write(out);
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
      const items = lines.map((l) => ({ productId: l.product.id, name: l.product.name, color: l.color || '', unitPrice: l.unitPrice, quantity: l.qty, subtotal: l.subtotal }));
      /* La base no guarda el color en cada línea: se agrega a las observaciones para que el local lo vea en el pedido. */
      const colorLines = lines.filter((l) => l.color).map((l) => `${l.product.name} → ${l.color} (×${l.qty})`);
      const pay = (cfg.paymentMethods || []).find((m) => m.id === form.payment) || null;
      const notes = [form.notes, colorLines.length ? 'Colores elegidos:\n' + colorLines.join('\n') : '', pay ? 'Medio de pago elegido: ' + pay.label : ''].filter(Boolean).join('\n\n');
      const method = cfg.delivery.find((d) => d.id === form.delivery) || cfg.delivery[0];
      return {
        customer: { name: form.name, phone: form.phone, email: form.email },
        delivery: { method: method.id, label: method.label, address: method.needsAddress ? form.address : '', notes },
        items,
        customerNotes: form.notes || '',
        paymentMethod: pay ? (Payments.isOnlineMethod(pay) ? { id: pay.id, label: pay.label, note: pay.noteOnline || pay.note, online: true } : { id: pay.id, label: pay.label, note: pay.note }) : null,
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
        /* La respuesta de la base no trae el color: se vuelve a poner para mostrarlo en la confirmación. */
        if (Array.isArray(order.items) && order.items.length === payload.items.length) {
          order.items = order.items.map((it, n) => Object.assign({}, it, { color: payload.items[n].color || '' }));
        }
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
    /* Activo cuando payments.provider es 'mercadopago' (la función se busca sola en tu Supabase) */
    enabled() { return cfg.payments.provider === 'mercadopago' && (SB_ON || !!cfg.endpoints.paymentPreference); },
    /* ¿Este medio de pago se cobra online (Mercado Pago)? */
    isOnlineMethod(m) { return this.enabled() && !!m && m.online === true; },
    async begin(order) {
      if (!this.enabled() || !order || !order.paymentMethod || !order.paymentMethod.online) return { redirected: false };
      /* Las funciones de Supabase piden la clave pública (anon) en la cabecera */
      const auth = SB_ON ? { apikey: sbCfg.anonKey, Authorization: 'Bearer ' + sbCfg.anonKey } : {};
      const url = cfg.endpoints.paymentPreference || `${sbCfg.url.replace(/\/$/, '')}/functions/v1/mp-create-preference`;
      const res = await fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, auth), body: JSON.stringify({ orderNumber: order.number, email: order.customer.email, method: order.paymentMethod.id }) });
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
      span.textContent = 'Rincón de Sueño';
      t.replaceWith(span);
    }
  }, true);

  window.BLACK = { cfg, Catalog, Cart, Orders, Payments, ORDER_STATUS, PAYMENT_STATUS, fmt, esc, norm, waLink, shareCatalog, storage, SB_ON, getSB, rowToProduct };
})();
