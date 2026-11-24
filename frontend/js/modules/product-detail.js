/**
 * TSPORT — MODULE CHI TIẾT SẢN PHẨM TỐI GIẢN
 * - Hiển thị ảnh sản phẩm thật sắc nét + bộ sưu tập thumbnail
 * - Chọn biến thể Màu sắc & Trọng lượng/Size -> cập nhật giá, tồn kho, nút Thêm vào giỏ & Mua ngay
 * - Hiển thị phân biệt sản phẩm Mới (THÔNG TIN BIẾN THỂ) và Đã qua sử dụng (TÌNH TRẠNG THỰC TẾ)
 */

(function () {
  let currentProduct = null;
  let selectedSize = null;
  let selectedColor = null;
  let matchingSku = null;
  let currentQuantity = 1;

  function initProductDetailModule() {
    const params = getUrlParams();
    const prodId = Number(params.id) || 1;
    initPdpHeaderSearch();
    loadProduct(prodId);
  }

  function initPdpHeaderSearch() {
    const form = document.getElementById("pdpSearchForm");
    const input = document.getElementById("pdpSearchInput");
    if (!form || !input) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function loadProduct(id) {
    const store = window.tsportStore;
    if (!store) return;

    currentProduct = store.getProductById(id);
    if (!currentProduct) {
      window.location.href = "shop.html";
      return;
    }

    renderProductInfo(currentProduct);
    renderGallery(currentProduct);
    renderSkuVariants(currentProduct);
    renderSpecifications(currentProduct);
    renderSideInfoCard(currentProduct);
    trackRecentView(currentProduct.id);
    bindEvents();
  }

  function trackRecentView(productId) {
    try {
      let recent = window.tsportStore.data.recentViews;
      if (!Array.isArray(recent)) recent = [];
      recent = recent.filter((id) => id !== productId);
      recent.unshift(productId);
      if (recent.length > 8) recent = recent.slice(0, 8);
      window.tsportStore.data.recentViews = recent;
      window.tsportStore.save();
    } catch (_) {}
  }

  // 1. THÔNG TIN CƠ BẢN, BREADCRUMB & TRẠNG THÁI NAVBAR
  function renderProductInfo(prod) {
    const store = window.tsportStore;
    const isUsed = prod.condition_type === "CU";

    document.title = `${prod.name} | Tsport`;

    const sportObj = store.getSports().find((s) => Number(s.id) === Number(prod.sport_id));
    const catObj = store.getCategories().find((c) => Number(c.id) === Number(prod.category_id));
    const brandObj = store.getBrands().find((b) => Number(b.id) === Number(prod.brand_id));

    const sportName = sportObj ? sportObj.name : "Thể thao";
    const catName = catObj ? catObj.name : "Sản phẩm";
    const brandName = brandObj ? brandObj.name : "Tsport";

    // Highlight nav link theo Mới / Đồ cũ
    const navShop = document.getElementById("pdpNavShopLink");
    const navUsed = document.getElementById("pdpNavUsedLink");
    if (navShop && navUsed) {
      navShop.classList.toggle("is-active", !isUsed);
      navUsed.classList.toggle("is-active", isUsed);
    }

    // Breadcrumb
    const bcSport = document.getElementById("pdpBreadcrumbSport");
    const bcCat = document.getElementById("pdpBreadcrumbCat");
    const bcName = document.getElementById("pdpBreadcrumbName");
    if (bcSport) {
      bcSport.textContent = sportName;
      bcSport.href = sportObj ? `shop.html?sport=${sportObj.id}` : "shop.html";
    }
    if (bcCat) {
      bcCat.textContent = catName;
      bcCat.href = catObj ? `shop.html?cat=${catObj.id}` : "shop.html";
    }
    if (bcName) bcName.textContent = prod.name;

    // Condition pill
    const badgeWrap = document.getElementById("pdpConditionBadgeWrap");
    if (badgeWrap) {
      badgeWrap.innerHTML = `<span class="ts-pdp-cond-pill ${isUsed ? "is-used" : ""}">${isUsed ? "Đã qua sử dụng" : "Mới"}</span>`;
    }

    // Title, meta, description
    const titleEl = document.getElementById("pdpTitle");
    if (titleEl) titleEl.textContent = prod.name;

    const metaEl = document.getElementById("pdpMetaPath");
    if (metaEl) metaEl.textContent = `${brandName} / ${sportName} / ${catName}`;

    const descEl = document.getElementById("pdpDesc");
    if (descEl) {
      descEl.textContent =
        prod.description ||
        "Sản phẩm thể thao chính hãng tại Tsport; vui lòng chọn đúng màu sắc và trọng lượng/kích cỡ trước khi thêm vào giỏ.";
    }
  }

  // 2. GALLERY ẢNH SẢN PHẨM
  function renderGallery(prod) {
    const mainImg = document.getElementById("pdpMainImage");
    const thumbsWrap = document.getElementById("pdpThumbsWrap");
    const captionEl = document.getElementById("pdpImageCaption");
    const isUsed = prod.condition_type === "CU";

    const fallbackImg = "/frontend/assets/products/catalog/p001.webp";
    const images = prod.images && prod.images.length ? prod.images : [{ image_url: fallbackImg, is_primary: true }];
    const primary = images.find((i) => i.is_primary) || images[0];

    if (mainImg) {
      mainImg.src = primary.image_url;
      mainImg.alt = prod.name;
      mainImg.classList.remove("is-hidden");
      mainImg.onerror = () => {
        mainImg.src = fallbackImg;
      };
    }

    if (captionEl) {
      captionEl.textContent = `${isUsed ? "ẢNH THỰC TẾ" : "ẢNH SẢN PHẨM"} / 01`;
      captionEl.classList.remove("is-hidden");
    }

    if (thumbsWrap) {
      const thumbItems = images.slice(0, 4).map((img, idx) => {
        const num = String(idx + 1).padStart(2, "0");
        return `
          <button type="button" class="ts-pdp-thumb ${idx === 0 ? "is-active" : ""}" data-img-url="${escapeHtml(img.image_url)}" data-img-index="${num}" aria-label="Xem ảnh ${idx + 1}">
            <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(prod.name)} - Ảnh ${idx + 1}" onerror="this.src='${fallbackImg}'" />
            <span class="ts-pdp-thumb-label">Ảnh ${idx + 1}</span>
          </button>
        `;
      });

      thumbsWrap.innerHTML = thumbItems.join("");
    }
  }

  function showGalleryImage(imgUrl, imgIndexStr) {
    const mainImg = document.getElementById("pdpMainImage");
    const captionEl = document.getElementById("pdpImageCaption");
    const isUsed = currentProduct && currentProduct.condition_type === "CU";
    if (imgUrl && mainImg) mainImg.src = imgUrl;
    if (captionEl) {
      captionEl.textContent = `${isUsed ? "ẢNH THỰC TẾ" : "ẢNH SẢN PHẨM"} / ${imgIndexStr || "01"}`;
    }
  }

  // 3. BIẾN THỂ MÀU SẮC & TRỌNG LƯỢNG / SIZE
  function renderSkuVariants(prod) {
    const skus = prod.skus || [];
    const colorWrap = document.getElementById("pdpColorOptions");
    const sizeWrap = document.getElementById("pdpSizeOptions");

    const colors = [...new Set(skus.map((s) => s.color).filter(Boolean))];
    const sizes = [...new Set(skus.map((s) => s.size).filter(Boolean))];

    if (colorWrap) {
      if (colors.length) {
        colorWrap.innerHTML = colors
          .map(
            (color, idx) => `
          <button type="button" class="ts-pdp-var-btn js-color-pill ${idx === 0 ? "is-active" : ""}" data-color="${escapeHtml(color)}">
            ${escapeHtml(color)}
          </button>
        `
          )
          .join("");
        selectedColor = colors[0];
      } else {
        document.getElementById("pdpColorSection").style.display = "none";
      }
    }

    if (sizeWrap) {
      if (sizes.length) {
        sizeWrap.innerHTML = sizes
          .map((size) => {
            const anyInStock = skus.some((s) => s.size === size && Number(s.stock) > 0);
            return `
              <button
                type="button"
                class="ts-pdp-var-btn js-size-pill ${!anyInStock ? "is-out" : ""}"
                data-size="${escapeHtml(size)}"
                ${!anyInStock ? "disabled" : ""}
              >
                ${escapeHtml(size)}${!anyInStock ? " • hết" : ""}
              </button>
            `;
          })
          .join("");

        // Chọn sẵn size đầu tiên còn hàng
        const firstAvailable = sizes.find((sz) => skus.some((s) => s.size === sz && Number(s.stock) > 0)) || sizes[0];
        selectedSize = firstAvailable;
        const activeBtn = sizeWrap.querySelector(`.js-size-pill[data-size="${CSS.escape(firstAvailable)}"]`);
        if (activeBtn) activeBtn.classList.add("is-active");
      } else {
        document.getElementById("pdpSizeSection").style.display = "none";
      }
    }

    updateSkuDisplay();
  }

  function updateSkuDisplay() {
    if (!currentProduct) return;
    const skus = currentProduct.skus || [];

    matchingSku =
      skus.find((s) => (!selectedSize || s.size === selectedSize) && (!selectedColor || s.color === selectedColor)) ||
      skus.find((s) => !selectedColor || s.color === selectedColor) ||
      skus[0] ||
      null;

    const priceEl = document.getElementById("pdpPrice");
    const oldPriceEl = document.getElementById("pdpOldPrice");
    const stockEl = document.getElementById("pdpStockStatus");
    const hintEl = document.getElementById("pdpVariantHint");
    const addBtn = document.getElementById("btnAddToCart");
    const buyBtn = document.getElementById("btnBuyNow");
    const qtyInput = document.getElementById("pdpQuantity");

    if (!matchingSku) {
      if (priceEl) priceEl.textContent = "Liên hệ";
      if (addBtn) addBtn.disabled = true;
      if (buyBtn) buyBtn.disabled = true;
      return;
    }

    const origPrice = Number(matchingSku.price) || 0;
    const salePrice = Number(matchingSku.sale_price) || 0;
    const hasSale = salePrice > 0 && salePrice < origPrice;
    const effPrice = hasSale ? salePrice : origPrice;

    if (priceEl) priceEl.textContent = formatMoney(effPrice);
    if (oldPriceEl) {
      if (hasSale) {
        oldPriceEl.textContent = formatMoney(origPrice);
        oldPriceEl.style.display = "inline";
      } else {
        oldPriceEl.style.display = "none";
      }
    }

    const unitLabel = currentProduct.unit || (matchingSku.pack_qty ? `Ống (${matchingSku.pack_qty} quả)` : "Chiếc");
    const stock = Number(matchingSku.stock) || 0;
    if (stockEl) {
      stockEl.textContent = `Đơn vị: ${unitLabel} • Tồn kho biến thể: ${stock}`;
    }

    if (stock > 0) {
      if (addBtn) addBtn.disabled = false;
      if (buyBtn) buyBtn.disabled = false;
      if (hintEl) hintEl.style.display = "none";
      if (qtyInput && Number(qtyInput.value) > stock) {
        qtyInput.value = stock;
        currentQuantity = stock;
      }
    } else {
      if (addBtn) addBtn.disabled = true;
      if (buyBtn) buyBtn.disabled = true;
      if (hintEl) {
        hintEl.textContent = "Biến thể bạn chọn hiện đã hết hàng. Vui lòng chọn màu hoặc size khác.";
        hintEl.style.display = "block";
      }
    }
  }

  // 4. BẢNG THÔNG SỐ KỸ THUẬT
  function renderSpecifications(prod) {
    const tbody = document.getElementById("pdpSpecsTbody");
    if (!tbody) return;

    const specs = prod.specifications || {};
    const entries = Object.entries(specs);

    const labelsMap = {
      weight: "Trọng lượng",
      grip: "Chu vi cán",
      tension: "Mức căng khuyến nghị",
      balance: "Điểm cân bằng",
      material: "Chất liệu",
      stiffness: "Độ cứng",
      size: "Kích thước",
      width: "Độ rộng form",
      usage_time: "Thời gian đã sử dụng",
      condition_grade: "Độ mới thực tế"
    };

    const rows = entries.length
      ? entries.map(([k, v]) => [labelsMap[k] || k, v])
      : [
          ["Trọng lượng", "3U / 4U"],
          ["Chất liệu", "Graphite"],
          ["Độ cứng", "Trung bình - Cứng"]
        ];

    tbody.innerHTML = rows
      .map(
        ([label, val]) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(val)}</td>
        </tr>
      `
      )
      .join("");
  }

  // 5. THẺ THÔNG TIN BÊN PHẢI (MỚI -> THÔNG TIN BIẾN THỂ | ĐỒ CŨ -> TÌNH TRẠNG THỰC TẾ)
  function renderSideInfoCard(prod) {
    const card = document.getElementById("pdpSideInfoCard");
    if (!card) return;

    const isUsed = prod.condition_type === "CU";
    if (isUsed) {
      const wearNote =
        prod.wear_description ||
        prod.condition_note ||
        "Trầy nhẹ ở viền khung; không nứt, không cong. Cán còn nguyên, sử dụng tốt. Xem ảnh cận cảnh 2 và 3.";
      card.innerHTML = `
        <h3 class="ts-pdp-info-card-title">TÌNH TRẠNG THỰC TẾ</h3>
        <p class="ts-pdp-info-card-text">${escapeHtml(wearNote)}</p>
        <span class="ts-pdp-wear-badge">Có mô tả hao mòn</span>
      `;
    } else {
      card.innerHTML = `
        <h3 class="ts-pdp-info-card-title">THÔNG TIN BIẾN THỂ</h3>
        <p class="ts-pdp-info-card-text">
          Giá và số lượng có sẵn thay đổi theo màu và size bạn chọn.
          Phụ kiện dạng lô/ống hiển thị số quả trong mỗi lô.
        </p>
      `;
    }
  }

  // 6. GẮN SỰ KIỆN TƯƠNG TÁC
  function bindEvents() {
    // Bấm vào thumbnail
    document.getElementById("pdpThumbsWrap")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-pdp-thumb");
      if (!btn) return;
      document.querySelectorAll(".ts-pdp-thumb").forEach((t) => t.classList.remove("is-active"));
      btn.classList.add("is-active");
      showGalleryImage(btn.dataset.imgUrl, btn.dataset.imgIndex);
    });

    // Chọn Màu
    document.getElementById("pdpColorOptions")?.addEventListener("click", (e) => {
      const pill = e.target.closest(".js-color-pill");
      if (!pill || pill.disabled) return;
      document.querySelectorAll(".js-color-pill").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      selectedColor = pill.dataset.color;
      updateSkuDisplay();
    });

    // Chọn Size / Trọng lượng
    document.getElementById("pdpSizeOptions")?.addEventListener("click", (e) => {
      const pill = e.target.closest(".js-size-pill");
      if (!pill || pill.disabled) return;
      document.querySelectorAll(".js-size-pill").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      selectedSize = pill.dataset.size;
      updateSkuDisplay();
    });

    // Tăng / Giảm số lượng
    const qtyInput = document.getElementById("pdpQuantity");
    document.getElementById("btnQtyMinus")?.addEventListener("click", () => {
      const val = Number(qtyInput.value) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
        currentQuantity = val - 1;
      }
    });

    document.getElementById("btnQtyPlus")?.addEventListener("click", () => {
      const val = Number(qtyInput.value) || 1;
      const max = matchingSku ? Number(matchingSku.stock) : 99;
      if (val < max) {
        qtyInput.value = val + 1;
        currentQuantity = val + 1;
      } else {
        showToast(`Kho chỉ còn tối đa ${max} sản phẩm.`, "error");
      }
    });

    // Thêm vào giỏ
    document.getElementById("btnAddToCart")?.addEventListener("click", () => {
      addCurrentSelectionToCart(false);
    });

    // Mua ngay
    document.getElementById("btnBuyNow")?.addEventListener("click", () => {
      addCurrentSelectionToCart(true);
    });
  }

  function addCurrentSelectionToCart(redirectToCheckout) {
    if (!matchingSku || !currentProduct) return;
    const qty = Number(document.getElementById("pdpQuantity")?.value) || 1;
    try {
      window.tsportStore.addToCart(currentProduct.id, matchingSku.id, qty);
      if (typeof window.updateHeaderCartBadge === "function") {
        window.updateHeaderCartBadge();
      }
      if (redirectToCheckout) {
        window.location.href = "cart.html";
      } else {
        animateProductToCart(document.getElementById("pdpMainImage"), document.getElementById("btnAddToCart"));
        showToast(`Đã thêm ${qty} × "${currentProduct.name}" vào giỏ hàng.`, "success");
      }
    } catch (err) {
      showToast(err.message || "Không thể thêm vào giỏ hàng.", "error");
    }
  }

  function formatMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
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

  document.addEventListener("DOMContentLoaded", async () => {
    await window.tsportCatalogReady;
    initProductDetailModule();
  });
})();
