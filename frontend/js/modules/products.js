/**
 * TSPORT — MODULE QUẢN LÝ SẢN PHẨM & SKU (LIST + FULL-PAGE EDITOR FIGMA)
 * - View 1: Danh sách Sản phẩm & SKU (tìm kiếm, lọc tình trạng, bảng 6 cột, nút Sửa sản phẩm đang chọn)
 * - View 2: Form Thêm / Sửa sản phẩm toàn trang (Ảnh sản phẩm 4 ô + Bảng biến thể SKU & Tồn kho inline)
 */

(function () {
  let selectedProdId = null;
  let editingProdId = null;
  let draftImages = [];
  let draftSkus = [];

  function initAdminProducts() {
    initTopbarControls();
    populateSelectOptions();
    renderProductsTable();
    bindEvents();

    const params = typeof getUrlParams === "function" ? getUrlParams() : {};
    if (params.create === "1") {
      showProductFormView(null);
    } else if (params.edit) {
      showProductFormView(Number(params.edit));
    }
  }

  function initTopbarControls() {
    const userBtn = document.getElementById("btnAdminUserMenu");
    const dropdown = document.getElementById("adminUserDropdown");
    userBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("is-open");
    });
    document.addEventListener("click", () => dropdown?.classList.remove("is-open"));
    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
    document.getElementById("btnToggleAdminSidebar")?.addEventListener("click", () => {
      document.getElementById("adminSidebar")?.classList.toggle("is-open");
    });
  }

  function populateSelectOptions() {
    const store = window.tsportStore;
    if (!store) return;

    const sportEl = document.getElementById("admProdSport");
    const catEl = document.getElementById("admProdCategory");
    const brandEl = document.getElementById("admProdBrand");

    const sports = store.getSports() || [];
    const cats = store.getCategories() || [];
    const brands = store.getBrands() || [];

    if (sportEl) {
      sportEl.innerHTML = sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
    if (catEl) {
      catEl.innerHTML = cats
        .map((c) => {
          const parent = c.parent_id ? cats.find((p) => Number(p.id) === Number(c.parent_id)) : null;
          const label = parent ? `${parent.name} > ${c.name}` : c.name;
          return `<option value="${c.id}">${escapeHtml(label)}</option>`;
        })
        .join("");
    }
    if (brandEl) {
      brandEl.innerHTML = brands.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");
    }
  }

  // ==========================================
  // VIEW 1: DANH SÁCH SẢN PHẨM & SKU
  // ==========================================
  function showProductsListView() {
    const listView = document.getElementById("adminProductsListView");
    const formView = document.getElementById("adminProductFormView");
    const bc = document.getElementById("prodTopBreadcrumb");
    if (listView) listView.style.display = "block";
    if (formView) formView.style.display = "none";
    if (bc) bc.textContent = "Sản phẩm & SKU";
    document.title = "Sản phẩm & SKU | Tsport Admin";
    renderProductsTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProductsTable() {
    const tbody = document.getElementById("adminProductsTbody");
    const store = window.tsportStore;
    if (!tbody || !store) return;

    const q = (document.getElementById("prodSearchInput")?.value || "").trim().toLowerCase();
    const cond = document.getElementById("prodConditionFilter")?.value || "ALL";

    const sports = store.getSports() || [];
    const cats = store.getCategories() || [];
    let products = store.getProducts({}) || [];

    if (cond !== "ALL") {
      products = products.filter((p) => p.condition_type === cond);
    }

    if (q) {
      products = products.filter((p) => {
        const nameMatch = String(p.name || "").toLowerCase().includes(q);
        const skuMatch = (p.skus || []).some((s) => String(s.sku_code || "").toLowerCase().includes(q));
        return nameMatch || skuMatch;
      });
    }

    if (selectedProdId == null && products.length) {
      selectedProdId = products[0].id;
    }

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:36px 16px; color:#6B7280;">
            Không tìm thấy sản phẩm phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products
      .map((p) => {
        const sportName = sports.find((s) => Number(s.id) === Number(p.sport_id))?.name || "Thể thao";
        const catName = cats.find((c) => Number(c.id) === Number(p.category_id))?.name || "Sản phẩm";
        const totalStock = (p.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
        const isOut = totalStock <= 0;
        const isSelected = Number(p.id) === Number(selectedProdId);

        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-prod-id="${p.id}">
            <td style="font-weight:600;">${escapeHtml(p.name)}</td>
            <td style="color:#4B5563;">${escapeHtml(sportName)} / ${escapeHtml(catName)}</td>
            <td>${p.condition_type === "CU" ? "Cũ" : "Mới"}</td>
            <td>${totalStock}</td>
            <td>
              <span class="ts-orders-v2-status ${isOut ? "is-pending" : ""}">
                ${isOut ? "Hết hàng" : "Hiển thị"}
              </span>
            </td>
            <td>
              <button type="button" class="ts-orders-v2-detail-btn js-edit-prod" data-id="${p.id}">
                Sửa →
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // ==========================================
  // VIEW 2: THÊM / SỬA SẢN PHẨM TOÀN TRANG
  // ==========================================
  function showProductFormView(prodId) {
    const store = window.tsportStore;
    if (!store) return;

    editingProdId = prodId ? Number(prodId) : null;
    const prod = editingProdId ? store.getProductById(editingProdId) : null;

    const listView = document.getElementById("adminProductsListView");
    const formView = document.getElementById("adminProductFormView");
    const bc = document.getElementById("prodTopBreadcrumb");
    if (listView) listView.style.display = "none";
    if (formView) formView.style.display = "block";
    if (bc) bc.textContent = "Thêm / Sửa sản phẩm";
    document.title = "Thêm / Sửa sản phẩm | Tsport Admin";

    const nameEl = document.getElementById("admProdName");
    const sportEl = document.getElementById("admProdSport");
    const catEl = document.getElementById("admProdCategory");
    const brandEl = document.getElementById("admProdBrand");
    const condEl = document.getElementById("admProdCondition");
    const statusEl = document.getElementById("admProdStatus");
    const wearEl = document.getElementById("admProdWearDesc");
    const descEl = document.getElementById("admProdDesc");
    const specsEl = document.getElementById("admProdSpecs");

    if (prod) {
      if (nameEl) nameEl.value = prod.name || "";
      if (sportEl) sportEl.value = String(prod.sport_id || 1);
      if (catEl) catEl.value = String(prod.category_id || 2);
      if (brandEl) brandEl.value = String(prod.brand_id || 1);
      if (condEl) condEl.value = prod.condition_type || "MOI";
      if (statusEl) statusEl.value = prod.status || "ACTIVE";
      if (wearEl) wearEl.value = prod.wear_description || prod.condition_note || "";
      if (descEl) descEl.value = prod.description || "";
      if (specsEl) {
        const sp = prod.specifications || {};
        specsEl.value = Object.entries(sp)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ");
      }
      draftImages = (prod.images || []).map((i) => i.image_url).filter(Boolean);
      draftSkus = (prod.skus || []).map((s) => ({
        id: s.id,
        sku_code: s.sku_code || "",
        size: s.size || "4U",
        color: s.color || "Đen",
        price: Number(s.price) || 0,
        stock: Number(s.stock) || 0,
        unit: s.unit || "CHIEC",
        quantity_per_lot: Number(s.quantity_per_lot) || 1
      }));
    } else {
      document.getElementById("formAdminProduct")?.reset();
      if (condEl) condEl.value = "MOI";
      if (statusEl) statusEl.value = "ACTIVE";
      draftImages = [];
      draftSkus = [
        {
          id: Date.now() % 100000,
          sku_code: "TS-NEW-4U-BK",
          size: "4U",
          color: "Đen",
          price: 1250000,
          stock: 1,
          unit: "CHIEC",
          quantity_per_lot: 1
        }
      ];
    }

    renderDraftPhotos();
    renderDraftSkus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDraftPhotos() {
    const grid = document.getElementById("admProdPhotosGrid");
    if (!grid) return;

    const labels = ["ẢNH CHÍNH", "ẢNH 2", "ẢNH 3", "ẢNH 4"];
    const fallback = "/frontend/assets/products/victor-auraspeed-90k-ii.png";
    grid.innerHTML = labels
      .map((label, idx) => {
        const src = draftImages[idx];
        return `
          <div class="ts-adm-prod-photo-slot">
            ${src ? `<img src="${escapeHtml(src)}" alt="${label}" onerror="this.src='${fallback}'" />` : ""}
            <span class="ts-adm-prod-photo-tag">${label}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderDraftSkus() {
    const tbody = document.getElementById("admSkuTableBody");
    if (!tbody) return;

    tbody.innerHTML = draftSkus
      .map(
        (s, idx) => `
        <tr data-sku-idx="${idx}">
          <td><input type="text" class="ts-adm-sku-input js-sku-field" data-field="sku_code" value="${escapeHtml(s.sku_code)}" /></td>
          <td><input type="text" class="ts-adm-sku-input js-sku-field" data-field="size" value="${escapeHtml(s.size)}" style="max-width:72px;" /></td>
          <td><input type="text" class="ts-adm-sku-input js-sku-field" data-field="color" value="${escapeHtml(s.color)}" style="max-width:96px;" /></td>
          <td><input type="number" class="ts-adm-sku-input js-sku-field" data-field="price" value="${Number(s.price) || 0}" min="0" step="10000" style="max-width:116px;" /></td>
          <td><input type="number" class="ts-adm-sku-input js-sku-field" data-field="stock" value="${Number(s.stock) || 0}" min="0" style="max-width:68px;" /></td>
          <td>
            <select class="ts-adm-sku-input js-sku-field" data-field="unit" style="max-width:88px;">
              <option value="CHIEC" ${s.unit === "CHIEC" ? "selected" : ""}>CHIEC</option>
              <option value="LO" ${s.unit === "LO" ? "selected" : ""}>LO</option>
            </select>
          </td>
          <td><input type="number" class="ts-adm-sku-input js-sku-field" data-field="quantity_per_lot" value="${Number(s.quantity_per_lot) || 1}" min="1" style="max-width:64px;" /></td>
          <td><button type="button" class="ts-adm-sku-del js-del-sku-row" data-idx="${idx}" title="Xóa biến thể">✕</button></td>
        </tr>
      `
      )
      .join("");
  }

  function syncSkusFromDom() {
    const rows = document.querySelectorAll("#admSkuTableBody tr[data-sku-idx]");
    rows.forEach((row) => {
      const idx = Number(row.dataset.skuIdx);
      if (!draftSkus[idx]) return;
      row.querySelectorAll(".js-sku-field").forEach((el) => {
        const field = el.dataset.field;
        if (field === "price" || field === "stock" || field === "quantity_per_lot") {
          draftSkus[idx][field] = Number(el.value) || 0;
        } else {
          draftSkus[idx][field] = el.value.trim();
        }
      });
    });
  }

  function parseSpecsText(raw) {
    const obj = {};
    String(raw || "")
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx > 0) {
          obj[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
        }
      });
    return obj;
  }

  function bindEvents() {
    document.getElementById("prodSearchInput")?.addEventListener("input", renderProductsTable);
    document.getElementById("prodConditionFilter")?.addEventListener("change", renderProductsTable);

    document.getElementById("btnAddProduct")?.addEventListener("click", () => showProductFormView(null));
    document.getElementById("btnEditSelectedProduct")?.addEventListener("click", () => {
      showProductFormView(selectedProdId || null);
    });
    document.getElementById("btnBackToProductsList")?.addEventListener("click", showProductsListView);

    document.getElementById("adminProductsTbody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".js-edit-prod");
      if (editBtn) {
        selectedProdId = Number(editBtn.dataset.id);
        showProductFormView(selectedProdId);
        return;
      }
      const row = e.target.closest("tr[data-prod-id]");
      if (row) {
        selectedProdId = Number(row.dataset.prodId);
        renderProductsTable();
      }
    });

    // Tải ảnh sản phẩm
    document.getElementById("admProdPhotoInput")?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []).slice(0, 4);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            if (draftImages.length >= 4) draftImages.shift();
            draftImages.push(ev.target.result);
            renderDraftPhotos();
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Thêm / Xóa dòng biến thể SKU
    document.getElementById("btnAddSkuRow")?.addEventListener("click", () => {
      syncSkusFromDom();
      draftSkus.push({
        id: (Date.now() + draftSkus.length) % 100000,
        sku_code: `SKU-${draftSkus.length + 1}`,
        size: "3U",
        color: "Đỏ",
        price: 1300000,
        stock: 5,
        unit: "CHIEC",
        quantity_per_lot: 1
      });
      renderDraftSkus();
    });

    document.getElementById("admSkuTableBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".js-del-sku-row");
      if (!del) return;
      syncSkusFromDom();
      if (draftSkus.length <= 1) {
        showToast("Sản phẩm cần có ít nhất 1 biến thể SKU.", "error");
        return;
      }
      draftSkus.splice(Number(del.dataset.idx), 1);
      renderDraftSkus();
    });

    // Lưu sản phẩm
    document.getElementById("formAdminProduct")?.addEventListener("submit", (e) => {
      e.preventDefault();
      syncSkusFromDom();
      const store = window.tsportStore;
      if (!store) return;

      const name = document.getElementById("admProdName")?.value.trim();
      const sport_id = Number(document.getElementById("admProdSport")?.value) || 1;
      const category_id = Number(document.getElementById("admProdCategory")?.value) || 2;
      const brand_id = Number(document.getElementById("admProdBrand")?.value) || 1;
      const condition_type = document.getElementById("admProdCondition")?.value || "MOI";
      const status = document.getElementById("admProdStatus")?.value || "ACTIVE";
      const wear_description = document.getElementById("admProdWearDesc")?.value.trim() || "";
      const description = document.getElementById("admProdDesc")?.value.trim() || "";
      const specifications = parseSpecsText(document.getElementById("admProdSpecs")?.value);

      if (!name) {
        showToast("Vui lòng nhập tên sản phẩm.", "error");
        return;
      }
      if (condition_type === "CU" && !wear_description) {
        showToast("Hàng đã qua sử dụng bắt buộc phải có mô tả hao mòn!", "error");
        document.getElementById("admProdWearDesc")?.focus();
        return;
      }

      const imgs = (draftImages.length ? draftImages : ["/frontend/assets/products/victor-auraspeed-90k-ii.png"]).map(
        (url, idx) => ({
          id: idx + 1,
          image_url: url,
          is_primary: idx === 0,
          sort_order: idx + 1
        })
      );

      const arr = store.data.products || [];
      const existing = editingProdId ? arr.find((p) => Number(p.id) === Number(editingProdId)) : null;

      if (existing) {
        existing.name = name;
        existing.sport_id = sport_id;
        existing.category_id = category_id;
        existing.brand_id = brand_id;
        existing.condition_type = condition_type;
        existing.status = status;
        existing.wear_description = wear_description;
        existing.description = description;
        existing.specifications = specifications;
        existing.images = imgs;
        existing.skus = [...draftSkus];
        store.save();
        showToast(`Đã lưu cập nhật sản phẩm "${name}"!`, "success");
      } else {
        const newId = arr.length ? Math.max(...arr.map((p) => Number(p.id) || 0)) + 1 : 1;
        arr.unshift({
          id: newId,
          sport_id,
          category_id,
          brand_id,
          name,
          description,
          condition_type,
          wear_description,
          status,
          specifications,
          images: imgs,
          skus: [...draftSkus]
        });
        selectedProdId = newId;
        store.save();
        showToast(`Đã thêm mới sản phẩm "${name}"!`, "success");
      }

      showProductsListView();
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  document.addEventListener("DOMContentLoaded", initAdminProducts);
})();
