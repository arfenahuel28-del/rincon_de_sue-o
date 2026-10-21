/* ==========================================================
   BLACK – elementos compartidos: íconos, header (con carrito
   siempre visible), footer y avisos. Se edita acá una sola vez.
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
  <symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3c3.5 4.5 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.5 12 3z" fill="currentColor"/></symbol>
  <symbol id="i-wrench" viewBox="0 0 24 24"><path ${stroke} d="M14.7 6.3a4 4 0 0 0-5.4 5.1l-5.8 5.8a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></symbol>
  <symbol id="i-car" viewBox="0 0 24 24"><path ${stroke} d="M5 16v2.5M19 16v2.5M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2A2 2 0 0 1 19 7.5L21 13v3H3z"/><path d="M7 13h.01M17 13h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor"/></symbol>
  <symbol id="i-seat" viewBox="0 0 24 24"><path ${stroke} d="M8 3.5h3.5a2 2 0 0 1 2 1.7L14.5 13H18a2 2 0 0 1 2 2v3.5H7.5zM7.5 18.5V20M19.5 18.5V20"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path ${stroke} d="M12 3l7 3v5.5c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6z"/><path ${stroke} d="M9 12l2.2 2.2L15.5 10"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path ${stroke} d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/></symbol>
  <symbol id="i-filter" viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2" ${stroke}/><path ${stroke} d="M7 9h10M7 13h10M7 17h10"/></symbol>
  <symbol id="i-dots" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/></symbol>
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

  <symbol id="p-bottle" viewBox="0 0 80 140"><rect x="31" y="6" width="18" height="14" rx="3" style="fill:var(--c)"/><rect x="33" y="20" width="14" height="14" fill="#2a323a"/><rect x="14" y="32" width="52" height="102" rx="12" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="14" y="62" width="52" height="44" style="fill:var(--c)"/><rect x="22" y="40" width="5" height="88" rx="2.5" fill="#fff" opacity=".1"/><rect x="30" y="76" width="22" height="3" rx="1.5" fill="#fff" opacity=".85"/><rect x="30" y="84" width="16" height="3" rx="1.5" fill="#fff" opacity=".55"/></symbol>
  <symbol id="p-spray" viewBox="0 0 80 140"><path d="M34 8h26l6 7v6H40l-6-5z" fill="#2a323a"/><rect x="34" y="8" width="10" height="26" rx="2" style="fill:var(--c)"/><rect x="36" y="32" width="8" height="12" fill="#2a323a"/><rect x="18" y="42" width="44" height="92" rx="10" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="18" y="68" width="44" height="40" style="fill:var(--c)"/><rect x="25" y="49" width="4" height="78" rx="2" fill="#fff" opacity=".1"/><rect x="32" y="80" width="20" height="3" rx="1.5" fill="#fff" opacity=".85"/><rect x="32" y="88" width="14" height="3" rx="1.5" fill="#fff" opacity=".55"/></symbol>
  <symbol id="p-jug" viewBox="0 0 80 140"><path d="M54 36V22a6 6 0 0 1 6-6h6v20" fill="none" stroke="#34404a" stroke-width="5" stroke-linecap="round"/><rect x="26" y="10" width="20" height="22" rx="3" style="fill:var(--c)"/><rect x="10" y="30" width="60" height="104" rx="12" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="10" y="62" width="60" height="48" style="fill:var(--c)"/><rect x="18" y="38" width="5" height="90" rx="2.5" fill="#fff" opacity=".1"/><rect x="28" y="76" width="30" height="4" rx="2" fill="#fff" opacity=".85"/><rect x="28" y="86" width="20" height="3" rx="1.5" fill="#fff" opacity=".55"/></symbol>
  <symbol id="p-tin" viewBox="0 0 80 140"><ellipse cx="40" cy="108" rx="30" ry="9" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="10" y="62" width="60" height="46" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="10" y="74" width="60" height="22" style="fill:var(--c)"/><ellipse cx="40" cy="62" rx="30" ry="9" fill="#2a323a" stroke="#34404a" stroke-width="1.5"/><ellipse cx="40" cy="62" rx="20" ry="5" style="fill:var(--c)" opacity=".9"/></symbol>
  <symbol id="p-filter" viewBox="0 0 80 140"><rect x="18" y="44" width="44" height="70" rx="5" style="fill:var(--c)"/><rect x="14" y="38" width="52" height="10" rx="3" fill="#2a323a"/><rect x="14" y="110" width="52" height="8" rx="3" fill="#2a323a"/><path d="M26 54v52M34 54v52M42 54v52M50 54v52M58 54v52" stroke="#000" opacity=".25" stroke-width="2"/><rect x="18" y="74" width="44" height="14" fill="#fff" opacity=".9"/></symbol>
  <symbol id="p-cloth" viewBox="0 0 80 140"><rect x="12" y="46" width="56" height="40" rx="4" fill="#e11d2e" transform="rotate(-6 40 66)"/><rect x="12" y="58" width="56" height="40" rx="4" fill="#f4f6f8" transform="rotate(3 40 78)"/><rect x="12" y="70" width="56" height="40" rx="4" fill="#2a323a" transform="rotate(-2 40 90)"/><rect x="24" y="86" width="32" height="3" rx="1.5" fill="#e11d2e" transform="rotate(-2 40 90)"/></symbol>
  <symbol id="p-box" viewBox="0 0 80 140"><rect x="8" y="44" width="64" height="76" rx="4" fill="#161c22" stroke="#34404a" stroke-width="1.5"/><rect x="8" y="44" width="64" height="20" rx="4" style="fill:var(--c)"/><rect x="18" y="78" width="30" height="4" rx="2" fill="#fff" opacity=".85"/><rect x="18" y="88" width="42" height="3" rx="1.5" fill="#fff" opacity=".45"/><rect x="18" y="97" width="36" height="3" rx="1.5" fill="#fff" opacity=".45"/></symbol>
</defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', sprite);

  /* ---------- Header ---------- */
  const nav = [
    ['index.html', 'Inicio', 'home'],
    ['productos.html', 'Productos', 'productos'],
    ['lubricentro.html', 'Lubricentro', 'lubricentro'],
    ['contacto.html', 'Contacto', 'contacto'],
  ];
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="${esc(b.name)}, inicio">
        <img class="brand-logo" src="assets/logo/logo.png" alt="${esc(b.name)}" width="64" height="64">
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
        <a class="brand" href="index.html" aria-label="${esc(b.name)}, inicio"><img class="brand-logo" src="assets/logo/logo.png" alt="${esc(b.name)}" width="88" height="88" loading="lazy"></a>
        <p>Lubricentro y cosmética vehicular en Río Cuarto: service, lubricantes y productos de detailing.</p>
      </div>
      <div>
        <h2>Tienda</h2>
        <ul class="footer-links">
          <li><a href="productos.html">Productos</a></li>
          <li><a href="carrito.html">Carrito</a></li>
          <li><a href="lubricentro.html">Servicios de lubricentro</a></li>
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
     No se muestra en carrito y checkout, donde la barra inferior ya ocupa ese lugar. */
  if (b.whatsapp && !['carrito', 'checkout'].includes(page)) {
    document.body.insertAdjacentHTML('beforeend', `
    <a class="wa-float" href="${window.BLACK.waLink('Hola BLACK, quiero hacer una consulta.')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">
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
