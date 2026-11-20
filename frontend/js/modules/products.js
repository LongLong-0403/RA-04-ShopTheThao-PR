/**
 * TSPORT — MODULE QUẢN LÝ SẢN PHẨM & SKU (ADMIN PRODUCTS V2 FIGMA)
 * - Tìm kiếm theo tên sản phẩm hoặc mã SKU, lọc theo Tình trạng (Tất cả / Mới / Cũ)
 * - Bảng 6 cột: Sản phẩm, Môn / Danh mục, Tình trạng, Tồn SKU, Trạng thái, Thao tác (Sửa →)
 * - Modal Thêm / Sửa sản phẩm & SKU (bắt buộc mô tả hao mòn khi chọn Đồ cũ)
 */

(function () {
  let selectedProdId = null;
  let editingProdId = null;

  function initAdminProducts() {
    initTopbarControls();
    populateSelectOptions();
    renderProductsTable();
    bindEvents();
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

    if (sportEl) {
      sportEl.innerHTML = (store.getSports() || [])
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join("");
    }
    if (catEl) {
      catEl.innerHTML = (store.getCategories() || [])
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
        .join("");
    }
    if (brandEl) {
      brandEl.innerHTML = (store.getBrands() || [])
        .map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`)
        .join("");
    }
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
        const skuMatch = (p.skus || []).some((s) =>
          String(s.sku_code || "").toLowerCase().includes(q)
        );
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

  function openProductModal(prodId) {
    const store = window.tsportStore;
    if (!store) return;

    editingProdId = prodId ? Number(prodId) : null;
    const prod = editingProdId ? store.getProductById(editingProdId) : null;

    const titleEl = document.getElementById("modalProdTitle");
    const nameEl = document.getElementById("admProdName");
    const sportEl = document.getElementById("admProdSport");
    const catEl = document.getElementById("admProdCategory");
    const brandEl = document.getElementById("admProdBrand");
    const condEl = document.getElementById("admProdCondition");
    const wearWrap = document.getElementById("admProdWearWrap");
    const wearEl = document.getElementById("admProdWearDesc");
    const sizeEl = document.getElementById("admSkuSize");
    const colorEl = document.getElementById("admSkuColor");
    const priceEl = document.getElementById("admSkuPrice");
    const stockEl = document.getElementById("admSkuStock");

    if (prod) {
      const firstSku = (prod.skus && prod.skus[0]) || {};
      if (titleEl) titleEl.textContent = `Sửa sản phẩm: ${prod.name}`;
      if (nameEl) nameEl.value = prod.name || "";
      if (sportEl) sportEl.value = String(prod.sport_id || 1);
      if (catEl) catEl.value = String(prod.category_id || 2);
      if (brandEl) brandEl.value = String(prod.brand_id || 1);
      if (condEl) condEl.value = prod.condition_type || "MOI";
      if (wearEl) wearEl.value = prod.wear_description || prod.condition_note || "";
      if (wearWrap) wearWrap.style.display = prod.condition_type === "CU" ? "block" : "none";
      if (sizeEl) sizeEl.value = firstSku.size || "4U";
      if (colorEl) colorEl.value = firstSku.color || "Đen / Đỏ";
      if (priceEl) priceEl.value = Number(firstSku.price) || 1500000;
      if (stockEl) stockEl.value = Number(firstSku.stock) || 0;
    } else {
      if (titleEl) titleEl.textContent = "Thêm sản phẩm & SKU mới";
      document.getElementById("formAdminProduct")?.reset();
      if (wearWrap) wearWrap.style.display = "none";
      if (sizeEl) sizeEl.value = "4U";
      if (colorEl) colorEl.value = "Đen / Đỏ";
      if (priceEl) priceEl.value = 1500000;
      if (stockEl) stockEl.value = 10;
    }

    openModal("modalAdminProduct");
  }

  function bindEvents() {
    document.getElementById("prodSearchInput")?.addEventListener("input", renderProductsTable);
    document.getElementById("prodConditionFilter")?.addEventListener("change", renderProductsTable);

    document.getElementById("btnAddProduct")?.addEventListener("click", () => openProductModal(null));
    document.getElementById("btnEditSelectedProduct")?.addEventListener("click", () => {
      if (selectedProdId) openProductModal(selectedProdId);
      else openProductModal(null);
    });

    document.getElementById("admProdCondition")?.addEventListener("change", (e) => {
      const wearWrap = document.getElementById("admProdWearWrap");
      if (wearWrap) wearWrap.style.display = e.target.value === "CU" ? "block" : "none";
    });

    document.getElementById("adminProductsTbody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".js-edit-prod");
      if (editBtn) {
        selectedProdId = Number(editBtn.dataset.id);
        renderProductsTable();
        openProductModal(selectedProdId);
        return;
      }

      const row = e.target.closest("tr[data-prod-id]");
      if (row) {
        selectedProdId = Number(row.dataset.prodId);
        renderProductsTable();
      }
    });

    document.getElementById("formAdminProduct")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const name = document.getElementById("admProdName")?.value.trim();
      const sport_id = Number(document.getElementById("admProdSport")?.value) || 1;
      const category_id = Number(document.getElementById("admProdCategory")?.value) || 2;
      const brand_id = Number(document.getElementById("admProdBrand")?.value) || 1;
      const condition_type = document.getElementById("admProdCondition")?.value || "MOI";
      const wear_description = document.getElementById("admProdWearDesc")?.value.trim() || "";
      const size = document.getElementById("admSkuSize")?.value.trim() || "Tiêu chuẩn";
      const color = document.getElementById("admSkuColor")?.value.trim() || "Mặc định";
      const price = Number(document.getElementById("admSkuPrice")?.value) || 0;
      const stock = Number(document.getElementById("admSkuStock")?.value) || 0;

      if (!name) {
        showToast("Vui lòng nhập tên sản phẩm.", "error");
        return;
      }
      if (condition_type === "CU" && !wear_description) {
        showToast("Sản phẩm cũ bắt buộc phải có mô tả hao mòn!", "error");
        return;
      }

      const arr = store.data.products || [];
      const existing = editingProdId ? arr.find((p) => Number(p.id) === Number(editingProdId)) : null;

      if (existing) {
        existing.name = name;
        existing.sport_id = sport_id;
        existing.category_id = category_id;
        existing.brand_id = brand_id;
        existing.condition_type = condition_type;
        existing.wear_description = wear_description;
        if (existing.skus && existing.skus.length) {
          existing.skus[0].size = size;
          existing.skus[0].color = color;
          existing.skus[0].price = price;
          existing.skus[0].stock = stock;
        }
        store.save();
        showToast(`Đã cập nhật "${name}" thành công!`, "success");
      } else {
        const newId = arr.length ? Math.max(...arr.map((p) => Number(p.id) || 0)) + 1 : 1;
        const newSkuId = Date.now() % 100000;
        arr.unshift({
          id: newId,
          sport_id,
          category_id,
          brand_id,
          name,
          description: "Sản phẩm thể thao chính hãng tại Tsport.",
          condition_type,
          wear_description,
          status: "ACTIVE",
          specifications: { weight: size, material: "Graphite" },
          images: [
            {
              id: newSkuId,
              image_url: "/frontend/assets/products/victor-auraspeed-90k-ii.png",
              is_primary: true,
              sort_order: 1
            }
          ],
          skus: [
            {
              id: newSkuId,
              sku_code: `TS-${newId}-${size.toUpperCase()}`,
              size,
              color,
              price,
              stock,
              unit: "CHIEC",
              quantity_per_lot: 1
            }
          ]
        });
        selectedProdId = newId;
        store.save();
        showToast(`Đã thêm mới "${name}" thành công!`, "success");
      }

      closeModal("modalAdminProduct");
      renderProductsTable();
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
