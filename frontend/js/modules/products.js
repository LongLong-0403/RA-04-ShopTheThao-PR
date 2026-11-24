/**
 * TSPORT — MODULE QUẢN LÝ SẢN PHẨM & SKU (LIST + FULL-PAGE EDITOR FIGMA)
 * - View 1: Danh sách Sản phẩm & SKU (tìm kiếm, lọc tình trạng, bảng 6 cột, nút Sửa sản phẩm đang chọn)
 * - View 2: Form Thêm / Sửa sản phẩm toàn trang (Ảnh sản phẩm 4 ô + Bảng biến thể SKU & Tồn kho inline)
 */

(function () {
  let selectedProdId = null;
  let editingProdId = null;
  let draftImages = [];
  let photosChanged = false;
  let draftSkus = [];

  async function initAdminProducts() {
    await window.tsportCatalogReady;
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
      document.getElementById("prodCategoryFilter")?.append(
        ...Array.from(catEl.options, (option) => option.cloneNode(true))
      );
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
    const category = document.getElementById("prodCategoryFilter")?.value || "";

    const sports = store.getSports() || [];
    const cats = store.getCategories() || [];
    let products = store.getProducts({}) || [];

    if (cond !== "ALL") {
      products = products.filter((p) => p.condition_type === cond);
    }
    if (category) {
      const included = new Set([Number(category)]);
      for (let previousSize = 0; previousSize !== included.size;) {
        previousSize = included.size;
        cats.forEach((cat) => {
          if (included.has(Number(cat.parent_id))) included.add(Number(cat.id));
        });
      }
      products = products.filter((p) => included.has(Number(p.category_id)));
    }

    if (q) {
      products = products.filter((p) => {
        const nameMatch = String(p.name || "").toLowerCase().includes(q);
        const skuMatch = (p.skus || []).some((s) => String(s.sku_code || "").toLowerCase().includes(q));
        return nameMatch || skuMatch;
      });
    }

    if (!products.some((p) => Number(p.id) === Number(selectedProdId))) selectedProdId = products[0]?.id ?? null;
    const summary = document.getElementById("prodFilterSummary");
    if (summary) summary.textContent = `${products.length} sản phẩm`;
    const editSelected = document.getElementById("btnEditSelectedProduct");
    if (editSelected) editSelected.disabled = selectedProdId === null;

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
        const cover = (p.images || []).find((image) => image.is_primary) || p.images?.[0];

        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-prod-id="${p.id}">
            <td><div class="ts-adm-product-cell">
              ${cover ? `<img src="${escapeHtml(cover.image_url)}" alt="" loading="lazy">` : ""}
              <strong>${escapeHtml(p.name)}</strong>
            </div></td>
            <td style="color:#4B5563;">${escapeHtml(sportName)} / ${escapeHtml(catName)}</td>
            <td>${p.condition_type === "CU" ? "Cũ" : "Mới"}</td>
            <td>${totalStock}</td>
            <td>
              <span class="ts-orders-v2-status ${isOut ? "is-pending" : ""}">
                ${p.status === "INACTIVE" ? "Đang ẩn" : isOut ? "Hết hàng" : "Hiển thị"}
              </span>
            </td>
            <td>
              <button type="button" class="ts-orders-v2-detail-btn js-edit-prod" data-id="${p.id}">
                Sửa →
              </button>
              <button type="button" class="ts-orders-v2-detail-btn js-edit-prod" data-id="${p.id}" data-edit-photos>
                Chỉnh ảnh
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
  function productPhotoSources(product) {
    return [...(product?.images || [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((image) => image.image_url).filter(Boolean);
  }

  function showProductFormView(prodId, focusPhotos = false) {
    const store = window.tsportStore;
    if (!store) return;

    editingProdId = prodId ? Number(prodId) : null;
    photosChanged = false;
    const prod = editingProdId ? store.getProductById(editingProdId) : null;
    if (editingProdId && !prod) {
      showToast("Không tìm thấy sản phẩm.", "error");
      return;
    }
    const viewProduct = document.getElementById("viewStorefrontProduct");
    viewProduct.hidden = !prod || prod.status === "INACTIVE";
    if (prod) viewProduct.href = `product-detail.html?id=${encodeURIComponent(prod.id)}`;

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
      draftImages = productPhotoSources(prod);
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
    if (focusPhotos) {
      const heading = document.getElementById("adminProductPhotosTitle");
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function renderDraftPhotos() {
    const grid = document.getElementById("admProdPhotosGrid");
    if (!grid) return;

    grid.innerHTML = Array.from({ length: Math.max(4, Math.min(8, draftImages.length + 1)) }, (_, idx) => {
        const label = idx === 0 ? "Ảnh chính" : `Ảnh ${idx + 1}`;
        const src = draftImages[idx];
        return `
          <div class="ts-adm-image-editor" data-photo-slot="${idx}">
            <div class="ts-adm-prod-photo-slot">
              ${src ? `<img src="${escapeHtml(src)}" alt="${label}" />` : ""}
              <span class="ts-adm-prod-photo-tag">${label}</span>
            </div>
            <label class="ts-adm-filter-label">Đổi bằng tệp
              <input class="js-product-photo-file" type="file" accept="image/jpeg,image/png,image/webp">
            </label>
            <label class="ts-adm-filter-label">Hoặc dán URL
              <input class="ts-adm-select js-product-photo-url" type="text" inputmode="url" placeholder="https://…">
            </label>
            <button class="ts-adm-btn-secondary" type="button" data-photo-action="url">Dùng URL</button>
            ${src && idx ? '<button class="ts-adm-btn-secondary" type="button" data-photo-action="primary">Đặt làm ảnh chính</button>' : ""}
            ${src ? '<button class="ts-adm-btn-secondary" type="button" data-photo-action="remove">Bỏ ảnh</button>' : ""}
          </div>
        `;
      })
      .join("");
    const save = document.getElementById("btnSaveProductPhotos");
    save.hidden = !editingProdId;
    save.disabled = !photosChanged;
    document.getElementById("btnDiscardProductPhotos").hidden = !editingProdId || !photosChanged;
    document.getElementById("productPhotoStatus").textContent = photosChanged
      ? "Có thay đổi ảnh chưa lưu."
      : editingProdId ? "Ảnh chính hiển thị trong danh sách sản phẩm." : "";
  }

  function changePhoto(index, source) {
    if (index >= draftImages.length) draftImages.push(source);
    else draftImages[index] = source;
    photosChanged = true;
    renderDraftPhotos();
  }

  async function saveProductPhotos() {
    if (!draftImages.length) throw new Error("Sản phẩm cần ít nhất một ảnh.");
    const productId = editingProdId;
    const draft = draftImages;
    const images = await api.put(`/products/${productId}/images`, {
      images: draft.map(storefrontImageSource)
    });
    const product = window.tsportStore.getProductById(productId);
    product.images = images.map((image) => ({...image, image_url: storefrontImageUrl(image.image_url)}));
    window.tsportStore.save();
    if (draft === draftImages) {
      draftImages = product.images.map((image) => image.image_url);
      photosChanged = false;
      renderDraftPhotos();
    }
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
    document.getElementById("prodCategoryFilter")?.addEventListener("change", renderProductsTable);

    document.getElementById("btnAddProduct")?.addEventListener("click", () => showProductFormView(null));
    document.getElementById("btnEditSelectedProduct")?.addEventListener("click", () => {
      showProductFormView(selectedProdId || null);
    });
    document.getElementById("btnBackToProductsList")?.addEventListener("click", async () => {
      if (photosChanged && !(await confirmAction("Ảnh đã chỉnh chưa được lưu. Quay lại danh sách và bỏ các thay đổi ảnh?", "Bỏ thay đổi"))) return;
      showProductsListView();
    });

    document.getElementById("adminProductsTbody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".js-edit-prod");
      if (editBtn) {
        selectedProdId = Number(editBtn.dataset.id);
        showProductFormView(selectedProdId, editBtn.hasAttribute("data-edit-photos"));
        return;
      }
      const row = e.target.closest("tr[data-prod-id]");
      if (row) {
        selectedProdId = Number(row.dataset.prodId);
        renderProductsTable();
      }
    });

    // Tải ảnh sản phẩm
    const photos = document.getElementById("admProdPhotosGrid");
    photos?.addEventListener("change", async (event) => {
      if (!event.target.matches(".js-product-photo-file") || !event.target.files.length) return;
      const slot = Number(event.target.closest("[data-photo-slot]").dataset.photoSlot);
      const draft = draftImages;
      try {
        const source = await readStorefrontImage(event.target.files[0]);
        if (draft === draftImages && event.target.isConnected) changePhoto(slot, source);
      } catch (error) { showToast(error.message, "error"); }
    });
    photos?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-photo-action]");
      if (!button) return;
      const editor = button.closest("[data-photo-slot]");
      const slot = Number(editor.dataset.photoSlot);
      if (button.dataset.photoAction === "url") {
        const source = editor.querySelector(".js-product-photo-url").value.trim();
        if (!/^https?:\/\//i.test(source)) {
          showToast("Nhập URL ảnh bắt đầu bằng https:// hoặc http://.", "error");
          return;
        }
        changePhoto(slot, source);
        return;
      }
      const [source] = draftImages.splice(slot, 1);
      if (button.dataset.photoAction === "primary") draftImages.unshift(source);
      photosChanged = true;
      renderDraftPhotos();
    });
    document.getElementById("btnSaveProductPhotos")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      photos.inert = true;
      try {
        await saveProductPhotos();
        showToast("Đã cập nhật ảnh sản phẩm.", "success");
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        photos.inert = false;
        button.disabled = !photosChanged;
      }
    });
    document.getElementById("btnDiscardProductPhotos")?.addEventListener("click", () => {
      const product = window.tsportStore.getProductById(editingProdId);
      draftImages = productPhotoSources(product);
      photosChanged = false;
      renderDraftPhotos();
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
      if (editingProdId && photosChanged) {
        showToast("Bấm “Lưu ảnh sản phẩm” để lưu ảnh trước.", "error");
        return;
      }
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminProducts));
})();
