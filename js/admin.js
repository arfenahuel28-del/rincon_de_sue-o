/* ==========================================================
   BLACK – panel de administración (Supabase)
   Login real (Supabase Auth), productos, fotos (Storage) y pedidos.
   Solo entran usuarios que estén en la tabla admin_users.
   ========================================================== */
(function () {
  'use strict';
  const B = window.BLACK;
  const { fmt, esc, norm, ORDER_STATUS, PAYMENT_STATUS } = B;
  const $ = (s, r = document) => r.querySelector(s);
  const BUCKET = 'product-images';

  let sb = null;
  let products = [];
  let categories = [];
  let orders = [];

  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || '—';

  /* ---------- Mapeos base de datos ⇄ pantalla ---------- */
  const mapOrder = (r) => ({
    number: r.number,
    createdAt: r.created_at,
    customer: { name: r.customer_name, phone: r.customer_phone, email: r.customer_email },
    delivery: {
      method: r.delivery_method,
      label: r.delivery_method === 'envio' ? 'Envío a domicilio' : 'Retiro en el local',
      address: r.delivery_address || '',
      notes: r.notes || '',
    },
    items: (r.order_items || []).map((i) => ({ name: i.name, quantity: i.quantity, subtotal: Number(i.subtotal) })),
    total: Number(r.total),
    status: r.status,
    payment: { status: r.payment_status },
  });

  /* ---------- Carga de datos ---------- */
  async function loadCategories() {
    const { data, error } = await sb.from('categories').select('*').order('sort_order');
    if (error) throw error;
    categories = data;
    catSelect.innerHTML = categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  }
  async function loadProducts() {
    const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false }).order('name');
    if (error) throw error;
    products = data.map(B.rowToProduct);
  }
  async function loadOrders() {
    const { data, error } = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (error) throw error;
    orders = data.map(mapOrder);
  }

  /* ---------- Ingreso ---------- */
  const login = $('#login');
  const app = $('#app');
  const loginErr = $('#login-error');
  function showApp(on) { login.hidden = on; app.hidden = !on; }

  async function isAdmin(user) {
    const { data, error } = await sb.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    return !error && !!data;
  }

  async function enter() {
    const { data } = await sb.auth.getSession();
    const session = data && data.session;
    if (!session) { showApp(false); return; }
    if (!(await isAdmin(session.user))) {
      await sb.auth.signOut();
      loginErr.textContent = 'Esta cuenta no tiene permisos de administrador.';
      showApp(false);
      return;
    }
    try {
      await Promise.all([loadCategories(), loadProducts(), loadOrders()]);
    } catch (e) {
      loginErr.textContent = 'No se pudieron cargar los datos. Revisá la conexión e intentá de nuevo.';
      showApp(false);
      return;
    }
    showApp(true);
    renderProducts();
    renderOrders();
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErr.textContent = '';
    const email = $('#adm-user').value.trim();
    const password = $('#adm-pass').value;
    if (!email || !password) { loginErr.textContent = 'Ingresá tu email y tu contraseña.'; return; }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { loginErr.textContent = 'Email o contraseña incorrectos.'; return; }
      $('#adm-pass').value = '';
      await enter();
    } catch (err) {
      loginErr.textContent = 'No se pudo conectar. Intentá de nuevo.';
    } finally {
      btn.disabled = false;
    }
  });

  $('#logout').addEventListener('click', async () => {
    await sb.auth.signOut();
    $('#adm-pass').value = '';
    showApp(false);
  });

  /* ---------- Pestañas ---------- */
  const tabs = { productos: $('#tab-productos'), pedidos: $('#tab-pedidos') };
  async function selectTab(name) {
    Object.entries(tabs).forEach(([k, el]) => {
      const on = k === name;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
      $('#panel-' + k).hidden = !on;
    });
    try {
      if (name === 'pedidos') { await loadOrders(); renderOrders(); }
      else { await loadProducts(); renderProducts(); }
    } catch (e) { /* se queda con lo que ya está en pantalla */ }
  }
  Object.entries(tabs).forEach(([k, el]) => el.addEventListener('click', () => selectTab(k)));

  /* ==========================================================
     PRODUCTOS
     ========================================================== */
  const list = $('#prod-list');
  const search = $('#prod-search');

  function thumb(p) {
    const art = p.art || { shape: 'bottle', color: '#e11d2e' };
    return `<div class="c-thumb"><svg class="p-art" style="--c:${esc(art.color)}" aria-hidden="true" focusable="false"><use href="#p-${esc(art.shape)}"/></svg>${p.image ? `<img class="p-photo" src="${esc(p.image)}" alt="">` : ''}</div>`;
  }

  function badges(p) {
    const out = [];
    if (p.active === false) out.push('<span class="adm-badge b-gray">Oculto</span>');
    if (p.soldOut || p.stock <= 0) out.push('<span class="adm-badge b-red">Sin stock</span>');
    else if (p.stock <= 5) out.push('<span class="adm-badge b-amber">Stock bajo</span>');
    if (p.featured) out.push('<span class="adm-badge b-dark">Destacado</span>');
    return out.join('');
  }

  function renderProducts() {
    const q = norm(search.value).trim();
    const rows = products.filter((p) => !q || norm(`${p.name} ${catName(p.category)}`).includes(q));
    $('#prod-count').textContent = rows.length === 1 ? '1 producto' : `${rows.length} productos`;
    if (!rows.length) { list.innerHTML = '<div class="empty"><p>No hay productos que coincidan.</p></div>'; return; }
    list.innerHTML = rows.map((p) => `
      <article class="adm-item${p.active === false ? ' is-hidden' : ''}">
        ${thumb(p)}
        <div class="adm-main-info">
          <p class="adm-name">${esc(p.name)}</p>
          <p class="adm-sub">${esc(catName(p.category))}</p>
        </div>
        <p class="adm-num"><span class="adm-lbl">Precio</span>${fmt(p.price)}</p>
        <p class="adm-num"><span class="adm-lbl">Stock</span>${p.stock}</p>
        <div class="adm-badges">${badges(p)}</div>
        <div class="adm-row-actions">
          <button class="btn btn-line" type="button" data-edit="${esc(p.id)}">Editar</button>
          <button class="btn btn-line adm-del" type="button" data-del="${esc(p.id)}" aria-label="Eliminar ${esc(p.name)}">Eliminar</button>
        </div>
      </article>`).join('');
  }
  search.addEventListener('input', renderProducts);

  list.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (ed) openForm(products.find((p) => p.id === ed.dataset.edit));
    if (del) {
      const p = products.find((x) => x.id === del.dataset.del);
      if (p && window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) {
        const { error } = await sb.from('products').delete().eq('id', p.id);
        if (error) { window.alert('No se pudo eliminar el producto. Intentá de nuevo.'); return; }
        products = products.filter((x) => x.id !== p.id);
        renderProducts();
      }
    }
  });

  /* --- Formulario --- */
  const dlg = $('#prod-dialog');
  const form = $('#prod-form');
  const catSelect = $('#p-cat');
  let editing = null;
  let imageData = '';   // URL existente, o data: URL si se eligió una foto nueva

  function showPreview() {
    const p = { art: (editing && editing.art) || { shape: 'bottle', color: '#e11d2e' }, image: imageData };
    $('#p-preview').innerHTML = thumb(p).replace(/^<div class="c-thumb">|<\/div>$/g, '');
    $('#p-img-remove').hidden = !imageData;
  }

  function openForm(p) {
    editing = p || null;
    imageData = p && p.image ? p.image : '';
    $('#prod-dialog-title').textContent = p ? 'Editar producto' : 'Nuevo producto';
    form.elements.name.value = p ? p.name : '';
    form.elements.description.value = p ? p.description || '' : '';
    form.elements.price.value = p ? p.price : '';
    form.elements.stock.value = p ? p.stock : '';
    form.elements.category.value = p ? p.category : (categories[0] || {}).id;
    form.elements.featured.checked = !!(p && p.featured);
    form.elements.soldOut.checked = !!(p && p.soldOut);
    form.elements.active.checked = p ? p.active !== false : true;
    ['name', 'price', 'stock'].forEach((k) => { $('#p-err-' + k).textContent = ''; form.elements[k].removeAttribute('aria-invalid'); });
    $('#p-form-error').textContent = '';
    $('#p-img-msg').textContent = 'Sin foto se muestra un envase genérico.';
    $('#p-file').value = '';
    showPreview();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    form.elements.name.focus();
  }
  $('#new-product').addEventListener('click', () => openForm(null));

  /* Compartir el catálogo con los clientes */
  const shareMsg = $('#share-msg');
  let shareTimer;
  $('#share-catalog').addEventListener('click', async () => {
    const r = await B.shareCatalog();
    const text = { copied: 'Link del catálogo copiado. Pegalo en WhatsApp, Instagram o donde quieras.', shared: '¡Catálogo compartido!' }[r] || '';
    shareMsg.textContent = text;
    clearTimeout(shareTimer);
    if (text) shareTimer = setTimeout(() => { shareMsg.textContent = ''; }, 5000);
  });
  const closeForm = () => { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
  $('#p-cancel').addEventListener('click', closeForm);

  /* Foto: se reduce a 900 px para que cargue rápido en el celular del cliente */
  function toDataURL(file, max = 900) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  $('#p-file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      imageData = await toDataURL(f);
      $('#p-img-msg').textContent = 'Foto lista. Se sube al presionar "Guardar producto".';
      showPreview();
    } catch (err) {
      $('#p-img-msg').textContent = 'No pudimos leer esa imagen. Probá con otra (JPG o PNG).';
    }
  });
  $('#p-img-remove').addEventListener('click', () => { imageData = ''; $('#p-file').value = ''; showPreview(); });

  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'producto';
  function uniqueId(name) {
    const base = slug(name);
    let id = base; let n = 2;
    while (products.some((p) => p.id === id)) { id = `${base}-${n++}`; }
    return id;
  }

  async function uploadImage(id) {
    const blob = await (await fetch(imageData)).blob();
    const path = `${id}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  let saving = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (saving) return;
    const name = form.elements.name.value.trim();
    const price = Number(form.elements.price.value);
    const stock = Number(form.elements.stock.value);
    const errs = {
      name: name.length < 2 ? 'Escribí el nombre del producto.' : '',
      price: form.elements.price.value === '' || !Number.isInteger(price) || price < 0 ? 'Ingresá un precio entero, en pesos.' : '',
      stock: form.elements.stock.value === '' || !Number.isInteger(stock) || stock < 0 ? 'Ingresá el stock como número entero.' : '',
    };
    let first = null;
    Object.keys(errs).forEach((k) => {
      $('#p-err-' + k).textContent = errs[k];
      if (errs[k]) { form.elements[k].setAttribute('aria-invalid', 'true'); first = first || form.elements[k]; } else form.elements[k].removeAttribute('aria-invalid');
    });
    if (first) { first.focus(); return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    saving = true; submitBtn.disabled = true;
    $('#p-form-error').textContent = '';
    try {
      const id = editing ? editing.id : uniqueId(name);
      let imageUrl = imageData;
      if (imageData && imageData.startsWith('data:')) imageUrl = await uploadImage(id);

      const row = {
        id,
        name,
        description: form.elements.description.value.trim(),
        price,
        stock,
        sold_out: form.elements.soldOut.checked,
        category_id: form.elements.category.value,
        featured: form.elements.featured.checked,
        active: form.elements.active.checked,
        image_url: imageUrl || null,
        art: (editing && editing.art) || { shape: 'bottle', color: '#e11d2e' },
      };
      const { error } = await sb.from('products').upsert(row);
      if (error) throw error;

      closeForm();
      await loadProducts();
      renderProducts();
    } catch (err) {
      $('#p-form-error').textContent = 'No se pudo guardar. Revisá la conexión e intentá de nuevo.';
    } finally {
      saving = false; submitBtn.disabled = false;
    }
  });

  /* ==========================================================
     PEDIDOS
     ========================================================== */
  const orderList = $('#order-list');
  const filter = $('#order-filter');
  filter.innerHTML = '<option value="all">Todos los estados</option>' + Object.entries(ORDER_STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  filter.addEventListener('change', renderOrders);

  const statusClass = (s) => ({ pendiente_pago: 'b-amber', pago_rechazado: 'b-red', cancelado: 'b-red', entregado: 'b-green', pago_aprobado: 'b-green' }[s] || 'b-dark');
  const opts = (map, current) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === current ? ' selected' : ''}>${v}</option>`).join('');

  function updateBadge() {
    const pending = orders.filter((o) => o.status === 'pendiente_pago' || o.status === 'en_preparacion').length;
    const badge = $('#orders-badge');
    badge.textContent = pending; badge.hidden = pending === 0;
  }

  function renderOrders() {
    const all = orders;
    updateBadge();

    const rows = filter.value === 'all' ? all : all.filter((o) => o.status === filter.value);
    $('#order-count').textContent = rows.length === 1 ? '1 pedido' : `${rows.length} pedidos`;

    if (!all.length) {
      orderList.innerHTML = '<div class="empty empty-lg"><h2>Todavía no hay pedidos</h2><p>Cuando un cliente haga un pedido desde la tienda, va a aparecer acá.</p></div>';
      return;
    }
    if (!rows.length) { orderList.innerHTML = '<div class="empty"><p>No hay pedidos con ese estado.</p></div>'; return; }

    orderList.innerHTML = rows.map((o) => {
      const when = new Date(o.createdAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
      return `
      <article class="adm-order" data-n="${esc(o.number)}">
        <details>
          <summary>
            <span class="adm-o-num">${esc(o.number)}</span>
            <span class="adm-o-who">${esc(o.customer.name)}<small>${esc(when)}</small></span>
            <span class="adm-o-total">${fmt(o.total)}</span>
            <span class="adm-badge ${statusClass(o.status)}" data-status-badge>${esc(ORDER_STATUS[o.status] || o.status)}</span>
          </summary>
          <div class="adm-o-body">
            <ul class="order-lines">${o.items.map((i) => `<li><span class="ol-name">${esc(i.name)}</span><span class="ol-qty">× ${i.quantity}</span><span class="ol-price">${fmt(i.subtotal)}</span></li>`).join('')}</ul>
            <p class="order-total"><span>Total</span><strong>${fmt(o.total)}</strong></p>
            <dl class="facts">
              <div><dt>Cliente</dt><dd>${esc(o.customer.name)} · ${esc(o.customer.phone)}<br>${esc(o.customer.email)}</dd></div>
              <div><dt>Entrega</dt><dd>${esc(o.delivery.label)}${o.delivery.address ? `<br>${esc(o.delivery.address)}` : ''}</dd></div>
              ${o.delivery.notes ? `<div><dt>Observaciones</dt><dd>${esc(o.delivery.notes)}</dd></div>` : ''}
            </dl>
            <div class="field-row">
              <div class="field"><label for="st-${esc(o.number)}">Estado del pedido</label><select class="select" id="st-${esc(o.number)}" data-set="status">${opts(ORDER_STATUS, o.status)}</select></div>
              <div class="field"><label for="pay-${esc(o.number)}">Estado del pago</label><select class="select" id="pay-${esc(o.number)}" data-set="payment">${opts(PAYMENT_STATUS, o.payment && o.payment.status)}</select></div>
            </div>
          </div>
        </details>
      </article>`;
    }).join('');
  }

  orderList.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-set]');
    if (!sel) return;
    const card = sel.closest('[data-n]');
    const o = orders.find((x) => x.number === card.dataset.n);
    if (!o) return;
    sel.disabled = true;
    try {
      if (sel.dataset.set === 'status') {
        const { error } = await sb.rpc('update_order_status', { p_number: o.number, p_status: sel.value });
        if (error) throw error;
        o.status = sel.value;
        const b = card.querySelector('[data-status-badge]');
        b.textContent = ORDER_STATUS[o.status];
        b.className = 'adm-badge ' + statusClass(o.status);
        // Cancelar devuelve el stock: refrescamos la lista de productos en segundo plano
        if (o.status === 'cancelado') loadProducts().then(renderProducts).catch(() => {});
      } else {
        const { error } = await sb.from('orders').update({ payment_status: sel.value }).eq('number', o.number);
        if (error) throw error;
        o.payment = { status: sel.value };
      }
      updateBadge();
    } catch (err) {
      window.alert('No se pudo guardar el cambio: ' + ((err && err.message) || 'error desconocido'));
      renderOrders(); // vuelve al valor real
    } finally {
      sel.disabled = false;
    }
  });

  /* ---------- Arranque ---------- */
  (async function init() {
    try {
      sb = await B.getSB();
    } catch (e) {
      showApp(false);
      loginErr.textContent = 'Falta configurar la URL de Supabase en js/config.js.';
      return;
    }
    await enter();
  })();
})();
