/* ==========================================================
   BLACK – lógica de cada página
   (carga después de config.js, products-data.js, store.js, layout.js)
   ========================================================== */
(function () {
  'use strict';
  const B = window.BLACK;
  const { cfg, Catalog, Cart, Orders, Payments, fmt, esc, norm, waLink, ORDER_STATUS, PAYMENT_STATUS } = B;
  const page = document.body.dataset.page;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Enlaces de WhatsApp (canal de consulta, no de pedidos) ---------- */
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

  /* ---------- Tarjeta de producto ---------- */
  function stockInfo(p) {
    if (!Catalog.isAvailable(p)) return { cls: 'out', text: 'Sin stock' };
    if (p.stock <= 5) return { cls: 'low', text: p.stock === 1 ? 'Última unidad' : `Últimas ${p.stock} unidades` };
    return { cls: 'ok', text: 'Disponible' };
  }

  function mediaHTML(p) {
    const art = p.art || { shape: 'bottle', color: '#e11d2e' };
    const drawing = `<svg class="p-art" style="--c:${esc(art.color)}" aria-hidden="true" focusable="false"><use href="#p-${esc(art.shape)}"/></svg>`;
    const photo = p.image ? `<img class="p-photo" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">` : '';
    return drawing + photo;
  }

  function productCard(p) {
    const s = stockInfo(p);
    const avail = Catalog.isAvailable(p);
    return `
    <article class="p-card${avail ? '' : ' is-out'}">
      <div class="p-media">${mediaHTML(p)}</div>
      <div class="p-body">
        <p class="p-cat">${esc(Catalog.categoryName(p.category))}</p>
        <h3 class="p-name">${esc(p.name)}</h3>
        <p class="p-desc">${esc(p.description)}</p>
        <div class="p-meta">
          <span class="p-price">${fmt(p.price)}</span>
          <span class="stock stock-${s.cls}">${s.text}</span>
        </div>
        ${avail
          ? `<button class="btn btn-red btn-block" type="button" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} al carrito"><svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg><span>Agregar<span class="btn-more"> al carrito</span></span></button>`
          : `<button class="btn btn-block" type="button" disabled>Sin stock</button>`}
      </div>
    </article>`;
  }

  /* Imágenes que no cargan: se quita la foto y queda el dibujo del envase */
  document.addEventListener('error', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('p-photo')) e.target.remove();
  }, true);

  /* ---------- Compartir catálogo (página de productos) ---------- */
  const shareBtn = $('#share-catalog');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const r = await B.shareCatalog();
      if (r === 'copied') B.toast('Link del catálogo copiado.');
    });
  }

  /* ---------- Agregar al carrito (desde cualquier página) ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const p = Catalog.get(btn.dataset.add);
    const r = Cart.add(btn.dataset.add);
    if (r.ok) B.toast(`${p.name} agregado al carrito.`, { href: 'carrito.html', label: 'Ver carrito' });
    else B.toast(r.reason === 'max' ? 'Ya tenés en el carrito todo el stock disponible.' : 'Este producto está sin stock.');
  });

  /* ==========================================================
     INICIO
     ========================================================== */
  function initHome() {
    const cats = $('#home-categories');
    if (cats) {
      cats.innerHTML = Catalog.categories().map((c) => `
        <a class="cat-tile" href="productos.html?categoria=${encodeURIComponent(c.id)}">
          <svg class="ico ico-lg" aria-hidden="true"><use href="#i-${esc(c.icon)}"/></svg>
          <span>${esc(c.name)}</span>
        </a>`).join('');
    }
    const feat = $('#home-featured');
    if (feat) {
      const list = Catalog.products().filter((p) => p.featured).sort((a, b) => Catalog.isAvailable(b) - Catalog.isAvailable(a)).slice(0, 8);
      feat.innerHTML = list.map(productCard).join('');
    }
  }

  /* ==========================================================
     PRODUCTOS (catálogo con búsqueda, categorías y orden)
     ========================================================== */
  function initCatalog() {
    const grid = $('#catalog-grid');
    const chips = $('#category-chips');
    const search = $('#catalog-search');
    const sort = $('#catalog-sort');
    const count = $('#catalog-count');
    const title = $('#catalog-title');
    const base = document.title;

    const params = new URLSearchParams(location.search);
    const validCat = (id) => Catalog.categories().some((c) => c.id === id);
    const state = {
      cat: validCat(params.get('categoria')) ? params.get('categoria') : 'all',
      q: params.get('q') || '',
      sort: ['precio-asc', 'precio-desc', 'nombre'].includes(params.get('orden')) ? params.get('orden') : 'destacados',
    };
    search.value = state.q;
    sort.value = state.sort;

    const all = Catalog.products();
    const countBy = (id) => all.filter((p) => id === 'all' || p.category === id).length;

    function renderChips() {
      const items = [{ id: 'all', name: 'Todas' }].concat(Catalog.categories().filter((c) => countBy(c.id) > 0));
      chips.innerHTML = items.map((c) => `<button type="button" class="chip${state.cat === c.id ? ' is-active' : ''}" data-cat="${esc(c.id)}" aria-pressed="${state.cat === c.id}">${esc(c.name)} <span>${countBy(c.id)}</span></button>`).join('');
    }

    function filtered() {
      const q = norm(state.q).trim();
      let list = all.filter((p) => (state.cat === 'all' || p.category === state.cat)
        && (!q || norm(`${p.name} ${p.description} ${Catalog.categoryName(p.category)}`).includes(q)));
      const byName = (a, b) => a.name.localeCompare(b.name, 'es');
      if (state.sort === 'precio-asc') list.sort((a, b) => a.price - b.price);
      else if (state.sort === 'precio-desc') list.sort((a, b) => b.price - a.price);
      else if (state.sort === 'nombre') list.sort(byName);
      else list.sort((a, b) => (Catalog.isAvailable(b) - Catalog.isAvailable(a)) || ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) || byName(a, b));
      return list;
    }

    function render() {
      const list = filtered();
      renderChips();
      count.textContent = list.length === 1 ? '1 producto' : `${list.length} productos`;
      if (!list.length) {
        grid.innerHTML = `<div class="empty"><p><strong>No encontramos productos con esa búsqueda.</strong></p><p>Probá con otra palabra o mirá todas las categorías.</p><button type="button" class="btn btn-line" data-clear>Ver todos los productos</button></div>`;
      } else {
        grid.innerHTML = list.map(productCard).join('');
      }
      const catName = state.cat === 'all' ? '' : Catalog.categoryName(state.cat);
      title.textContent = catName || 'Productos';
      document.title = catName ? `${catName} | ${base}` : base;
      const p = new URLSearchParams();
      if (state.cat !== 'all') p.set('categoria', state.cat);
      if (state.q.trim()) p.set('q', state.q.trim());
      if (state.sort !== 'destacados') p.set('orden', state.sort);
      try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); } catch (e) { /* algunos navegadores lo bloquean en file:// */ }
    }

    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      state.cat = b.dataset.cat;
      render();
      const active = chips.querySelector('.is-active');
      if (active) { active.focus({ preventScroll: true }); if (active.scrollIntoView) active.scrollIntoView({ inline: 'center', block: 'nearest' }); }
    });
    let t;
    search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value; render(); }, 150); });
    $('#catalog-search-form').addEventListener('submit', (e) => { e.preventDefault(); state.q = search.value; render(); });
    sort.addEventListener('change', () => { state.sort = sort.value; render(); });
    grid.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) { state.cat = 'all'; state.q = ''; search.value = ''; render(); }
    });

    render();

    /* Datos estructurados para buscadores (se generan desde el catálogo) */
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: all.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.description,
          category: Catalog.categoryName(p.category),
          offers: { '@type': 'Offer', priceCurrency: 'ARS', price: p.price, availability: Catalog.isAvailable(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
        },
      })),
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  /* ==========================================================
     CARRITO
     ========================================================== */
  function initCart() {
    const root = $('#cart-root');
    const bar = $('#sticky-bar');
    let focusAfter = null;

    function render(notes = []) {
      const lines = Cart.lines();
      const noteHTML = notes.length ? `<div class="notice" role="status">${notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : '';
      document.body.classList.toggle('has-bar', lines.length > 0);

      if (!lines.length) {
        bar.hidden = true;
        root.innerHTML = `${noteHTML}<div class="empty empty-lg"><svg class="ico ico-xl" aria-hidden="true"><use href="#i-cart"/></svg><h2>Tu carrito está vacío</h2><p>Sumá productos del catálogo y armá tu pedido.</p><a class="btn btn-red btn-lg" href="productos.html">Ver productos</a></div>`;
        return;
      }
      const total = Cart.total();
      root.innerHTML = `
      ${noteHTML}
      <div class="cart-layout">
        <table class="cart-table">
          <caption class="sr-only">Productos en tu carrito</caption>
          <thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Precio</th><th scope="col">Subtotal</th></tr></thead>
          <tbody>
            ${lines.map((l) => `
            <tr>
              <td class="c-prod"><div class="c-inner">
                <div class="c-thumb">${mediaHTML(l.product)}</div>
                <div>
                  <p class="c-name">${esc(l.product.name)}</p>
                  <button class="link-btn" type="button" data-remove="${esc(l.product.id)}">Quitar<span class="sr-only"> ${esc(l.product.name)} del carrito</span></button>
                </div>
              </div></td>
              <td class="c-qty" data-label="Cantidad">
                <div class="stepper" role="group" aria-label="Cantidad de ${esc(l.product.name)}">
                  <button type="button" data-qty="${esc(l.product.id)}" data-act="dec" aria-label="Restar uno"><svg class="ico" aria-hidden="true"><use href="#i-minus"/></svg></button>
                  <output aria-live="polite">${l.qty}</output>
                  <button type="button" data-qty="${esc(l.product.id)}" data-act="inc" aria-label="Sumar uno"${l.qty >= l.product.stock ? ' disabled' : ''}><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>
                </div>
              </td>
              <td class="c-price" data-label="Precio">${fmt(l.unitPrice)}</td>
              <td class="c-sub" data-label="Subtotal">${fmt(l.subtotal)}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <aside class="summary" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>${fmt(total)}</dd></div>
            <div class="total"><dt>TOTAL</dt><dd>${fmt(total)}</dd></div>
          </dl>
          <p class="fine">El costo de envío, si elegís envío a domicilio, se coordina con el local.</p>
          <a class="btn btn-red btn-lg btn-block summary-cta" href="checkout.html">Continuar con el pedido</a>
          <a class="btn btn-line btn-block" href="productos.html">Seguir comprando</a>
        </aside>
      </div>`;

      bar.hidden = false;
      bar.innerHTML = `<div><span class="bar-label">Total</span><strong>${fmt(total)}</strong></div><a class="btn btn-red btn-lg" href="checkout.html">Continuar con el pedido</a>`;

      if (focusAfter) {
        const el = root.querySelector(`[data-qty="${focusAfter.id}"][data-act="${focusAfter.act}"]:not([disabled])`) || root.querySelector(`[data-qty="${focusAfter.id}"]:not([disabled])`);
        if (el) el.focus();
        focusAfter = null;
      }
    }

    root.addEventListener('click', (e) => {
      const q = e.target.closest('[data-qty]');
      const r = e.target.closest('[data-remove]');
      if (q) {
        const id = q.dataset.qty;
        focusAfter = { id, act: q.dataset.act };
        Cart.setQty(id, Cart.qtyOf(id) + (q.dataset.act === 'inc' ? 1 : -1));
        render();
      } else if (r) {
        Cart.remove(r.dataset.remove);
        render();
        const h = $('h1');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
    });

    render(Cart.reconcile());
  }

  /* ==========================================================
     CHECKOUT
     ========================================================== */
  function initCheckout() {
    const wrap = $('#checkout-wrap');
    const emptyBox = $('#checkout-empty');
    const form = $('#checkout-form');
    const summary = $('#order-summary');
    const bar = $('#sticky-bar');
    const addressField = $('#address-field');
    const formError = $('#form-error');
    let busy = false;

    const notes = Cart.reconcile();
    if (!Cart.lines().length) {
      wrap.hidden = true;
      emptyBox.hidden = false;
      bar.hidden = true;
      return;
    }
    document.body.classList.add('has-bar');

    /* Opciones de entrega desde la configuración */
    $('#delivery-options').innerHTML = cfg.delivery.map((d, i) => `
      <label class="choice">
        <input type="radio" name="delivery" value="${esc(d.id)}"${i === 0 ? ' checked' : ''}>
        <span class="choice-box"><strong>${esc(d.label)}</strong><small>${esc(d.note)}</small></span>
      </label>`).join('');
    $('#payment-note').textContent = Payments.enabled()
      ? 'Vas a pagar de forma segura con Mercado Pago al confirmar el pedido.'
      : 'El pago se coordina con el local al confirmar tu pedido.';

    function renderSummary(noticeList = []) {
      const lines = Cart.lines();
      const total = Cart.total();
      summary.innerHTML = `
        ${noticeList.length ? `<div class="notice" role="status">${noticeList.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : ''}
        <ul class="order-lines">
          ${lines.map((l) => `<li><span class="ol-name">${esc(l.product.name)}</span><span class="ol-qty">× ${l.qty}</span><span class="ol-price">${fmt(l.subtotal)}</span></li>`).join('')}
        </ul>
        <p class="order-total"><span>Total</span><strong>${fmt(total)}</strong></p>`;
      bar.innerHTML = `<div><span class="bar-label">Total</span><strong>${fmt(total)}</strong></div><button class="btn btn-red btn-lg" type="submit" form="checkout-form">Confirmar pedido</button>`;
    }
    renderSummary(notes);

    const selectedDelivery = () => (form.querySelector('input[name="delivery"]:checked') || {}).value;
    const needsAddress = () => (cfg.delivery.find((d) => d.id === selectedDelivery()) || {}).needsAddress;
    function syncAddress() { addressField.hidden = !needsAddress(); }
    form.addEventListener('change', (e) => { if (e.target.name === 'delivery') syncAddress(); });
    syncAddress();

    const fields = {
      name: { el: form.elements.name, check: (v) => v.trim().length >= 3 && v.trim().includes(' ') ? '' : 'Escribí tu nombre y apellido.' },
      phone: { el: form.elements.phone, check: (v) => { const d = v.replace(/\D/g, ''); return d.length >= 8 && d.length <= 15 ? '' : 'Ingresá un teléfono válido, con código de área.'; } },
      email: { el: form.elements.email, check: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Ingresá un email válido, por ejemplo nombre@correo.com.') },
      address: { el: form.elements.address, check: (v) => (!needsAddress() || v.trim().length >= 5 ? '' : 'Ingresá la dirección de entrega.') },
    };
    const setFieldError = (key, msg) => {
      const f = fields[key];
      const box = $(`#err-${key}`);
      box.textContent = msg;
      if (msg) f.el.setAttribute('aria-invalid', 'true'); else f.el.removeAttribute('aria-invalid');
    };
    Object.keys(fields).forEach((k) => {
      fields[k].el.addEventListener('blur', () => { if (fields[k].el.value || fields[k].el.getAttribute('aria-invalid')) setFieldError(k, fields[k].check(fields[k].el.value)); });
      fields[k].el.addEventListener('input', () => { if (fields[k].el.getAttribute('aria-invalid')) setFieldError(k, fields[k].check(fields[k].el.value)); });
    });

    function validate() {
      let first = null;
      Object.keys(fields).forEach((k) => {
        const msg = fields[k].check(fields[k].el.value);
        setFieldError(k, msg);
        if (msg && !first) first = fields[k].el;
      });
      if (first) { first.focus(); return false; }
      return true;
    }

    function setBusy(v) {
      busy = v;
      $$('[type="submit"]').forEach((b) => { b.disabled = v; if (b.classList.contains('btn')) b.textContent = v ? 'Enviando…' : 'Confirmar pedido'; });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      formError.textContent = '';
      if (!validate()) return;

      /* El stock pudo cambiar mientras el cliente completaba sus datos */
      const changes = Cart.reconcile();
      if (changes.length) {
        if (!Cart.lines().length) { location.href = 'carrito.html'; return; }
        renderSummary(changes);
        formError.textContent = 'Algunos productos cambiaron de stock. Revisá tu pedido y confirmalo de nuevo.';
        return;
      }

      setBusy(true);
      let order;
      try {
        const data = {
          name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), email: form.elements.email.value.trim(),
          delivery: selectedDelivery(), address: form.elements.address.value.trim(), notes: form.elements.notes.value.trim(),
        };
        order = await Orders.submit(Orders.buildPayload(data, Cart.lines()));
      } catch (err) {
        formError.textContent = 'No pudimos enviar tu pedido. Revisá tu conexión e intentá de nuevo.';
        setBusy(false);
        return;
      }
      try {
        const pay = await Payments.begin(order);
        if (pay.redirected) return;
        location.href = 'pedido.html';
      } catch (err) {
        location.href = 'pedido.html?pago=error';
      }
    });
  }

  /* ==========================================================
     CONFIRMACIÓN DEL PEDIDO
     ========================================================== */
  function initOrderDone() {
    const root = $('#order-root');
    const order = Orders.last();
    if (!order) {
      root.innerHTML = `<div class="empty empty-lg"><h2>No hay ningún pedido reciente</h2><p>Cuando confirmes un pedido, lo vas a ver acá.</p><a class="btn btn-red btn-lg" href="productos.html">Ver productos</a></div>`;
      return;
    }
    const params = new URLSearchParams(location.search);
    const mp = params.get('status') || params.get('collection_status');
    let payNote = '';
    if (params.get('pago') === 'error') payNote = 'Recibimos tu pedido, pero no pudimos iniciar el pago online. El local se va a comunicar con vos para coordinarlo.';
    else if (mp === 'rejected') payNote = 'El pago fue rechazado. Tu pedido sigue registrado: contactanos para resolverlo.';
    else if (mp === 'pending' || mp === 'in_process') payNote = 'Tu pago está en proceso. Te avisaremos cuando se acredite.';

    const when = new Date(order.createdAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
    root.innerHTML = `
      <div class="done-head">
        <span class="done-icon"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg></span>
        <div>
          <h1 tabindex="-1" id="done-title">¡Recibimos tu pedido!</h1>
          <p>Pedido <strong>${esc(order.number)}</strong> · ${esc(when)}</p>
        </div>
      </div>
      ${order.demo && cfg.demoMode ? `<div class="notice notice-warn" role="note"><p><strong>Modo demostración.</strong> Este pedido se guardó solo en este dispositivo: BLACK todavía no lo recibe.</p></div>` : ''}
      ${payNote ? `<div class="notice" role="status"><p>${esc(payNote)}</p></div>` : ''}
      <div class="done-grid">
        <section class="card" aria-labelledby="t-order">
          <h2 id="t-order">Tu pedido</h2>
          <ul class="order-lines">
            ${order.items.map((i) => `<li><span class="ol-name">${esc(i.name)}</span><span class="ol-qty">× ${i.quantity}</span><span class="ol-price">${fmt(i.subtotal)}</span></li>`).join('')}
          </ul>
          <p class="order-total"><span>Total</span><strong>${fmt(order.total)}</strong></p>
        </section>
        <section class="card" aria-labelledby="t-data">
          <h2 id="t-data">Detalles</h2>
          <dl class="facts">
            <div><dt>Estado del pedido</dt><dd>${esc(ORDER_STATUS[order.status] || order.status)}</dd></div>
            <div><dt>Estado del pago</dt><dd>${esc(PAYMENT_STATUS[order.payment && order.payment.status] || 'Pendiente')}</dd></div>
            <div><dt>Entrega</dt><dd>${esc(order.delivery.label)}${order.delivery.address ? `<br>${esc(order.delivery.address)}` : ''}</dd></div>
            <div><dt>Cliente</dt><dd>${esc(order.customer.name)}<br>${esc(order.customer.phone)}<br>${esc(order.customer.email)}</dd></div>
            ${order.delivery.notes ? `<div><dt>Observaciones</dt><dd>${esc(order.delivery.notes)}</dd></div>` : ''}
          </dl>
          <p class="fine">${Payments.enabled() ? '' : 'El pago se coordina con el local. '}¿Dudas sobre tu pedido? <a href="${waLink(`Hola BLACK, consulto por mi pedido ${order.number}.`)}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>.</p>
        </section>
      </div>
      <div class="actions-row"><a class="btn btn-red btn-lg" href="productos.html">Seguir comprando</a></div>`;
  }

  /* ==========================================================
     CONTACTO
     ========================================================== */
  function initContact() {
    const b = cfg.business;
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${b.address}, ${b.city}`);
    const card = (href, icon, title, text, external) => `
      <${href ? 'a' : 'div'} class="contact-card"${href ? ` href="${esc(href)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>
        <svg class="ico" aria-hidden="true"><use href="#i-${icon}"/></svg>
        <div><h2>${esc(title)}</h2><p>${text}</p></div>
      </${href ? 'a' : 'div'}>`;
    $('#contact-grid').innerHTML = [
      card('tel:' + b.phone.replace(/[^\d+]/g, ''), 'phone', 'Teléfono', `<strong>${esc(b.phone)}</strong>`),
      card(waLink('Hola BLACK, quiero hacer una consulta.'), 'chat', 'WhatsApp', 'Para consultas sobre productos y servicios.', true),
      card(maps, 'pin', 'Dirección', `${esc(b.address)}<br>${esc(b.city)}<br><strong>Cómo llegar</strong>`, true),
      card('https://instagram.com/' + b.instagram, 'insta', 'Instagram', `@${esc(b.instagram)}`, true),
      card('', 'clock', 'Horarios', b.hours.map(([d, h]) => `${esc(d)}: <strong>${esc(h)}</strong>`).join('<br>')),
    ].join('');
  }

  /* ---------- Arranque ---------- */
  Catalog.load().then(() => {
    if (page === 'home') initHome();
    else if (page === 'productos') initCatalog();
    else if (page === 'carrito') initCart();
    else if (page === 'checkout') initCheckout();
    else if (page === 'pedido') initOrderDone();
    else if (page === 'contacto') initContact();
  });
})();
