/* ==========================================================
   RINCÓN DE SUEÑO – elementos compartidos: íconos, dibujos de
   producto, header (con carrito siempre visible), footer y avisos.
   Se edita acá una sola vez. También se carga en el panel de
   administración (admin.html) para que se vean los dibujos y los
   íconos de categoría.
   ========================================================== */
(function () {
  'use strict';
  const { cfg, Cart, esc } = window.BLACK;
  const b = cfg.business;
  const page = document.body.dataset.page;

  /* ---------- Íconos y dibujos de producto ---------- */
  const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const sprite = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <symbol id="i-cart" viewBox="0 0 24 24"><path ${stroke} d="M3 4h2.5l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></symbol>
  <symbol id="i-bedline" viewBox="0 0 48 44"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M11 22V9a5 5 0 0 1 5-5h16a5 5 0 0 1 5 5v13M15 22v-6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v6M23 22v-6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v6M6 40V29a7 7 0 0 1 7-7h22a7 7 0 0 1 7 7v11M6 34h36"/></symbol>

  <!-- Íconos de categoría (los que se pueden elegir en el panel) -->
  <symbol id="i-bed" viewBox="0 0 24 24"><path ${stroke} d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="1.8" ${stroke}/></symbol>
  <symbol id="i-quilt" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2" ${stroke}/><path ${stroke} d="M4 12h16M12 5v14"/></symbol>
  <symbol id="i-pillow" viewBox="0 0 24 24"><path ${stroke} d="M4.5 8.5Q5 6 8 6h8q3 0 3.5 2.5-1 3.5 0 7-.5 2.5-3.5 2.5H8q-3 0-3.5-2.5 1-3.5 0-7z"/></symbol>
  <symbol id="i-towel" viewBox="0 0 24 24"><path ${stroke} d="M5 4h14M7 4v14.5a1.5 1.5 0 0 0 1.5 1.5H17V4M7 9h10M7 14h10"/></symbol>
  <symbol id="i-curtain" viewBox="0 0 24 24"><path ${stroke} d="M3 4h18M5 4v16h6V4M13 4v16h6V4"/></symbol>
  <symbol id="i-table" viewBox="0 0 24 24"><path ${stroke} d="M3 8h18v3H3zM6 11v9M18 11v9"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path ${stroke} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></symbol>
  <symbol id="i-tag" viewBox="0 0 24 24"><path ${stroke} d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3" fill="currentColor"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path ${stroke} d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path ${stroke} d="M12 3l7 3v5.5c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6z"/><path ${stroke} d="M9 12l2.2 2.2L15.5 10"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path ${stroke} d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/></symbol>
  <symbol id="i-dots" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/></symbol>

  <!-- Íconos de la interfaz -->
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" ${stroke}/><path ${stroke} d="M16 16l5 5"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path ${stroke} d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path ${stroke} d="M5 12h14"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path ${stroke} d="M4 20l1.4-4.1A8 8 0 1 1 8.2 18.7z"/><path d="M9.2 8.8c.4 2.1 2.6 4.3 5 5l1.4-1.3-2-1.3-1 .8c-.8-.4-1.5-1.1-1.9-1.9l.8-1-1.3-2z" fill="currentColor"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path ${stroke} d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path ${stroke} d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" ${stroke}/><path ${stroke} d="M12 7.5V12l3 2"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2" ${stroke}/><path ${stroke} d="M11 17.5h2"/></symbol>
  <symbol id="i-insta" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" ${stroke}/><circle cx="12" cy="12" r="4" ${stroke}/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></symbol>

  <!-- Dibujos de producto (se usan cuando el producto no tiene foto) -->
  <symbol id="p-folded" viewBox="0 0 120 120"><rect x="14" y="76" width="92" height="26" rx="7" style="fill:var(--c)"/><rect x="20" y="51" width="80" height="25" rx="7" fill="#fff" stroke="#d9cdbd" stroke-width="2"/><rect x="26" y="26" width="68" height="25" rx="7" style="fill:var(--c)" opacity=".8"/><path d="M22 89h76M28 38h64" stroke="#fff" stroke-width="2" opacity=".45"/></symbol>
  <symbol id="p-towel" viewBox="0 0 120 120"><rect x="22" y="12" width="76" height="6" rx="3" fill="#8a7d72"/><path d="M34 18h52v82a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z" style="fill:var(--c)"/><rect x="34" y="72" width="52" height="5" fill="#fff" opacity=".75"/><rect x="34" y="83" width="52" height="5" fill="#fff" opacity=".75"/><path d="M41 108v7M51 108v7M60 108v7M69 108v7M79 108v7" style="stroke:var(--c)" stroke-width="3" stroke-linecap="round"/></symbol>
  <symbol id="p-pillow" viewBox="0 0 120 120"><path d="M16 34q4-10 16-10h56q12 0 16 10-6 26 0 52-4 10-16 10H32q-12 0-16-10 6-26 0-52z" style="fill:var(--c)"/><rect x="28" y="36" width="64" height="48" rx="10" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" opacity=".7"/></symbol>
  <symbol id="p-quilt" viewBox="0 0 120 120"><rect x="12" y="28" width="96" height="72" rx="9" style="fill:var(--c)"/><rect x="12" y="28" width="96" height="18" rx="9" fill="#fff" opacity=".35"/><path d="M12 64h96M12 82h96M44 46v54M76 46v54" stroke="#fff" stroke-width="2" opacity=".55"/></symbol>
  <symbol id="p-curtain" viewBox="0 0 120 120"><rect x="12" y="14" width="96" height="6" rx="3" fill="#8a7d72"/><path d="M18 20h40v82q-6 6-13 0t-13 0t-14 0z" style="fill:var(--c)"/><path d="M62 20h40v82q-6 6-13 0t-13 0t-14 0z" style="fill:var(--c)"/><path d="M30 22v76M44 22v76M74 22v76M88 22v76" stroke="#000" stroke-width="2" opacity=".12"/></symbol>
  <symbol id="p-cloth" viewBox="0 0 120 120"><path d="M12 38h96l-8 58H20z" style="fill:var(--c)"/><path d="M12 38h96l-3 14H15z" fill="#fff" opacity=".35"/><path d="M22 84h76" stroke="#fff" stroke-width="3" opacity=".6"/></symbol>
  <symbol id="p-gift" viewBox="0 0 120 120"><rect x="20" y="52" width="80" height="52" rx="4" style="fill:var(--c)"/><rect x="16" y="40" width="88" height="16" rx="4" fill="#fff" stroke="#d9cdbd" stroke-width="2"/><rect x="54" y="40" width="12" height="64" fill="#fff" opacity=".85"/><path d="M60 40C50 22 34 28 44 40z" fill="#fff" stroke="#d9cdbd" stroke-width="2"/><path d="M60 40C70 22 86 28 76 40z" fill="#fff" stroke="#d9cdbd" stroke-width="2"/></symbol>
  <!-- Nombres de la versión anterior (solo por si quedó algún producto viejo cargado) -->
  <symbol id="p-bottle" viewBox="0 0 120 120"><use href="#p-folded"/></symbol>
  <symbol id="p-spray" viewBox="0 0 120 120"><use href="#p-towel"/></symbol>
  <symbol id="p-jug" viewBox="0 0 120 120"><use href="#p-pillow"/></symbol>
  <symbol id="p-tin" viewBox="0 0 120 120"><use href="#p-quilt"/></symbol>
  <symbol id="p-filter" viewBox="0 0 120 120"><use href="#p-curtain"/></symbol>
  <symbol id="p-box" viewBox="0 0 120 120"><use href="#p-gift"/></symbol>
</defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', sprite);

  /* ---------- Header ---------- */
  const nav = [
    ['index.html', 'Inicio', 'home'],
    ['productos.html', 'Productos', 'productos'],
    ['nosotros.html', 'Nosotros', 'nosotros'],
    ['contacto.html', 'Contacto', 'contacto'],
  ];
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="${esc(b.name)}, inicio">
        <svg class="brand-mark" aria-hidden="true" focusable="false"><use href="#i-bedline"/></svg>
        <span class="brand-text">Rincón de Sueño</span>
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Principal">
        ${nav.map(([href, label, id]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a class="cart-link${page === 'carrito' ? ' is-current' : ''}" href="carrito.html" id="cart-link" aria-label="Carrito">
          <svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg>
          <span class="cart-label">Carrito</span>
          <span class="cart-count" data-cart-count hidden>0</span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span class="sr-only">Abrir menú</span><span></span><span></span><span></span>
        </button>
      </div>
    </div>`;

    const toggle = header.querySelector('.menu-toggle');
    const navEl = header.querySelector('#site-nav');
    const setMenu = (open) => {
      navEl.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    };
    toggle.addEventListener('click', () => setMenu(!navEl.classList.contains('is-open')));
    navEl.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* Contador del carrito: siempre actualizado, también entre pestañas */
  function updateCartBadge() {
    const n = Cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    const link = document.getElementById('cart-link');
    if (link) link.setAttribute('aria-label', n ? `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}` : 'Carrito, vacío');
  }
  updateCartBadge();
  document.addEventListener('cart:change', updateCartBadge);
  window.addEventListener('storage', updateCartBadge);
  window.addEventListener('pageshow', updateCartBadge);

  /* ---------- Footer ---------- */
  const footer = document.getElementById('site-footer');
  if (footer) {
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${b.address}, ${b.city}`);
    footer.innerHTML = `
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="brand" href="index.html" aria-label="${esc(b.name)}, inicio"><img class="brand-logo" src="assets/logo/logo.png" alt="${esc(b.name)}" width="150" height="113" loading="lazy"></a>
        <p>Blanquería: sábanas, acolchados, almohadas, toallas, cortinas y todo para el descanso de tu casa.</p>
      </div>
      <div>
        <h2>Tienda</h2>
        <ul class="footer-links">
          <li><a href="productos.html">Productos</a></li>
          <li><a href="carrito.html">Carrito</a></li>
          <li><a href="nosotros.html">Nosotros</a></li>
        </ul>
      </div>
      <div>
        <h2>Contacto</h2>
        <ul>
          <li><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${esc(b.phone)}</a></li>
          <li><svg class="ico" aria-hidden="true"><use href="#i-chat"/></svg><a href="${window.BLACK.waLink('')}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><svg class="ico" aria-hidden="true"><use href="#i-insta"/></svg><a href="https://instagram.com/${esc(b.instagram)}" target="_blank" rel="noopener">@${esc(b.instagram)}</a></li>
        </ul>
      </div>
      <div>
        <h2>Local</h2>
        <ul>
          <li><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg><a href="${maps}" target="_blank" rel="noopener">${esc(b.address)}<br>${esc(b.city)}</a></li>
          ${b.hours.map(([d, h]) => `<li><svg class="ico" aria-hidden="true"><use href="#i-clock"/></svg><span>${esc(d)}: ${esc(h)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">© ${new Date().getFullYear()} ${esc(b.name)}. Todos los derechos reservados.</div>`;
  }

  /* ---------- Botón flotante de WhatsApp ----------
     No se muestra en carrito y checkout, donde la barra inferior ya ocupa ese lugar,
     ni en el panel de administración. */
  if (b.whatsapp && !['carrito', 'checkout', 'admin'].includes(page)) {
    document.body.insertAdjacentHTML('beforeend', `
    <a class="wa-float" href="${window.BLACK.waLink('Hola Rincón de Sueño, quiero hacer una consulta.')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">
      <svg class="ico" aria-hidden="true"><use href="#i-chat"/></svg><span class="wa-float-label">WhatsApp</span>
    </a>`);
  }

  /* ---------- Aviso breve (toast) ---------- */
  let timer;
  window.BLACK.toast = function (message, link) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.innerHTML = `<span>${esc(message)}</span>` + (link ? ` <a href="${esc(link.href)}">${esc(link.label)}</a>` : '');
    t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 3600);
  };
})();
