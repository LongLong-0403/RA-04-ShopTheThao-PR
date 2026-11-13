// Admin session is confined to this tab. Server checks the role on every mutation.
const $ = (id) => document.getElementById(id);
const pf = $('product-form');
const sf = $('sku-form');
let productId = null;
let skuId = null;
let current = null;
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('catalog-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function action(work) {
  try { await work(); } catch (error) { showToast(error.message, 'error'); }
}

async function loadProducts() {
  const rows = await api.get('/admin/products', { q: $('search').value.trim() });
  $('products').innerHTML = rows.map((p) => `<tr><td>${p.id}</td><td>${escapeHtml(p.name)}</td><td>${p.condition_type}</td><td>${p.status}</td><td><button class="btn" data-edit="${p.id}">Sửa</button> <button class="btn btn-danger" data-hide="${p.id}">Ẩn</button></td></tr>`).join('');
}

async function initialize() {
  // Admin list both verifies authorization and includes INACTIVE products.
  await loadProducts();
  for (const [path, field] of [['sports', 'sport_id'], ['categories', 'category_id'], ['brands', 'brand_id']]) {
    const rows = await api.get(`/${path}`);
    pf.elements[field].innerHTML = rows.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  }
  $('admin-content').hidden = false;
  $('login-form').hidden = true;
  $('account-state').textContent = 'Đã đăng nhập Admin';
}

$('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action(async () => {
    const f = event.currentTarget;
    const result = await api.post('/auth/login', { email: f.elements.email.value, password: f.elements.password.value });
    sessionStorage.setItem('catalog-token', result.access_token);
    f.elements.password.value = '';
    await initialize();
  });
});
$('logout').onclick = () => { sessionStorage.removeItem('catalog-token'); location.reload(); };

function resetSku() { skuId = null; sf.reset(); }
function newProduct() {
  productId = null;
  current = null;
  pf.reset();
  resetSku();
  $('children').hidden = true;
  $('editor-title').textContent = 'Thêm sản phẩm';
}

async function editProduct(id) {
  const data = await api.get(`/admin/products/${id}`);
  productId = id;
  current = data;
  for (const key of ['name', 'sport_id', 'category_id', 'brand_id', 'description', 'condition_type', 'wear_description', 'status']) {
    const field = pf.elements[key];
    const value = data.product[key] ?? '';
    if (field.tagName === 'SELECT' && !Array.from(field.options).some((o) => o.value === String(value))) {
      field.add(new Option(`ID ${value} (đã ẩn)`, value));
    }
    field.value = value;
  }
  pf.elements.specifications.value = data.product.specifications ? JSON.stringify(data.product.specifications, null, 2) : '';
  $('editor-title').textContent = `Sửa sản phẩm #${id}`;
  $('children').hidden = false;
  $('sku-list').innerHTML = data.skus.map((s) => `<p><strong>${escapeHtml(s.sku_code)}</strong> — ${escapeHtml(s.size || '')} / ${escapeHtml(s.color || '')} — ${formatMoney(s.price)} / ${s.unit} (${s.quantity_per_lot}) — Tồn: ${s.stock} <button class="btn" data-sku="${s.id}">Sửa</button> <button class="btn" data-remove-sku="${s.id}">Xóa</button></p>`).join('');
  $('image-list').innerHTML = data.images.map((i) => {
    const url = i.image_url.startsWith('/') ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, '') + i.image_url : i.image_url;
    return `<p><img src="${escapeHtml(url)}" alt="Ảnh sản phẩm" width="100" loading="lazy"> ${i.is_primary ? 'Ảnh chính' : ''} · Thứ tự ${i.sort_order} <button class="btn" data-primary="${i.id}">Làm ảnh chính</button> <button class="btn" data-order="${i.id}">Đổi thứ tự</button> <button class="btn" data-remove-image="${i.id}">Xóa</button></p>`;
  }).join('');
}

pf.addEventListener('submit', (event) => {
  event.preventDefault();
  action(async () => {
    const data = Object.fromEntries(new FormData(pf));
    for (const key of ['sport_id', 'category_id', 'brand_id']) data[key] = Number(data[key]);
    data.specifications = data.specifications.trim() ? JSON.parse(data.specifications) : null;
    if (data.specifications !== null && (typeof data.specifications !== 'object' || Array.isArray(data.specifications))) throw new Error('Thông số phải là JSON object');
    if (productId === null) {
      const row = await api.post('/products', data);
      await editProduct(row.id);
    } else {
      await api.put(`/products/${productId}`, data);
      await editProduct(productId);
    }
    await loadProducts();
    showToast('Đã lưu sản phẩm');
  });
});

sf.addEventListener('submit', (event) => {
  event.preventDefault();
  action(async () => {
    const data = Object.fromEntries(new FormData(sf));
    for (const key of ['stock', 'quantity_per_lot']) data[key] = Number(data[key]);
    data.size = data.size.trim() || null;
    data.color = data.color.trim() || null;
    const path = `/products/${productId}/skus`;
    if (skuId === null) await api.post(path, data);
    else await api.put(`${path}/${skuId}`, data);
    resetSku();
    await editProduct(productId);
    await loadProducts();
  });
});

$('image-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action(async () => {
    const f = event.currentTarget;
    await api.post(`/products/${productId}/images`, { image_url: f.elements.image_url.value, is_primary: f.elements.is_primary.checked, sort_order: Number(f.elements.sort_order.value) });
    f.reset();
    await editProduct(productId);
  });
});
$('upload-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action(async () => {
    const f = event.currentTarget;
    const file = f.elements.file.files[0];
    if (!file || file.size > 5 * 1024 * 1024) throw new Error('Chọn ảnh không quá 5 MB');
    await http.post(`/products/${productId}/images/upload`, file, { headers: { 'Content-Type': file.type } });
    f.reset();
    await editProduct(productId);
  });
});

$('admin-content').addEventListener('click', (event) => {
  const b = event.target.closest('button');
  if (!b) return;
  action(async () => {
    if (b.dataset.edit) { resetSku(); await editProduct(Number(b.dataset.edit)); }
    if (b.dataset.hide && confirm('Ẩn sản phẩm? Lịch sử đơn hàng vẫn được giữ nguyên.')) {
      await api.delete(`/products/${b.dataset.hide}`);
      if (productId === Number(b.dataset.hide)) await editProduct(productId);
      await loadProducts();
    }
    if (b.dataset.sku) {
      const s = current.skus.find((row) => row.id === Number(b.dataset.sku));
      skuId = s.id;
      for (const key of ['sku_code', 'size', 'color', 'price', 'stock', 'unit', 'quantity_per_lot']) sf.elements[key].value = s[key] ?? '';
    }
    if (b.dataset.removeSku && confirm('Xóa SKU? SKU đã có đơn không được xóa.')) {
      await api.delete(`/products/${productId}/skus/${b.dataset.removeSku}`);
      resetSku();
      await editProduct(productId);
      await loadProducts();
    }
    if (b.dataset.primary || b.dataset.order) {
      const image = current.images.find((i) => i.id === Number(b.dataset.primary || b.dataset.order));
      const order = b.dataset.order ? prompt('Thứ tự hiển thị', image.sort_order) : image.sort_order;
      if (order === null) return;
      await api.put(`/products/${productId}/images/${image.id}`, { image_url: image.image_url, is_primary: b.dataset.primary ? true : image.is_primary, sort_order: Number(order) });
      await editProduct(productId);
    }
    if (b.dataset.removeImage && confirm('Xóa ảnh?')) {
      await api.delete(`/products/${productId}/images/${b.dataset.removeImage}`);
      await editProduct(productId);
    }
  });
});
$('new-product').onclick = newProduct;
$('reset-sku').onclick = resetSku;
let searchTimer;
$('search').oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => action(loadProducts), 300); };
if (sessionStorage.getItem('catalog-token')) action(initialize);