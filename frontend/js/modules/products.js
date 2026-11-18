/**
 * TSPORT — MODULE QUẢN LÝ SẢN PHẨM & FORM SKU (CHỦ ĐỀ SẢN PHẨM)
 * Đáp ứng đầy đủ:
 * - Bảng sản phẩm có tìm kiếm, lọc môn/loại/hãng/tình trạng
 * - Form sản phẩm: bảng SKU thêm/sửa/xóa dòng (size, màu, giá, tồn, đơn vị CHIEC/LO, số lượng/lô)
 * - Upload ảnh (chọn ảnh chính duy nhất, xem trước, sắp xếp)
 * - Thông số kỹ thuật (thuộc tính - giá trị động)
 * - Phần hàng cũ: tỷ lệ hao mòn %, mô tả hao mòn bắt buộc theo chuẩn SRS
 */

(function () {
  let currentEditingProductId = null;
  let formSkus = [];
  let formImages = [];
  let formSpecs = [];

  function initProductsModule() {
    renderFiltersDropdowns();
    renderProductsTable();
    bindEvents();
  }

  // 1. Đổ dữ liệu vào các bộ lọc dropdown
  function renderFiltersDropdowns() {
    const store = window.tsportStore;
    if (!store) return;

    const sports = store.getSports();
    const categories = store.getCategories();
    const brands = store.getBrands();

    // Filter Môn
    const filterSport = document.getElementById("filterSport");
    if (filterSport) {
      filterSport.innerHTML = `<option value="ALL">Tất cả môn thể thao</option>` +
        sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }

    // Filter Loại hàng
    const filterCategory = document.getElementById("filterCategory");
    if (filterCategory) {
      filterCategory.innerHTML = `<option value="ALL">Tất cả loại hàng</option>` +
        categories.map((c) => `<option value="${c.id}">${c.parent_id ? '— ' : ''}${escapeHtml(c.name)}</option>`).join("");
    }

    // Filter Thương hiệu
    const filterBrand = document.getElementById("filterBrand");
    if (filterBrand) {
      filterBrand.innerHTML = `<option value="ALL">Tất cả thương hiệu</option>` +
        brands.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
    }
  }

  // 2. Render Bảng sản phẩm
  // 2. Render Bảng sản phẩm (Có xử lý Loading / Rỗng / Lỗi)
  function renderProductsTable() {
    const store = window.tsportStore;
    const tableBody = document.getElementById("productsTableBody");
    const countBadge = document.getElementById("productsCountBadge");
    if (!store || !tableBody) return;

    try {
      const filters = {
        search: document.getElementById("productSearchInput")?.value || "",
        sport_id: document.getElementById("filterSport")?.value || "ALL",
        category_id: document.getElementById("filterCategory")?.value || "ALL",
        brand_id: document.getElementById("filterBrand")?.value || "ALL",
        condition_type: document.getElementById("filterCondition")?.value || "ALL"
      };

      const products = store.getProducts(filters);
      if (countBadge) countBadge.textContent = `${products.length} sản phẩm`;

      // Trạng thái RỖNG (Empty State)
      if (products.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 48px 20px; color: #64748B;">
              <div style="font-size: 38px; margin-bottom: 12px;">📦</div>
              <div style="font-size: 16px; font-weight: 700; color: #1E293B;">Không tìm thấy sản phẩm nào</div>
              <div style="font-size: 13px; margin: 6px auto 16px; max-width: 440px; color: #64748B;">
                Không có sản phẩm nào khớp với từ khóa tìm kiếm hoặc các tiêu chí lọc môn, danh mục, hãng, tình trạng đang chọn.
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btnResetProductFilters" style="padding: 6px 16px; font-weight: 600; background:#F1F5F9; border-color:#CBD5E1;">
                ✕ Xóa tất cả bộ lọc
              </button>
            </td>
          </tr>
        `;
        document.getElementById("btnResetProductFilters")?.addEventListener("click", resetProductFilters);
        return;
      }

      let html = "";
      products.forEach((prod) => {
        const sport = store.getSportById(prod.sport_id);
        const cat = store.getCategoryById(prod.category_id);
        const brand = store.getBrandById(prod.brand_id);

        // Ảnh chính
        const primaryImg = (prod.images || []).find((i) => i.is_primary) || (prod.images || [])[0] || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=120" };

        // Tính tổng tồn kho và khoảng giá từ các SKU
        const skus = prod.skus || [];
        const totalStock = skus.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
        const prices = skus.map((s) => Number(s.price) || 0);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const priceText = minPrice === maxPrice ? formatMoney(minPrice) : `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`;

        // Tình trạng badge
        const isMoi = prod.condition_type === "MOI";
        const conditionBadge = isMoi
          ? `<span class="badge badge-moi">Mới 100%</span>`
          : `<span class="badge badge-cu" title="${escapeHtml(prod.wear_description || '')}">Đồ cũ ~${escapeHtml(prod.specifications?.condition_grade || '90%')}</span>`;

        // Trạng thái badge
        const statusBadge = prod.status === "ACTIVE"
          ? `<span class="badge badge-active">● Đang bán</span>`
          : `<span class="badge badge-inactive">○ Tạm ẩn</span>`;

        // Tồn kho badge
        let stockBadgeClass = "is-ok";
        if (totalStock === 0) stockBadgeClass = "is-out";
        else if (totalStock < 5) stockBadgeClass = "is-low";

        html += `
          <tr>
            <td>
              <div class="tsport-product-cell">
                <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(prod.name)}" class="tsport-product-thumb" />
                <div class="tsport-product-info">
                  <span class="tsport-product-name">${escapeHtml(prod.name)}</span>
                  <span class="tsport-product-id">Mã: SP-${String(prod.id).padStart(3, '0')}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="badge badge-sport">${escapeHtml(sport ? sport.name : '-')}</span>
            </td>
            <td>
              <span class="badge badge-cat">${escapeHtml(cat ? cat.name : '-')}</span>
            </td>
            <td>
              <span class="badge badge-brand">${escapeHtml(brand ? brand.name : '-')}</span>
            </td>
            <td>${conditionBadge}</td>
            <td>
              <div class="tsport-price-range">${priceText}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                <span class="tsport-sku-pill">${skus.length} SKU</span>
                ${skus.map(s => escapeHtml(s.size || s.color || '')).filter(Boolean).slice(0, 2).join(", ")}
              </div>
            </td>
            <td>
              <span class="tsport-stock-badge ${stockBadgeClass}">${totalStock} SP</span>
            </td>
            <td>${statusBadge}</td>
            <td>
              <div class="tsport-actions-cell">
                <button type="button" class="btn-icon js-edit-product" data-id="${prod.id}" title="Sửa sản phẩm">✏️</button>
                <button type="button" class="btn-icon js-view-skus" data-id="${prod.id}" title="Xem và ẩn/hiện biến thể SKU">📋</button>
                <button type="button" class="btn-icon js-toggle-product" data-id="${prod.id}" title="${prod.status === 'ACTIVE' ? 'Tạm ẩn' : 'Kích hoạt'}">
                  ${prod.status === 'ACTIVE' ? '👁️' : '🕶️'}
                </button>
                <button type="button" class="btn-icon js-delete-product" data-id="${prod.id}" title="Xóa" style="color:#DC2626;">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      });

      tableBody.innerHTML = html;
    } catch (err) {
      // Trạng thái LỖI (Error State)
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px 20px; color: #DC2626; background: #FEF2F2;">
            <div style="font-size: 36px; margin-bottom: 8px;">⚠️</div>
            <div style="font-size: 15px; font-weight: 700;">Đã xảy ra lỗi khi tải dữ liệu sản phẩm</div>
            <div style="font-size: 12px; margin: 4px auto 14px; max-width: 500px; color: #991B1B;">${escapeHtml(err.message)}</div>
            <button type="button" class="btn btn-primary btn-sm" id="btnRetryRenderProducts" style="background:#D94C26; border-color:#D94C26;">
              🔄 Thử lại
            </button>
          </td>
        </tr>
      `;
      document.getElementById("btnRetryRenderProducts")?.addEventListener("click", renderProductsTable);
    }
  }

  function resetProductFilters() {
    const searchInput = document.getElementById("productSearchInput");
    const filterSport = document.getElementById("filterSport");
    const filterCategory = document.getElementById("filterCategory");
    const filterBrand = document.getElementById("filterBrand");
    const filterCondition = document.getElementById("filterCondition");
    if (searchInput) searchInput.value = "";
    if (filterSport) filterSport.value = "ALL";
    if (filterCategory) filterCategory.value = "ALL";
    if (filterBrand) filterBrand.value = "ALL";
    if (filterCondition) filterCondition.value = "ALL";
    renderProductsTable();
  }

  // 3. Mở Modal Form Sản phẩm (Thêm mới hoặc Chỉnh sửa)
  function openProductFormModal(productId = null) {
    const store = window.tsportStore;
    if (!store) return;

    currentEditingProductId = productId ? Number(productId) : null;
    const modalTitle = document.getElementById("productModalTitle");
    const sports = store.getSports();
    const categories = store.getCategories();
    const brands = store.getBrands();

    // Điền danh sách chọn Môn, Danh mục, Hãng
    const selSport = document.getElementById("formProdSport");
    const selCat = document.getElementById("formProdCategory");
    const selBrand = document.getElementById("formProdBrand");

    if (selSport) selSport.innerHTML = sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    if (selCat) selCat.innerHTML = categories.map((c) => `<option value="${c.id}">${c.parent_id ? '↳ ' : ''}${escapeHtml(c.name)}</option>`).join("");
    if (selBrand) selBrand.innerHTML = brands.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");

    if (currentEditingProductId) {
      const prod = store.getProductById(currentEditingProductId);
      if (!prod) return;
      if (modalTitle) modalTitle.textContent = `Chỉnh sửa sản phẩm #${prod.id} — ${prod.name}`;

      document.getElementById("formProdName").value = prod.name;
      document.getElementById("formProdSport").value = prod.sport_id;
      document.getElementById("formProdCategory").value = prod.category_id;
      document.getElementById("formProdBrand").value = prod.brand_id;
      document.getElementById("formProdDesc").value = prod.description || "";
      document.getElementById("formProdStatus").value = prod.status || "ACTIVE";

      // Radio tình trạng
      const isCu = prod.condition_type === "CU";
      document.getElementById("condMoi").checked = !isCu;
      document.getElementById("condCu").checked = isCu;
      toggleUsedBox(isCu);

      if (isCu) {
        document.getElementById("formProdWearDesc").value = prod.wear_description || "";
        document.getElementById("formProdWearGrade").value = parseInt(prod.specifications?.condition_grade) || 90;
      }

      // Khởi tạo SKU, Ảnh, Specs
      formSkus = JSON.parse(JSON.stringify(prod.skus || []));
      formImages = JSON.parse(JSON.stringify(prod.images || []));
      formSpecs = Object.entries(prod.specifications || {})
        .filter(([k]) => k !== "condition_grade")
        .map(([key, value]) => ({ key, value }));
    } else {
      if (modalTitle) modalTitle.textContent = "Thêm sản phẩm mới (Đầy đủ Bảng SKU & Hàng cũ)";
      document.getElementById("formProductMain").reset();
      document.getElementById("condMoi").checked = true;
      toggleUsedBox(false);

      // Mặc định 1 dòng SKU mẫu
      formSkus = [
        { sku_code: "SKU-NEW-01", size: "Tiêu chuẩn", color: "Cam Trắng", price: 1200000, sale_price: 1050000, stock: 10, unit: "CHIEC", quantity_per_lot: 1 }
      ];
      // Mặc định 1 ảnh mẫu
      formImages = [
        { id: 1, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true, sort_order: 1 }
      ];
      formSpecs = [
        { key: "Trọng lượng", value: "4U (83g)" },
        { key: "Chất liệu", value: "High Modulus Graphite" }
      ];
    }

    renderSkuRows();
    renderImageCards();
    renderSpecRows();
    openModal("modalProductForm");
  }

  // 4. Bật / Tắt Hộp Hàng cũ
  function toggleUsedBox(isUsed) {
    const box = document.getElementById("usedProductBox");
    const radioMoiWrap = document.getElementById("wrapCondMoi");
    const radioCuWrap = document.getElementById("wrapCondCu");
    if (box) box.classList.toggle("is-visible", isUsed);
    if (radioMoiWrap) radioMoiWrap.classList.toggle("is-selected", !isUsed);
    if (radioCuWrap) radioCuWrap.classList.toggle("is-selected", isUsed);
  }

  // 5. Render Bảng SKU tương tác
  function renderSkuRows() {
    const tbody = document.getElementById("formSkuTableBody");
    if (!tbody) return;

    if (formSkus.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#94A3B8;padding:16px;">Chưa có dòng SKU nào. Bấm "+ Thêm dòng SKU" bên dưới!</td></tr>`;
      return;
    }

    let html = "";
    formSkus.forEach((sku, idx) => {
      html += `
        <tr>
          <td>
            <input type="text" class="tsport-sku-input" value="${escapeHtml(sku.sku_code || '')}" placeholder="Mã SKU..." onchange="window.__updateSku(${idx}, 'sku_code', this.value)" />
          </td>
          <td>
            <input type="text" class="tsport-sku-input" value="${escapeHtml(sku.size || '')}" placeholder="3U, 40, M..." onchange="window.__updateSku(${idx}, 'size', this.value)" />
          </td>
          <td>
            <input type="text" class="tsport-sku-input" value="${escapeHtml(sku.color || '')}" placeholder="Đỏ, Xanh..." onchange="window.__updateSku(${idx}, 'color', this.value)" />
          </td>
          <td>
            <input type="number" class="tsport-sku-input sku-price" value="${sku.price || 0}" step="10000" placeholder="Giá niêm yết" onchange="window.__updateSku(${idx}, 'price', Number(this.value))" />
          </td>
          <td>
            <input type="number" class="tsport-sku-input sku-sale-price" value="${sku.sale_price !== undefined && sku.sale_price !== null ? sku.sale_price : ''}" step="10000" placeholder="Giá sale (KM)" onchange="window.__updateSku(${idx}, 'sale_price', this.value === '' ? null : Number(this.value))" />
          </td>
          <td>
            <input type="number" class="tsport-sku-input" value="${sku.stock || 0}" min="0" onchange="window.__updateSku(${idx}, 'stock', Number(this.value))" />
          </td>
          <td>
            <select class="tsport-sku-input" onchange="window.__updateSkuUnit(${idx}, this.value)">
              <option value="CHIEC" ${sku.unit === 'CHIEC' ? 'selected' : ''}>CHIẾC (1 cái)</option>
              <option value="LO" ${sku.unit === 'LO' ? 'selected' : ''}>LÔ (Nhiều cái)</option>
            </select>
          </td>
          <td>
            <input type="number" class="tsport-sku-input" value="${sku.quantity_per_lot || 1}" min="1" ${sku.unit === 'CHIEC' ? 'disabled style="background:#f1f5f9;"' : ''} onchange="window.__updateSku(${idx}, 'quantity_per_lot', Number(this.value))" />
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn-icon" style="color:#DC2626;" onclick="window.__removeSku(${idx})" title="Xóa dòng">🗑️</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // 6. Quản lý Ảnh sản phẩm
  function renderImageCards() {
    const grid = document.getElementById("formImageGrid");
    if (!grid) return;

    let html = "";
    formImages.forEach((img, idx) => {
      html += `
        <div class="tsport-img-card ${img.is_primary ? 'is-primary' : ''}">
          <img src="${escapeHtml(img.image_url)}" alt="Ảnh" class="tsport-img-preview" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=120'" />
          <div class="tsport-img-controls">
            <label class="tsport-img-primary-radio">
              <input type="radio" name="formPrimaryImage" ${img.is_primary ? 'checked' : ''} onchange="window.__setPrimaryImage(${idx})" />
              <span>${img.is_primary ? '⭐ Chính' : 'Đặt chính'}</span>
            </label>
            <button type="button" class="tsport-img-remove-btn" onclick="window.__removeImage(${idx})" title="Xóa ảnh">✕</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  // 7. Thông số kỹ thuật (Specifications Key-Value)
  function renderSpecRows() {
    const container = document.getElementById("formSpecList");
    if (!container) return;

    let html = "";
    formSpecs.forEach((spec, idx) => {
      html += `
        <div class="tsport-spec-row">
          <input type="text" class="form-control tsport-spec-key" placeholder="Tên thông số (vd: Trọng lượng)" value="${escapeHtml(spec.key)}" onchange="window.__updateSpec(${idx}, 'key', this.value)" />
          <input type="text" class="form-control tsport-spec-val" placeholder="Giá trị (vd: 4U/83g)" value="${escapeHtml(spec.value)}" onchange="window.__updateSpec(${idx}, 'value', this.value)" />
          <button type="button" class="btn-icon" style="color:#DC2626;" onclick="window.__removeSpec(${idx})" title="Xóa thông số">✕</button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  // 8. Lưu sản phẩm từ Form Modal
  function handleSaveProduct(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store) return;

    try {
      const isCu = document.getElementById("condCu").checked;
      const wearGrade = document.getElementById("formProdWearGrade")?.value || "90";
      const specsObj = {};
      formSpecs.forEach((s) => {
        if (s.key && s.key.trim()) specsObj[s.key.trim()] = s.value;
      });
      if (isCu) specsObj.condition_grade = `${wearGrade}%`;

      // Kiểm tra tính hợp lệ của giá sale so với giá niêm yết
      for (const s of formSkus) {
        if (s.sale_price !== null && s.sale_price !== undefined && s.sale_price !== "") {
          const sp = Number(s.sale_price);
          const pr = Number(s.price);
          if (sp >= pr) {
            alert(`⚠️ Cảnh báo biến thể SKU "${s.sku_code}": Giá sale (${formatMoney(sp)}) phải nhỏ hơn Giá niêm yết (${formatMoney(pr)})!`);
            return;
          }
        }
      }

      const prodData = {
        id: currentEditingProductId,
        name: document.getElementById("formProdName").value.trim(),
        sport_id: Number(document.getElementById("formProdSport").value),
        category_id: Number(document.getElementById("formProdCategory").value),
        brand_id: Number(document.getElementById("formProdBrand").value),
        description: document.getElementById("formProdDesc").value.trim(),
        status: document.getElementById("formProdStatus").value,
        condition_type: isCu ? "CU" : "MOI",
        wear_description: isCu ? document.getElementById("formProdWearDesc").value.trim() : null,
        specifications: specsObj,
        skus: formSkus,
        images: formImages
      };

      store.saveProduct(prodData);
      closeModal("modalProductForm");
      renderProductsTable();
      showToast(currentEditingProductId ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới kèm bảng SKU thành công!", "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  // 9. Xem nhanh chi tiết SKU & Ẩn/Hiện SKU riêng biệt
  function openSkuDetailModal(productId) {
    const store = window.tsportStore;
    const prod = store.getProductById(productId);
    if (!prod) return;

    const modalTitle = document.getElementById("skuDetailTitle");
    const modalBody = document.getElementById("skuDetailBody");
    if (modalTitle) modalTitle.textContent = `Bảng biến thể SKU — ${prod.name}`;

    const skus = prod.skus || [];
    if (skus.length === 0) {
      if (modalBody) {
        modalBody.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:#64748B;">
            <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
            <div style="font-weight:700;">Sản phẩm này chưa có biến thể SKU nào</div>
            <div style="font-size:12px; margin-top:4px;">Vui lòng mở form chỉnh sửa sản phẩm để thêm dòng biến thể.</div>
          </div>
        `;
      }
      openModal("modalSkuDetail");
      return;
    }

    let html = `
      <div style="margin-bottom: 14px; font-size: 13px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <strong>Sản phẩm:</strong> ${escapeHtml(prod.name)} • 
          <strong>Tình trạng:</strong> ${prod.condition_type === 'MOI' ? 'Mới 100%' : 'Đồ cũ (~' + (prod.specifications?.condition_grade || '90%') + ')'}
        </div>
        <div style="font-size:12px; color:#64748B;">
          💡 <em>Ẩn SKU sẽ không làm thay đổi giá hay mất dòng trên đơn hàng cũ đã đặt.</em>
        </div>
      </div>
      <div class="tsport-table-responsive">
        <table class="tsport-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Size / Cỡ</th>
              <th>Màu sắc</th>
              <th>Giá niêm yết</th>
              <th>Giá sale (KM)</th>
              <th>Tồn kho</th>
              <th>Đơn vị</th>
              <th>Quy cách</th>
              <th>Trạng thái</th>
              <th style="text-align:center;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${skus.map((s) => {
              const isInactive = s.status === 'INACTIVE';
              const hasSale = s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price);
              const discountPercent = hasSale ? Math.round((1 - s.sale_price / s.price) * 100) : 0;
              return `
                <tr style="${isInactive ? 'opacity:0.65; background:#F8FAFC;' : ''}">
                  <td><code>${escapeHtml(s.sku_code)}</code></td>
                  <td><strong>${escapeHtml(s.size || '-')}</strong></td>
                  <td>${escapeHtml(s.color || '-')}</td>
                  <td style="${hasSale ? 'text-decoration:line-through; color:#94A3B8;' : 'color:#D94C26; font-weight:700;'}">
                    ${formatMoney(s.price)}
                  </td>
                  <td>
                    ${hasSale 
                      ? `<div style="color:#D94C26; font-weight:800;">${formatMoney(s.sale_price)} <span class="badge" style="background:#FEE2E2; color:#DC2626; font-size:10px;">-${discountPercent}%</span></div>`
                      : '<span style="color:#94A3B8;">-</span>'
                    }
                  </td>
                  <td><span class="badge ${s.stock > 0 ? 'badge-moi' : 'badge-inactive'}">${s.stock} SP</span></td>
                  <td>${s.unit === 'LO' ? 'Lô' : 'Chiếc'}</td>
                  <td>${s.quantity_per_lot} ${s.unit === 'LO' ? 'cái/lô' : 'cái'}</td>
                  <td>
                    ${isInactive
                      ? '<span class="badge badge-inactive">○ Tạm ẩn</span>'
                      : '<span class="badge badge-active">● Đang bán</span>'}
                  </td>
                  <td style="text-align:center;">
                    <button type="button" 
                      class="btn btn-secondary btn-sm js-toggle-sku-status" 
                      data-product-id="${prod.id}" 
                      data-sku-id="${s.id}" 
                      style="font-size:11px; padding:3px 8px; ${isInactive ? 'color:#16A34A; border-color:#86EFAC;' : 'color:#DC2626; border-color:#FCA5A5;'}">
                      ${isInactive ? 'Mở bán lại' : 'Tạm ẩn SKU'}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
                      ${isInactive ? '▶ Hiện SKU' : '⏸ Ẩn SKU'}
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
    if (modalBody) modalBody.innerHTML = html;
    openModal("modalSkuDetail");
  }

  // Các hàm Global phục vụ tương tác trực tiếp
  window.__updateSku = (idx, field, val) => { formSkus[idx][field] = val; };
  window.__updateSkuUnit = (idx, val) => {
    formSkus[idx].unit = val;
    formSkus[idx].quantity_per_lot = val === 'LO' ? 12 : 1;
    renderSkuRows();
  };
  window.__removeSku = (idx) => { formSkus.splice(idx, 1); renderSkuRows(); };
  window.__setPrimaryImage = (idx) => {
    formImages.forEach((img, i) => { img.is_primary = i === idx; });
    renderImageCards();
  };
  window.__removeImage = (idx) => { formImages.splice(idx, 1); renderImageCards(); };
  window.__updateSpec = (idx, field, val) => { formSpecs[idx][field] = val; };
  window.__removeSpec = (idx) => { formSpecs.splice(idx, 1); renderSpecRows(); };

  function bindEvents() {
    // Lọc và tìm kiếm
    document.getElementById("productSearchInput")?.addEventListener("input", renderProductsTable);
    document.getElementById("filterSport")?.addEventListener("change", renderProductsTable);
    document.getElementById("filterCategory")?.addEventListener("change", renderProductsTable);
    document.getElementById("filterBrand")?.addEventListener("change", renderProductsTable);
    document.getElementById("filterCondition")?.addEventListener("change", renderProductsTable);

    // Nút Thêm sản phẩm
    document.getElementById("btnAddNewProduct")?.addEventListener("click", () => openProductFormModal(null));

    // Thêm dòng SKU
    document.getElementById("btnAddSkuRow")?.addEventListener("click", () => {
      const code = `SKU-${Date.now().toString().slice(-4)}`;
      formSkus.push({ sku_code: code, size: "4U", color: "Tiêu chuẩn", price: 1500000, sale_price: null, stock: 10, unit: "CHIEC", quantity_per_lot: 1 });
      renderSkuRows();
    });

    // Thêm ảnh
    document.getElementById("btnAddImage")?.addEventListener("click", () => {
      const url = prompt("Nhập đường dẫn URL ảnh sản phẩm:", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600");
      if (url && url.trim()) {
        formImages.push({
          id: Date.now(),
          image_url: url.trim(),
          is_primary: formImages.length === 0,
          sort_order: formImages.length + 1
        });
        renderImageCards();
      }
    });

    // Thêm thông số
    document.getElementById("btnAddSpec")?.addEventListener("click", () => {
      formSpecs.push({ key: "", value: "" });
      renderSpecRows();
    });

    // Radio tình trạng
    document.getElementById("condMoi")?.addEventListener("change", () => toggleUsedBox(false));
    document.getElementById("condCu")?.addEventListener("change", () => toggleUsedBox(true));

    // Submit Form
    document.getElementById("formProductMain")?.addEventListener("submit", handleSaveProduct);

    // Event delegation cho bảng sản phẩm
    document.getElementById("productsTableBody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".js-edit-product");
      if (editBtn) openProductFormModal(editBtn.dataset.id);

      const viewSkuBtn = e.target.closest(".js-view-skus");
      if (viewSkuBtn) openSkuDetailModal(viewSkuBtn.dataset.id);

      const toggleBtn = e.target.closest(".js-toggle-product");
      if (toggleBtn) {
        window.tsportStore.toggleProductStatus(toggleBtn.dataset.id);
        renderProductsTable();
        showToast("Đã thay đổi trạng thái hiển thị sản phẩm!", "success");
      }

      const delBtn = e.target.closest(".js-delete-product");
      if (delBtn) {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?")) {
          window.tsportStore.deleteProduct(delBtn.dataset.id);
          renderProductsTable();
          showToast("Đã xóa sản phẩm thành công!", "success");
        }
      }
    });

    // Event delegation cho Modal SKU (Ẩn / Hiện SKU riêng biệt)
    document.getElementById("skuDetailBody")?.addEventListener("click", (e) => {
      const toggleSkuBtn = e.target.closest(".js-toggle-sku-status");
      if (toggleSkuBtn) {
        const prodId = Number(toggleSkuBtn.dataset.productId);
        const skuId = Number(toggleSkuBtn.dataset.skuId);
        const newStatus = window.tsportStore.toggleSkuStatus(prodId, skuId);
        openSkuDetailModal(prodId);
        renderProductsTable();
        showToast(newStatus === "INACTIVE" ? "Đã tạm ẩn biến thể SKU khỏi cửa hàng!" : "Đã bật mở bán lại biến thể SKU!", "success");
      }
    });

    // Nút test điền nhanh
    document.getElementById("btnTestSeedNewProd")?.addEventListener("click", () => {
      openProductFormModal(null);
      document.getElementById("formProdName").value = "Vợt Tennis Wilson Clash 100 Pro V2 2026";
      document.getElementById("formProdSport").value = 3; // Tennis
      document.getElementById("formProdCategory").value = 3; // Vợt Tennis
      document.getElementById("formProdBrand").value = 6; // Wilson
      document.getElementById("formProdDesc").value = "Cây vợt kiểm soát bóng êm tay nhất của Wilson trang bị công nghệ FortyFive carbon.";
      formSkus = [
        { sku_code: "CLASH-100-G2", size: "Grip 2 (4 1/4)", color: "Đỏ Đen Ánh Kim", price: 5400000, stock: 12, unit: "CHIEC", quantity_per_lot: 1 },
        { sku_code: "CLASH-100-G3", size: "Grip 3 (4 3/8)", color: "Đỏ Đen Ánh Kim", price: 5400000, stock: 8, unit: "CHIEC", quantity_per_lot: 1 }
      ];
      renderSkuRows();
      showToast("Đã nạp dữ liệu mẫu sản phẩm mới với 2 SKU!", "success");
    });

    document.getElementById("btnTestSeedUsedProd")?.addEventListener("click", () => {
      openProductFormModal(null);
      document.getElementById("formProdName").value = "Vợt cầu lông Yonex Astrox 77 Pro (Cũ ~88%)";
      document.getElementById("formProdSport").value = 1; // Cầu lông
      document.getElementById("formProdCategory").value = 2; // Vợt cầu lông
      document.getElementById("formProdBrand").value = 1; // Yonex
      document.getElementById("condCu").checked = true;
      toggleUsedBox(true);
      document.getElementById("formProdWearGrade").value = 88;
      document.getElementById("formProdWearDesc").value = "Đầu khung vợt có 2 vết xước sơn 3mm góc 11h do va vợt đôi, thân carbon nguyên bản không rạn nứt, cước đan 11kg còn tốt.";
      formSkus = [
        { sku_code: "USED-AX77P-4U", size: "4U/G5", color: "Cam Đen", price: 2150000, stock: 1, unit: "CHIEC", quantity_per_lot: 1 }
      ];
      renderSkuRows();
      showToast("Đã nạp mẫu Hàng Cũ có mô tả hao mòn chuẩn SRS!", "success");
    });
  }

  document.addEventListener("DOMContentLoaded", initProductsModule);
})();
