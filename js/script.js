/* ==========================================================
   RINCÓN DE SUEÑO – lógica de cada página
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

  function mediaHTML(p, colorHex) {
    const art = p.art || { shape: 'folded', color: '#b9a3b0' };
    const drawing = `<svg class="p-art" style="--c:${esc(colorHex || art.color)}" aria-hidden="true" focusable="false"><use href="#p-${esc(art.shape)}"/></svg>`;
    const photo = p.image ? `<img class="p-photo" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">` : '';
    return drawing + photo;
  }

  /* Selector de color (solo si el producto tiene colores cargados). Nadie queda preseleccionado:
     el cliente tiene que elegir, así no se compra un color por error. */
  /* Estilo de la muestra: color liso, o la foto de la estampa si la cargaron */
  const swatchStyle = (hex, img) => `--sw:${esc(hex)}${img ? `;--img:url('${esc(img)}')` : ''}`;

  function colorPickerHTML(p) {
    const colors = Catalog.colors(p);
    if (!colors.length) return '';
    return `
        <fieldset class="p-colors">
          <legend class="p-colors-legend">Color: <span class="p-colors-pick" data-color-label>Elegí uno</span></legend>
          <div class="p-colors-row">
            ${colors.map((c) => {
              const out = Number.isInteger(c.stock) && c.stock <= 0;
              return `<label class="swatch${c.image ? ' has-img' : ''}${out ? ' is-out' : ''}" title="${esc(c.name)}${out ? ' (agotado)' : ''}"><input type="radio" name="color-${esc(p.id)}" value="${esc(c.name)}" data-color-pick data-hex="${esc(c.hex)}"${Number.isInteger(c.stock) ? ` data-stock="${c.stock}"` : ''}${out ? ' disabled' : ''}><span class="swatch-dot" style="${swatchStyle(c.hex, c.image)}" aria-hidden="true"></span><span class="sr-only">${esc(c.name)}${out ? ' (agotado)' : ''}</span></label>`;
            }).join('')}
          </div>
        </fieldset>`;
  }

  function productCard(p) {
    const s = stockInfo(p);
    const avail = Catalog.isAvailable(p);
    return `
    <article class="p-card${avail ? '' : ' is-out'}">
      <a class="p-media" href="producto.html?id=${encodeURIComponent(p.id)}" tabindex="-1" aria-hidden="true">${mediaHTML(p)}</a>
      <div class="p-body">
        <p class="p-cat">${esc(Catalog.categoryName(p.category))}</p>
        <h3 class="p-name"><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <p class="p-desc">${esc(p.description)}</p>
        <div class="p-meta">
          <span class="p-price">${fmt(p.price)}</span>
          <span class="stock stock-${s.cls}">${s.text}</span>
        </div>
        ${avail ? colorPickerHTML(p) : ''}
        ${avail
          ? `<button class="btn btn-red btn-block" type="button" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} al carrito"><svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg><span>Agregar<span class="btn-more"> al carrito</span></span></button>`
          : `<button class="btn btn-block" type="button" disabled>Sin stock</button>`}
      </div>
    </article>`;
  }

  /* Imágenes que no cargan: se quita la foto y queda el dibujo del producto */
  document.addEventListener('error', (e) => {
    if (e.target && e.target.classList && (e.target.classList.contains('p-photo') || e.target.classList.contains('pd-thumb-img'))) e.target.remove();
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
    const btn = e.target.closest('[data-add],[data-buy]');
    if (!btn) return;
    const pid = btn.dataset.add || btn.dataset.buy;
    const p = Catalog.get(pid);
    let color = '';
    if (p && Catalog.colors(p).length) {
      const card = btn.closest('.p-card, [data-pd]');
      const picked = card && card.querySelector('input[data-color-pick]:checked');
      if (!picked) {
        const box = card && card.querySelector('.p-colors');
        if (box) {
          box.classList.add('is-missing');
          const first = box.querySelector('input[data-color-pick]');
          if (first) first.focus();
        }
        B.toast(`Elegí un color de ${p.name}.`);
        return;
      }
      color = picked.value;
    }
    const qtyOut = btn.closest('[data-pd]') && $('[data-qty-out]', btn.closest('[data-pd]'));
    const r = Cart.add(pid, qtyOut ? Math.max(1, Number(qtyOut.textContent) || 1) : 1, color);
    if ((r.ok || r.reason === 'max') && btn.hasAttribute('data-buy')) { location.href = 'carrito.html'; return; }
    if (r.ok) B.toast(`${p.name}${color ? ` (${color})` : ''} agregado al carrito.`, { href: 'carrito.html', label: 'Ver carrito' });
    else B.toast(r.reason === 'max' ? 'Ya tenés en el carrito todo el stock disponible.' : r.reason === 'color' ? 'Elegí un color para agregarlo.' : 'Este producto está sin stock.');
  });

  /* Al elegir un color: se muestra su nombre y el dibujo del producto toma ese tono */
  document.addEventListener('change', (e) => {
    const input = e.target.closest && e.target.closest('input[data-color-pick]');
    if (!input) return;
    const card = input.closest('.p-card, [data-pd]');
    if (!card) return;
    const box = card.querySelector('.p-colors');
    if (box) box.classList.remove('is-missing');
    const label = card.querySelector('[data-color-label]');
    if (label) {
      const st = input.dataset.stock === undefined ? null : Number(input.dataset.stock);
      label.textContent = input.value + (st !== null && st > 0 && st <= 5 ? (st === 1 ? ' · última unidad' : ` · quedan ${st}`) : '');
    }
    const art = card.querySelector('.p-art');
    if (art && input.dataset.hex) art.style.setProperty('--c', input.dataset.hex);
  });

  /* ==========================================================
     INICIO
     ========================================================== */
  function initHome() {
    const cats = $('#home-categories');
    if (cats) {
      /* Solo se muestran las categorías que tienen al menos un producto visible */
      const withProducts = Catalog.categories().filter((c) => Catalog.products().some((p) => p.category === c.id));
      cats.innerHTML = withProducts.map((c) => `
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
      vals: new Set((params.get('f') || '').split(',').filter(Boolean)),
      sort: ['precio-asc', 'precio-desc', 'nombre'].includes(params.get('orden')) ? params.get('orden') : 'destacados',
    };
    { const known = new Set(state.cat === 'all' ? [] : Catalog.attrGroups(state.cat).flatMap((g) => g.values.map((v) => v.id))); state.vals = new Set([...state.vals].filter((v) => known.has(v))); }
    search.value = state.q;
    sort.value = state.sort;

    const all = Catalog.products();
    const countBy = (id) => all.filter((p) => id === 'all' || p.category === id).length;

    function renderChips() {
      const items = [{ id: 'all', name: 'Todas' }].concat(Catalog.categories().filter((c) => countBy(c.id) > 0));
      chips.innerHTML = items.map((c) => `<button type="button" class="chip${state.cat === c.id ? ' is-active' : ''}" data-cat="${esc(c.id)}" aria-pressed="${state.cat === c.id}">${esc(c.name)} <span>${countBy(c.id)}</span></button>`).join('');
    }

    /* Subcategorías: dentro de un mismo grupo alcanza con cumplir una (ej. algodón O poliéster); entre grupos se cumplen todos (ej. algodón Y queen) */
    const activeGroups = () => (state.cat === 'all' ? [] : Catalog.attrGroups(state.cat));
    const matchesAttrs = (p) => activeGroups().every((g) => {
      const picked = g.values.filter((v) => state.vals.has(v.id));
      return !picked.length || picked.some((v) => ((p.attrs || {})[g.id] || []).includes(v.id));
    });
    const attrBox = $('#attr-filters');
    function renderAttrs() {
      if (!attrBox) return;
      const inCat = all.filter((p) => p.category === state.cat);
      const groups = activeGroups()
        .map((g) => ({ g, values: g.values.map((v) => ({ v, n: inCat.filter((p) => ((p.attrs || {})[g.id] || []).includes(v.id)).length })).filter((x) => x.n > 0) }))
        .filter((x) => x.values.length);
      attrBox.innerHTML = groups.map(({ g, values }) => `
        <div class="filter-row">
          <span class="filter-label" id="fl-${esc(g.id)}">${esc(g.name)}</span>
          <div class="chips" role="group" aria-labelledby="fl-${esc(g.id)}">
            ${values.map(({ v, n }) => `<button type="button" class="chip${state.vals.has(v.id) ? ' is-active' : ''}" data-val="${esc(v.id)}" aria-pressed="${state.vals.has(v.id)}">${esc(v.name)} <span>${n}</span></button>`).join('')}
          </div>
        </div>`).join('') + (groups.length && state.vals.size ? '<button type="button" class="link-btn" data-clear-attrs>Quitar filtros</button>' : '');
    }

    function filtered() {
      const q = norm(state.q).trim();
      let list = all.filter((p) => (state.cat === 'all' || p.category === state.cat) && matchesAttrs(p)
        && (!q || norm(`${p.name} ${p.description} ${Catalog.categoryName(p.category)} ${Catalog.colors(p).map((c) => c.name).join(' ')}`).includes(q)));
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
      renderAttrs();
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
      if (state.vals.size) p.set('f', [...state.vals].join(','));
      if (state.sort !== 'destacados') p.set('orden', state.sort);
      try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); } catch (e) { /* algunos navegadores lo bloquean en file:// */ }
    }

    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      if (state.cat !== b.dataset.cat) state.vals.clear();   // las opciones pertenecen a una categoría
      state.cat = b.dataset.cat;
      render();
      const active = chips.querySelector('.is-active');
      if (active) { active.focus({ preventScroll: true }); if (active.scrollIntoView) active.scrollIntoView({ inline: 'center', block: 'nearest' }); }
    });
    if (attrBox) attrBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-val]');
      if (b) {
        if (state.vals.has(b.dataset.val)) state.vals.delete(b.dataset.val); else state.vals.add(b.dataset.val);
        render();
        const again = attrBox.querySelector(`[data-val="${CSS.escape(b.dataset.val)}"]`);
        if (again) again.focus({ preventScroll: true });
      } else if (e.target.closest('[data-clear-attrs]')) { state.vals.clear(); render(); }
    });
    let t;
    search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value; render(); }, 150); });
    $('#catalog-search-form').addEventListener('submit', (e) => { e.preventDefault(); state.q = search.value; render(); });
    sort.addEventListener('change', () => { state.sort = sort.value; render(); });
    grid.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) { state.cat = 'all'; state.q = ''; state.vals.clear(); search.value = ''; render(); }
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
          ...(Catalog.colors(p).length ? { color: Catalog.colors(p).map((c) => c.name).join(', ') } : {}),
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
     DETALLE DE PRODUCTO (producto.html?id=…)
     ========================================================== */
  function initProduct() {
    const root = $('#pd-root');
    const p = Catalog.get(new URLSearchParams(location.search).get('id') || '');
    if (!p) {
      document.title = 'Producto no encontrado | Rincón de Sueño';
      root.innerHTML = '<div class="empty empty-lg"><h1>No encontramos ese producto</h1><p>Puede que ya no esté disponible.</p><a class="btn btn-red" href="productos.html">Ver todos los productos</a></div>';
      return;
    }
    const imgs = Catalog.images(p);
    const avail = Catalog.isAvailable(p);
    const st = stockInfo(p);
    const catName = Catalog.categoryName(p.category);
    const colors = Catalog.colors(p);
    const specs = [];
    if (catName) specs.push(['Categoría', catName]);
    Catalog.attrsOf(p).forEach((g) => specs.push([g.name, g.values.map((v) => v.name).join(', ')]));
    if (colors.length) specs.push([colors.some((c) => c.image) ? 'Colores y estampas' : 'Colores', colors.map((c) => c.name).join(', ')]);
    const related = Catalog.products().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);

    document.title = `${p.name} | Rincón de Sueño`;
    const setMeta = (sel, val) => { const m = $(sel); if (m) m.setAttribute('content', val); };
    const desc = p.description ? `${p.description} Comprá online en Rincón de Sueño.` : `${p.name}: comprá online en Rincón de Sueño.`;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', document.title);
    setMeta('meta[property="og:description"]', desc);

    const thumbs = imgs.length > 1 ? `
        <div class="pd-thumbs" role="group" aria-label="Elegir foto">
          ${imgs.map((u, i) => `<button type="button" class="pd-thumb" data-i="${i}" aria-label="Ver foto ${i + 1} de ${imgs.length}" aria-current="${i === 0}"><img class="pd-thumb-img" src="${esc(u)}" alt="" loading="lazy" width="64" height="64"></button>`).join('')}
        </div>` : '';
    root.innerHTML = `
      <nav class="crumbs" aria-label="Ubicación">
        <a href="index.html">Inicio</a><span aria-hidden="true">›</span>
        <a href="productos.html">Productos</a>${catName ? `<span aria-hidden="true">›</span><a href="productos.html?categoria=${encodeURIComponent(p.category)}">${esc(catName)}</a>` : ''}
      </nav>
      <div class="pd-grid" data-pd>
        <div class="pd-gallery">
          <div class="pd-main${avail ? '' : ' is-out'}" id="pd-main">
            <svg class="p-art" style="--c:${esc((p.art || {}).color || '#b9a3b0')}" aria-hidden="true" focusable="false"><use href="#p-${esc((p.art || {}).shape || 'folded')}"/></svg>
            ${imgs.length ? `<img class="p-photo pd-photo" id="pd-img" src="${esc(imgs[0])}" alt="${esc(p.name)}" width="800" height="800">` : ''}
            ${imgs.length > 1 ? `
            <button class="pd-nav pd-prev" type="button" data-nav="-1" aria-label="Foto anterior"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg></button>
            <button class="pd-nav pd-next" type="button" data-nav="1" aria-label="Foto siguiente"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></button>
            <span class="pd-count" id="pd-count" aria-live="polite">1 / ${imgs.length}</span>` : ''}
          </div>
          ${thumbs}
        </div>
        <div class="pd-info">
          <p class="p-cat">${esc(catName)}</p>
          <h1 class="pd-title">${esc(p.name)}</h1>
          <p class="pd-price">${fmt(p.price)}</p>
          <p class="stock stock-${st.cls}">${st.text}</p>
          ${p.description ? `<p class="pd-short">${esc(p.description)}</p>` : ''}
          ${avail ? colorPickerHTML(p) : ''}
          ${avail ? `
          <div class="pd-buy">
            <span class="pd-buy-label" id="pd-qty-label">Cantidad</span>
            <div class="stepper" role="group" aria-labelledby="pd-qty-label">
              <button type="button" data-q="-1" aria-label="Restar uno"><svg class="ico" aria-hidden="true"><use href="#i-minus"/></svg></button>
              <output data-qty-out aria-live="polite">1</output>
              <button type="button" data-q="1" aria-label="Sumar uno"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>
            </div>
            <span class="fine" id="pd-avail"></span>
          </div>
          <div class="pd-actions">
            <button class="btn btn-red btn-lg btn-block" type="button" data-buy="${esc(p.id)}">Comprar ahora</button>
            <button class="btn btn-line btn-lg btn-block" type="button" data-add="${esc(p.id)}"><svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg><span>Agregar al carrito</span></button>
          </div>` : '<button class="btn btn-lg btn-block" type="button" disabled>Sin stock</button>'}
          <a class="pd-wa" href="${esc(waLink(`Hola, quiero consultar por "${p.name}".`))}" target="_blank" rel="noopener">Consultar por WhatsApp<span class="sr-only"> (se abre en una pestaña nueva)</span></a>
        </div>
      </div>
      ${specs.length ? `
      <section class="pd-section" aria-labelledby="pd-specs-h">
        <h2 id="pd-specs-h">Características</h2>
        <table class="pd-specs"><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      </section>` : ''}
      ${related.length ? `
      <section class="pd-section" aria-labelledby="pd-rel-h">
        <h2 id="pd-rel-h">Más de ${esc(catName || 'esta categoría')}</h2>
        <div class="product-grid">${related.map(productCard).join('')}</div>
      </section>` : ''}`;

    /* Galería */
    if (imgs.length > 1) {
      let cur = 0;
      const img = $('#pd-img');
      const show = (i) => {
        cur = (i + imgs.length) % imgs.length;
        if (img) { img.src = imgs[cur]; img.alt = `${p.name} – foto ${cur + 1} de ${imgs.length}`; }
        $('#pd-count').textContent = `${cur + 1} / ${imgs.length}`;
        $$('.pd-thumb', root).forEach((b, k) => b.setAttribute('aria-current', String(k === cur)));
      };
      root.addEventListener('click', (e) => {
        const n = e.target.closest('[data-nav]');
        const t = e.target.closest('.pd-thumb');
        if (n) show(cur + Number(n.dataset.nav));
        else if (t) show(Number(t.dataset.i));
      });
      const main = $('#pd-main');
      main.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1); });
      let x0 = null;
      main.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
      main.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    /* Cantidad: el tope es el stock del color elegido (o el del producto si no hay colores) */
    if (avail) {
      const out = $('[data-qty-out]', root);
      const availEl = $('#pd-avail');
      const pickedColor = () => { const c = $('input[data-color-pick]:checked', root); return c ? c.value : ''; };
      const maxQty = () => {
        const cs = pickedColor() ? Catalog.colorStock(p, pickedColor()) : null;
        return Math.max(1, Math.min(100, cs !== null ? cs : p.stock));
      };
      const sync = () => {
        const max = maxQty();
        if (Number(out.textContent) > max) out.textContent = max;
        const c = pickedColor();
        const cs = c ? Catalog.colorStock(p, c) : null;
        availEl.textContent = cs !== null ? `${cs} ${cs === 1 ? 'disponible' : 'disponibles'} en ${c}` : (colors.length ? '' : `${p.stock} ${p.stock === 1 ? 'disponible' : 'disponibles'}`);
      };
      root.addEventListener('click', (e) => {
        const q = e.target.closest('[data-q]');
        if (!q) return;
        out.textContent = Math.min(maxQty(), Math.max(1, Number(out.textContent) + Number(q.dataset.q)));
      });
      root.addEventListener('change', (e) => { if (e.target.closest('input[data-color-pick]')) sync(); });
      sync();
    }

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description || p.name,
      category: catName,
      ...(imgs.length ? { image: imgs } : {}),
      ...(colors.length ? { color: colors.map((c) => c.name).join(', ') } : {}),
      offers: { '@type': 'Offer', priceCurrency: 'ARS', price: p.price, availability: avail ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    };
    const sc = document.createElement('script');
    sc.type = 'application/ld+json';
    sc.textContent = JSON.stringify(ld);
    document.head.appendChild(sc);
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
                <div class="c-thumb">${mediaHTML(l.product, Catalog.colorHex(l.product, l.color))}</div>
                <div>
                  <p class="c-name"><a href="producto.html?id=${encodeURIComponent(l.product.id)}">${esc(l.product.name)}</a></p>
                  ${l.color ? `<p class="c-color"><span class="swatch-dot sm${Catalog.colorImage(l.product, l.color) ? ' has-img' : ''}" style="${swatchStyle(Catalog.colorHex(l.product, l.color), Catalog.colorImage(l.product, l.color))}" aria-hidden="true"></span>Color: ${esc(l.color)}</p>` : ''}
                  <button class="link-btn" type="button" data-remove="${esc(l.product.id)}" data-color="${esc(l.color)}">Quitar<span class="sr-only"> ${esc(l.product.name)}${l.color ? ` color ${esc(l.color)}` : ''} del carrito</span></button>
                </div>
              </div></td>
              <td class="c-qty" data-label="Cantidad">
                <div class="stepper" role="group" aria-label="Cantidad de ${esc(l.product.name)}${l.color ? ` color ${esc(l.color)}` : ''}">
                  <button type="button" data-qty="${esc(l.product.id)}" data-color="${esc(l.color)}" data-act="dec" aria-label="Restar uno"><svg class="ico" aria-hidden="true"><use href="#i-minus"/></svg></button>
                  <output aria-live="polite">${l.qty}</output>
                  <button type="button" data-qty="${esc(l.product.id)}" data-color="${esc(l.color)}" data-act="inc" aria-label="Sumar uno"${l.qty >= Cart.limitOf(l.product.id, l.color) ? ' disabled' : ''}><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>
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
        const same = [...root.querySelectorAll('[data-qty]')].filter((x) => x.dataset.qty === focusAfter.id && (x.dataset.color || '') === focusAfter.color && !x.disabled);
        const el = same.find((x) => x.dataset.act === focusAfter.act) || same[0];
        if (el) el.focus();
        focusAfter = null;
      }
    }

    root.addEventListener('click', (e) => {
      const q = e.target.closest('[data-qty]');
      const r = e.target.closest('[data-remove]');
      if (q) {
        const id = q.dataset.qty;
        const color = q.dataset.color || '';
        focusAfter = { id, color, act: q.dataset.act };
        Cart.setQty(id, Cart.qtyOf(id, color) + (q.dataset.act === 'inc' ? 1 : -1), color);
        render();
      } else if (r) {
        Cart.remove(r.dataset.remove, r.dataset.color || '');
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
          ${lines.map((l) => `<li><span class="ol-name">${esc(l.product.name)}${l.color ? ` <small class="ol-color">· ${esc(l.color)}</small>` : ''}</span><span class="ol-qty">× ${l.qty}</span><span class="ol-price">${fmt(l.subtotal)}</span></li>`).join('')}
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
      ${order.demo && cfg.demoMode ? `<div class="notice notice-warn" role="note"><p><strong>Modo demostración.</strong> Este pedido se guardó solo en este dispositivo: Rincón de Sueño todavía no lo recibe.</p></div>` : ''}
      ${payNote ? `<div class="notice" role="status"><p>${esc(payNote)}</p></div>` : ''}
      <div class="done-grid">
        <section class="card" aria-labelledby="t-order">
          <h2 id="t-order">Tu pedido</h2>
          <ul class="order-lines">
            ${order.items.map((i) => `<li><span class="ol-name">${esc(i.name)}${i.color ? ` <small class="ol-color">· ${esc(i.color)}</small>` : ''}</span><span class="ol-qty">× ${i.quantity}</span><span class="ol-price">${fmt(i.subtotal)}</span></li>`).join('')}
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
          <p class="fine">${Payments.enabled() ? '' : 'El pago se coordina con el local. '}¿Dudas sobre tu pedido? <a href="${waLink(`Hola Rincón de Sueño, consulto por mi pedido ${order.number}.`)}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>.</p>
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
      card(waLink('Hola Rincón de Sueño, quiero hacer una consulta.'), 'chat', 'WhatsApp', 'Para consultas sobre productos y pedidos.', true),
      card(maps, 'pin', 'Dirección', `${esc(b.address)}<br>${esc(b.city)}<br><strong>Cómo llegar</strong>`, true),
      card('https://instagram.com/' + b.instagram, 'insta', 'Instagram', `@${esc(b.instagram)}`, true),
      card('', 'clock', 'Horarios', b.hours.map(([d, h]) => `${esc(d)}: <strong>${esc(h)}</strong>`).join('<br>')),
    ].join('');
  }

  /* ---------- Arranque ---------- */
  Catalog.load().then(() => {
    if (page === 'home') initHome();
    else if (page === 'productos') initCatalog();
    else if (page === 'producto') initProduct();
    else if (page === 'carrito') initCart();
    else if (page === 'checkout') initCheckout();
    else if (page === 'pedido') initOrderDone();
    else if (page === 'contacto') initContact();
  });
})();
