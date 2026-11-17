/**
 * TSPORT — MODULE QUẢN TRỊ DANH MỤC (3 TABS: MÔN / CÂY DANH MỤC / THƯƠNG HIỆU)
 * Đáp ứng đầy đủ:
 * - 3 Tab: Môn thể thao / Danh mục (Cây cha - con) / Thương hiệu
 * - Bảng + Form Modal thêm/sửa
 * - XÓA CÓ XÁC NHẬN & BÁO LỖI RÀNG BUỘC khi còn sản phẩm tham chiếu hoặc còn danh mục con
 */

(function () {
  let activeTab = "sports"; // 'sports' | 'categories' | 'brands'
  let currentEditingItem = null;
  let itemToDelete = null;

  function initCategoriesModule() {
    renderActiveTab();
    bindEvents();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".tsport-catalog-tab-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tab);
    });
    document.querySelectorAll(".tsport-tab-pane").forEach((pane) => {
      pane.classList.toggle("is-active", pane.id === `pane-${tab}`);
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    if (activeTab === "sports") renderSportsTable();
    else if (activeTab === "categories") renderCategoriesTable();
    else if (activeTab === "brands") renderBrandsTable();
  }

  // 1. Render Bảng Môn thể thao (Sports)
  function renderSportsTable() {
    const store = window.tsportStore;
    const tbody = document.getElementById("sportsTableBody");
    if (!store || !tbody) return;

    const sports = store.getSports();
    const products = store.getProducts();

    let html = "";
    sports.forEach((sport) => {
      const prodCount = products.filter((p) => p.sport_id === sport.id).length;
      html += `
        <tr>
          <td><strong>#${sport.id}</strong></td>
          <td><span style="font-size:15px; font-weight:700; color:#1E293B;">${escapeHtml(sport.name)}</span></td>
          <td><code>${escapeHtml(sport.slug)}</code></td>
          <td style="color:#64748B;">${escapeHtml(sport.description || '-')}</td>
          <td>
            <span class="badge ${prodCount > 0 ? 'badge-sport' : 'badge-inactive'}">
              ${prodCount} sản phẩm
            </span>
          </td>
          <td>
            <span class="badge ${sport.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
              ${sport.status === 'ACTIVE' ? '● Đang mở' : '○ Tạm ẩn'}
            </span>
          </td>
          <td>
            <div class="tsport-actions-cell">
              <button type="button" class="btn-icon js-edit-sport" data-id="${sport.id}" title="Sửa">✏️</button>
              <button type="button" class="btn-icon js-delete-sport" data-id="${sport.id}" title="Xóa" style="color:#DC2626;">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // 2. Render Bảng Danh mục CÂY CHA - CON (Tree Hierarchy)
  function renderCategoriesTable() {
    const store = window.tsportStore;
    const tbody = document.getElementById("categoriesTableBody");
    if (!store || !tbody) return;

    const categoriesTree = store.getCategoryTree();
    const products = store.getProducts();
    const sports = store.getSports();

    let html = "";
    categoriesTree.forEach((parent) => {
      const parentProdCount = products.filter((p) => p.category_id === parent.id).length;
      const sport = sports.find((s) => s.id === parent.sport_id);

      // Dòng Danh mục cha (Cấp 1)
      html += `
        <tr class="tree-level-1" style="background:#FFFBF8;">
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">📁</span>
              <span style="font-weight:800; color:#D94C26;">${escapeHtml(parent.name)}</span>
              <span class="tsport-tree-badge-parent">Cấp 1 • Gốc</span>
            </div>
          </td>
          <td><span style="color:#94A3B8;">— (Là gốc)</span></td>
          <td><code>${escapeHtml(parent.slug)}</code></td>
          <td>
            <span class="badge ${parentProdCount > 0 ? 'badge-cat' : 'badge-inactive'}">
              ${parentProdCount} SP trực tiếp
            </span>
          </td>
          <td>
            <span class="badge ${parent.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
              ${parent.status}
            </span>
          </td>
          <td>
            <div class="tsport-actions-cell">
              <button type="button" class="btn-icon js-edit-cat" data-id="${parent.id}" title="Sửa">✏️</button>
              <button type="button" class="btn-icon js-delete-cat" data-id="${parent.id}" title="Xóa" style="color:#DC2626;">🗑️</button>
            </div>
          </td>
        </tr>
      `;

      // Các dòng Danh mục con (Cấp 2 - Thụt lề)
      (parent.children || []).forEach((child) => {
        const childProdCount = products.filter((p) => p.category_id === child.id).length;
        html += `
          <tr class="tree-level-2">
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:600; color:#1E293B;">${escapeHtml(child.name)}</span>
                <span class="tsport-tree-badge-child">Cấp 2</span>
              </div>
            </td>
            <td>
              <span style="color:#2563EB; font-weight:600;">↳ Thuộc: ${escapeHtml(parent.name)}</span>
            </td>
            <td><code>${escapeHtml(child.slug)}</code></td>
            <td>
              <span class="badge ${childProdCount > 0 ? 'badge-cat' : 'badge-inactive'}">
                ${childProdCount} sản phẩm
              </span>
            </td>
            <td>
              <span class="badge ${child.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
                ${child.status}
              </span>
            </td>
            <td>
              <div class="tsport-actions-cell">
                <button type="button" class="btn-icon js-edit-cat" data-id="${child.id}" title="Sửa">✏️</button>
                <button type="button" class="btn-icon js-delete-cat" data-id="${child.id}" title="Xóa" style="color:#DC2626;">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      });
    });

    tbody.innerHTML = html;
  }

  // 3. Render Bảng Thương hiệu (Brands)
  function renderBrandsTable() {
    const store = window.tsportStore;
    const tbody = document.getElementById("brandsTableBody");
    if (!store || !tbody) return;

    const brands = store.getBrands();
    const products = store.getProducts();

    let html = "";
    brands.forEach((brand) => {
      const prodCount = products.filter((p) => p.brand_id === brand.id).length;
      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${escapeHtml(brand.logo_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120')}" class="tsport-brand-logo-thumb" alt="${escapeHtml(brand.name)}" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120'" />
              <span style="font-weight:700; font-size:14px; color:#1E293B;">${escapeHtml(brand.name)}</span>
            </div>
          </td>
          <td><code>${escapeHtml(brand.slug)}</code></td>
          <td>
            <span class="badge ${prodCount > 0 ? 'badge-brand' : 'badge-inactive'}">
              ${prodCount} sản phẩm
            </span>
          </td>
          <td>
            <span class="badge ${brand.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
              ${brand.status}
            </span>
          </td>
          <td>
            <div class="tsport-actions-cell">
              <button type="button" class="btn-icon js-edit-brand" data-id="${brand.id}" title="Sửa">✏️</button>
              <button type="button" class="btn-icon js-delete-brand" data-id="${brand.id}" title="Xóa" style="color:#DC2626;">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // 4. Mở Modal Thêm / Sửa
  function openCatalogModal(type, id = null) {
    const store = window.tsportStore;
    if (!store) return;

    currentEditingItem = { type, id: id ? Number(id) : null };
    const modalTitle = document.getElementById("catalogModalTitle");
    const dynamicFields = document.getElementById("catalogDynamicFields");

    let titleText = "";
    let fieldsHtml = "";

    if (type === "sport") {
      const sport = id ? store.getSportById(id) : null;
      titleText = sport ? `Sửa Môn thể thao: ${sport.name}` : "Thêm Môn thể thao mới";
      fieldsHtml = `
        <div class="form-group">
          <label class="form-label">Tên môn thể thao <span class="req">*</span></label>
          <input type="text" id="catItemName" class="form-control" value="${escapeHtml(sport ? sport.name : '')}" placeholder="Ví dụ: Cầu lông, Bóng đá, Bơi lội..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Mô tả môn thể thao</label>
          <textarea id="catItemDesc" class="form-control" rows="3" placeholder="Mô tả tóm tắt môn thể thao...">${escapeHtml(sport ? sport.description || '' : '')}</textarea>
        </div>
      `;
    } else if (type === "category") {
      const cat = id ? store.getCategoryById(id) : null;
      titleText = cat ? `Sửa Danh mục: ${cat.name}` : "Thêm Danh mục mới (Hỗ trợ Cây cha-con)";
      const allCats = store.getCategories().filter((c) => !id || c.id !== Number(id)); // chống chọn chính nó

      fieldsHtml = `
        <div class="form-group">
          <label class="form-label">Tên danh mục <span class="req">*</span></label>
          <input type="text" id="catItemName" class="form-control" value="${escapeHtml(cat ? cat.name : '')}" placeholder="Ví dụ: Vợt cầu lông, Giày thể thao..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Danh mục cha (Cấp trên) — Cây phân cấp</label>
          <select id="catItemParent" class="form-control">
            <option value="">[ — Là danh mục gốc (Cấp 1) — ]</option>
            ${allCats.filter(c => !c.parent_id).map((c) => `
              <option value="${c.id}" ${cat && cat.parent_id === c.id ? 'selected' : ''}>📁 ${escapeHtml(c.name)} (Cấp 1)</option>
            `).join("")}
          </select>
          <div style="font-size:11px; color:#64748B; margin-top:4px;">
            Chọn danh mục cha để tạo nhánh con Cấp 2. Để trống nếu đây là danh mục gốc.
          </div>
        </div>
      `;
    } else if (type === "brand") {
      const brand = id ? store.getBrandById(id) : null;
      titleText = brand ? `Sửa Thương hiệu: ${brand.name}` : "Thêm Thương hiệu mới";
      fieldsHtml = `
        <div class="form-group">
          <label class="form-label">Tên thương hiệu <span class="req">*</span></label>
          <input type="text" id="catItemName" class="form-control" value="${escapeHtml(brand ? brand.name : '')}" placeholder="Ví dụ: Yonex, Nike, Wilson, Adidas..." required />
        </div>
        <div class="form-group">
          <label class="form-label">URL Ảnh Logo thương hiệu</label>
          <input type="url" id="catItemLogo" class="form-control" value="${escapeHtml(brand ? brand.logo_url || '' : '')}" placeholder="https://..." />
        </div>
      `;
    }

    if (modalTitle) modalTitle.textContent = titleText;
    if (dynamicFields) dynamicFields.innerHTML = fieldsHtml;

    openModal("modalCatalogForm");
  }

  // 5. Lưu dữ liệu từ Modal Form
  function handleCatalogFormSubmit(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store || !currentEditingItem) return;

    try {
      const name = document.getElementById("catItemName").value.trim();
      const status = document.getElementById("catItemStatus").value;
      const slug = slugify(name);

      if (currentEditingItem.type === "sport") {
        store.saveSport({
          id: currentEditingItem.id,
          name,
          slug,
          description: document.getElementById("catItemDesc")?.value.trim() || null,
          status
        });
      } else if (currentEditingItem.type === "category") {
        const parentId = document.getElementById("catItemParent")?.value || null;
        store.saveCategory({
          id: currentEditingItem.id,
          name,
          slug,
          parent_id: parentId,
          status
        });
      } else if (currentEditingItem.type === "brand") {
        store.saveBrand({
          id: currentEditingItem.id,
          name,
          slug,
          logo_url: document.getElementById("catItemLogo")?.value.trim() || null,
          status
        });
      }

      closeModal("modalCatalogForm");
      renderActiveTab();
      showToast("Lưu thông tin thành công!", "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  // 6. Xử lý Xóa có xác nhận & Báo lỗi ràng buộc toàn vẹn
  function requestDelete(type, id) {
    const store = window.tsportStore;
    if (!store) return;

    itemToDelete = { type, id: Number(id) };
    const confirmText = document.getElementById("confirmDeleteText");
    const alertBox = document.getElementById("confirmIntegrityAlert");
    const confirmBtn = document.getElementById("btnConfirmDeleteAction");

    if (alertBox) alertBox.style.display = "none";
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
    }

    let itemName = "";
    let reasonError = null;

    if (type === "sport") {
      const s = store.getSportById(id);
      itemName = s ? s.name : `#${id}`;
      const prodCount = store.getProducts().filter((p) => p.sport_id === id).length;
      if (prodCount > 0) {
        reasonError = `Môn thể thao "${itemName}" đang có <strong>${prodCount} sản phẩm</strong> tham chiếu! Theo chuẩn SRS, hệ thống CHẶN XÓA để bảo vệ tính toàn vẹn dữ liệu. Hãy chuyển các sản phẩm này sang môn khác hoặc đổi trạng thái môn sang INACTIVE.`;
      }
    } else if (type === "category") {
      const c = store.getCategoryById(id);
      itemName = c ? c.name : `#${id}`;
      const children = store.getCategories().filter((sub) => sub.parent_id === id);
      const prodCount = store.getProducts().filter((p) => p.category_id === id).length;

      if (children.length > 0) {
        reasonError = `Danh mục "${itemName}" đang chứa <strong>${children.length} danh mục con</strong> (${children.map(ch => ch.name).join(', ')})! Bạn phải xóa hoặc chuyển các danh mục con trước khi xóa danh mục cha.`;
      } else if (prodCount > 0) {
        reasonError = `Danh mục "${itemName}" đang có <strong>${prodCount} sản phẩm</strong> trực thuộc! Theo quy tắc ràng buộc, bạn không thể xóa danh mục này khi còn sản phẩm.`;
      }
    } else if (type === "brand") {
      const b = store.getBrandById(id);
      itemName = b ? b.name : `#${id}`;
      const prodCount = store.getProducts().filter((p) => p.brand_id === id).length;
      if (prodCount > 0) {
        reasonError = `Thương hiệu "${itemName}" đang có <strong>${prodCount} sản phẩm</strong> trong kho! Hệ thống chặn xóa. Vui lòng chuyển sản phẩm hoặc đặt INACTIVE.`;
      }
    }

    if (confirmText) {
      confirmText.innerHTML = `Bạn có chắc chắn muốn xóa <strong>${escapeHtml(itemName)}</strong> không?`;
    }

    if (reasonError && alertBox) {
      alertBox.style.display = "flex";
      document.getElementById("integrityErrorDesc").innerHTML = reasonError;
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
      }
    }

    openModal("modalConfirmDelete");
  }

  function executeDelete() {
    const store = window.tsportStore;
    if (!store || !itemToDelete) return;

    try {
      if (itemToDelete.type === "sport") store.deleteSport(itemToDelete.id);
      else if (itemToDelete.type === "category") store.deleteCategory(itemToDelete.id);
      else if (itemToDelete.type === "brand") store.deleteBrand(itemToDelete.id);

      closeModal("modalConfirmDelete");
      renderActiveTab();
      showToast("Đã xóa mục thành công!", "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  function bindEvents() {
    // Chuyển Tab
    document.querySelectorAll(".tsport-catalog-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // Nút Thêm mới
    document.getElementById("btnAddNewCatalogItem")?.addEventListener("click", () => {
      openCatalogModal(activeTab === "sports" ? "sport" : activeTab === "categories" ? "category" : "brand");
    });

    // Submit Form Modal
    document.getElementById("formCatalogItem")?.addEventListener("submit", handleCatalogFormSubmit);

    // Xác nhận Xóa
    document.getElementById("btnConfirmDeleteAction")?.addEventListener("click", executeDelete);

    // Event Delegation trong các bảng
    document.addEventListener("click", (e) => {
      // Sửa / Xóa Môn
      const editSport = e.target.closest(".js-edit-sport");
      if (editSport) openCatalogModal("sport", editSport.dataset.id);
      const delSport = e.target.closest(".js-delete-sport");
      if (delSport) requestDelete("sport", delSport.dataset.id);

      // Sửa / Xóa Danh mục
      const editCat = e.target.closest(".js-edit-cat");
      if (editCat) openCatalogModal("category", editCat.dataset.id);
      const delCat = e.target.closest(".js-delete-cat");
      if (delCat) requestDelete("category", delCat.dataset.id);

      // Sửa / Xóa Thương hiệu
      const editBrand = e.target.closest(".js-edit-brand");
      if (editBrand) openCatalogModal("brand", editBrand.dataset.id);
      const delBrand = e.target.closest(".js-delete-brand");
      if (delBrand) requestDelete("brand", delBrand.dataset.id);
    });

    // NÚT TEST NHANH BÁO LỖI RÀNG BUỘC
    document.getElementById("btnTestDeleteHasProducts")?.addEventListener("click", () => {
      switchTab("categories");
      // Danh mục ID 2 là "Vợt cầu lông" đang có nhiều sản phẩm -> Chắc chắn báo lỗi đỏ
      requestDelete("category", 2);
    });

    document.getElementById("btnTestDeleteHasChildren")?.addEventListener("click", () => {
      switchTab("categories");
      // Danh mục ID 1 là "Vợt thể thao" đang chứa nhiều danh mục con -> Báo lỗi con
      requestDelete("category", 1);
    });

    document.getElementById("btnTestCreateEmptyCat")?.addEventListener("click", () => {
      const store = window.tsportStore;
      const testName = `Danh mục thử nghiệm ${Date.now().toString().slice(-4)}`;
      store.saveCategory({ name: testName, slug: slugify(testName), parent_id: null, status: "ACTIVE" });
      renderActiveTab();
      showToast(`Đã tạo "${testName}" (chưa có sản phẩm) để test xóa thành công!`, "success");
    });
  }

  document.addEventListener("DOMContentLoaded", initCategoriesModule);
})();
