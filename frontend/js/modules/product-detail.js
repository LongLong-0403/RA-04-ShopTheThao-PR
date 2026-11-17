/**
 * TSPORT — MODULE CHI TIẾT SẢN PHẨM & BIẾN THỂ SKU (PDP)
 * Tính năng:
 * - Ảnh lớn + Gallery thumbnails ảnh nhỏ (bấm thumbnail chuyển ảnh lớn)
 * - Thương hiệu, Thông số kỹ thuật (Specs)
 * - Chọn Size - Màu -> Tự động đổi giá / tồn kho theo SKU
 * - Chọn ĐỦ biến thể mới cho "Thêm vào giỏ" (chặn bấm khi chưa chọn đủ)
 * - Gọi module Giỏ hàng (Store cart), cập nhật badge giỏ trên Header
 * - Nhãn Mới / Cũ, Khối minh bạch mô tả hao mòn, số lượng/quả theo lô
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
    loadProduct(prodId);
  }

  function loadProduct(id) {
    const store = window.tsportStore;
    if (!store) return;

    currentProduct = store.getProductById(id);
    if (!currentProduct) {
      alert("⚠️ Không tìm thấy sản phẩm này!");
      window.location.href = "shop.html";
      return;
    }

    renderProductInfo(currentProduct);
    renderGallery(currentProduct);
    renderSkuVariants(currentProduct);
    renderSpecifications(currentProduct);
    trackRecentView(currentProduct.id);
    renderRatingAndReviews(currentProduct.id);
    bindEvents();
  }

  // THEO DÕI SẢN PHẨM ĐÃ XEM GẦN ĐÂY (LOCALSTORAGE)
  function trackRecentView(productId) {
    try {
      let recent = JSON.parse(localStorage.getItem("tsport_recent_views") || "[]");
      if (!Array.isArray(recent)) recent = [];
      recent = recent.filter(id => id !== productId);
      recent.unshift(productId);
      if (recent.length > 8) recent = recent.slice(0, 8);
      localStorage.setItem("tsport_recent_views", JSON.stringify(recent));
    } catch (_) {}
  }

  // RENDER ĐÁNH GIÁ & NHẬN XÉT (SRS)
  function renderRatingAndReviews(productId) {
    const store = window.tsportStore;
    if (!store) return;

    const ratingInfo = store.getProductRating(productId);
    const reviews = store.getReviews(productId);

    // Cập nhật điểm trên thanh tiêu đề
    const scoreEl = document.getElementById("pdpRatingScore");
    const countLink = document.getElementById("pdpReviewCountLink");
    if (scoreEl) scoreEl.textContent = ratingInfo.avgRating;
    if (countLink) countLink.textContent = `${ratingInfo.count} đánh giá từ khách mua hàng`;

    // Cập nhật tóm tắt lớn
    const bigScore = document.getElementById("pdpReviewBigScore");
    const bigStars = document.getElementById("pdpReviewBigStars");
    const bigSub = document.getElementById("pdpReviewBigSub");
    const countBadge = document.getElementById("pdpReviewCountBadge");

    if (bigScore) bigScore.textContent = ratingInfo.avgRating;
    if (bigStars) {
      const fullStars = Math.round(Number(ratingInfo.avgRating) || 5);
      bigStars.innerHTML = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
    }
    if (bigSub) bigSub.textContent = `Dựa trên ${ratingInfo.count} nhận xét thực tế`;
    if (countBadge) countBadge.textContent = `${ratingInfo.count} đánh giá`;

    // Kiểm tra quyền gửi đánh giá (chỉ khách có đơn hàng COMPLETED)
    const currentUser = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || { id: 2, full_name: "Nguyễn Văn An" };
    const canReview = store.canUserReviewProduct(productId, currentUser.id);

    const formWrap = document.getElementById("pdpReviewFormWrap");
    const permBox = document.getElementById("pdpReviewPermissionBox");

    if (canReview) {
      if (formWrap) formWrap.style.display = "block";
      if (permBox) {
        permBox.innerHTML = `
          <div style="color:#16A34A; font-weight:700; font-size:13px; margin-bottom:4px;">
            ✓ BẠN ĐỦ ĐIỀU KIỆN ĐÁNH GIÁ:
          </div>
          <div style="font-size:12px; color:#14532D;">
            Hệ thống xác nhận bạn đã hoàn tất đơn hàng chứa sản phẩm này. Hãy để lại đánh giá để chia sẻ với cộng đồng!
          </div>
        `;
        permBox.style.background = "#F0FDF4";
        permBox.style.borderColor = "#BBF7D0";
      }
    } else {
      if (formWrap) formWrap.style.display = "none";
      if (permBox) {
        permBox.innerHTML = `
          <strong style="color:#C2410C; font-size:13px; display:block; margin-bottom:4px;">🛡️ QUY ĐỊNH ĐÁNH GIÁ SẢN PHẨM:</strong>
          <p style="font-size:12px; color:#7C2D12; margin:0; line-height:1.5;">
            Chỉ những khách hàng đã mua và có đơn hàng ở trạng thái <strong>"Đã hoàn thành" (COMPLETED)</strong> mới được gửi đánh giá sao và nhận xét thực tế.
          </p>
        `;
        permBox.style.background = "#FFF7ED";
        permBox.style.borderColor = "#FED7AA";
      }
    }

    // Danh sách nhận xét
    const listWrap = document.getElementById("pdpReviewsListWrap");
    if (listWrap) {
      if (reviews.length === 0) {
        listWrap.innerHTML = `
          <div style="text-align:center; padding:30px; color:#94A3B8; background:#F8FAFC; border-radius:6px;">
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và chia sẻ!
          </div>
        `;
      } else {
        listWrap.innerHTML = reviews.map((r) => `
          <div style="border-bottom:1px solid #E2E8F0; padding-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <strong style="font-size:14px; color:#0F172A;">${escapeHtml(r.user_name)}</strong>
                <span class="badge" style="background:#DCFCE7; color:#15803D; font-size:10px;">✓ Đã mua hàng</span>
              </div>
              <span style="font-size:11px; color:#94A3B8;">${escapeHtml(r.created_at)}</span>
            </div>
            <div style="color:#F59E0B; font-size:14px; margin-bottom:6px;">
              ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
            </div>
            <p style="margin:0; font-size:13px; color:#334155; line-height:1.5;">
              ${escapeHtml(r.comment)}
            </p>
          </div>
        `).join("");
      }
    }
  }

  // 1. RENDER THÔNG TIN TỔNG QUAN & HÀNG CŨ
  function renderProductInfo(prod) {
    const store = window.tsportStore;
    const brand = store ? store.getBrandById(prod.brand_id) : null;
    const sport = store ? store.getSportById(prod.sport_id) : null;

    document.title = `${prod.name} | Tsport Store`;

    // Breadcrumb & Thương hiệu
    const brandLabel = document.getElementById("pdpBrandName");
    if (brandLabel) brandLabel.textContent = brand ? brand.name : "Tsport Official";

    const titleEl = document.getElementById("pdpTitle");
    if (titleEl) titleEl.textContent = prod.name;

    const descEl = document.getElementById("pdpDesc");
    if (descEl) descEl.textContent = prod.description || "Sản phẩm thể thao chính hãng phân phối bởi Tsport.";

    // Badge Mới / Cũ
    const badgeWrap = document.getElementById("pdpConditionBadgeWrap");
    const isUsed = prod.condition_type === "CU";
    if (badgeWrap) {
      badgeWrap.innerHTML = `
        <span class="tsport-badge-condition ${isUsed ? 'cu' : 'moi'}">
          ${isUsed ? 'ĐỒ CŨ MINH BẠCH' : 'HÀNG MỚI CHÍNH HÃNG 100%'}
        </span>
        ${sport ? `<span class="badge badge-sport" style="margin-left:8px;">${escapeHtml(sport.name)}</span>` : ''}
      `;
    }

    // Khối Hàng Cũ (Độ hao mòn, mô tả chi tiết, số lượng/lô)
    const usedBox = document.getElementById("pdpUsedGoodsBox");
    if (usedBox) {
      if (isUsed) {
        usedBox.style.display = "block";
        const lotInfo = prod.skus && prod.skus.length && prod.skus[0].unit === "LO"
          ? `<div class="tsport-lot-info">📦 Đóng gói: ${prod.skus[0].quantity_per_lot} quả / lô (hộp)</div>`
          : "";

        usedBox.innerHTML = `
          <div class="tsport-used-title">
            <span>🛡️</span>
            <span>CHỨNG NHẬN ĐỒ CŨ MINH BẠCH TSPORT (ĐÃ KIỂM ĐỊNH)</span>
          </div>
          <div class="tsport-used-desc">
            <strong>Mô tả hao mòn thực tế:</strong> ${escapeHtml(prod.wear_description || 'Đã qua sử dụng, khung và bề mặt còn nguyên bản.')}
          </div>
          ${lotInfo}
        `;
      } else {
        usedBox.style.display = "none";
      }
    }
  }

  // 2. RENDER GALLERY: ẢNH LỚN + THUMBNAILS
  function renderGallery(prod) {
    const mainImg = document.getElementById("pdpMainImage");
    const thumbsWrap = document.getElementById("pdpThumbsWrap");
    if (!mainImg || !thumbsWrap) return;

    const images = (prod.images && prod.images.length > 0)
      ? prod.images
      : [{ id: 1, image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600", is_primary: true }];

    const primaryImg = images.find((i) => i.is_primary) || images[0];
    mainImg.src = primaryImg.image_url;

    thumbsWrap.innerHTML = images.map((img, idx) => `
      <div class="tsport-pdp-thumb-item ${img.image_url === primaryImg.image_url ? 'is-active' : ''}" data-src="${escapeHtml(img.image_url)}">
        <img src="${escapeHtml(img.image_url)}" alt="Ảnh thumbnail ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
      </div>
    `).join("");

    // Bắt sự kiện click thumbnail đổi ảnh lớn
    thumbsWrap.querySelectorAll(".tsport-pdp-thumb-item").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        thumbsWrap.querySelectorAll(".tsport-pdp-thumb-item").forEach(t => t.classList.remove("is-active"));
        thumb.classList.add("is-active");
        mainImg.style.opacity = "0.4";
        setTimeout(() => {
          mainImg.src = thumb.dataset.src;
          mainImg.style.opacity = "1";
        }, 120);
      });
    });
  }

  // 3. RENDER BIẾN THỂ SKU (SIZE & MÀU SẮC)
  function renderSkuVariants(prod) {
    const sizeWrap = document.getElementById("pdpSizeOptions");
    const colorWrap = document.getElementById("pdpColorOptions");
    if (!sizeWrap || !colorWrap) return;

    const skus = prod.skus || [];

    // Danh sách Size và Màu duy nhất
    const uniqueSizes = [...new Set(skus.map((s) => s.size).filter(Boolean))];
    const uniqueColors = [...new Set(skus.map((s) => s.color).filter(Boolean))];

    // Render Size pills
    if (uniqueSizes.length > 0) {
      document.getElementById("pdpSizeSection").style.display = "block";
      sizeWrap.innerHTML = uniqueSizes.map((size) => `
        <button type="button" class="tsport-variant-pill js-size-pill" data-size="${escapeHtml(size)}">
          ${escapeHtml(size)}
        </button>
      `).join("");
    } else {
      document.getElementById("pdpSizeSection").style.display = "none";
      selectedSize = "-"; // Mặc định không cần chọn size
    }

    // Render Color pills
    if (uniqueColors.length > 0) {
      document.getElementById("pdpColorSection").style.display = "block";
      colorWrap.innerHTML = uniqueColors.map((color) => `
        <button type="button" class="tsport-variant-pill js-color-pill" data-color="${escapeHtml(color)}">
          ${escapeHtml(color)}
        </button>
      `).join("");
    } else {
      document.getElementById("pdpColorSection").style.display = "none";
      selectedColor = "-"; // Mặc định không cần chọn màu
    }

    // Nếu chỉ có 1 SKU duy nhất, tự động chọn sẵn
    if (skus.length === 1) {
      if (uniqueSizes.length > 0) {
        selectedSize = uniqueSizes[0];
        sizeWrap.querySelector(".js-size-pill")?.classList.add("is-active");
      }
      if (uniqueColors.length > 0) {
        selectedColor = uniqueColors[0];
        colorWrap.querySelector(".js-color-pill")?.classList.add("is-active");
      }
    }

    updateSkuDisplay();
  }

  // CẬP NHẬT GIÁ & TỒN THEO SKU ĐÃ CHỌN
  function updateSkuDisplay() {
    const priceEl = document.getElementById("pdpPrice");
    const stockStatusEl = document.getElementById("pdpStockStatus");
    const btnAddCart = document.getElementById("btnAddToCart");
    const hintEl = document.getElementById("pdpVariantHint");
    const qtyInput = document.getElementById("pdpQuantity");

    const skus = currentProduct ? currentProduct.skus : [];

    // Tìm SKU khớp với size và màu đã chọn
    matchingSku = skus.find((s) => {
      const matchSize = !selectedSize || selectedSize === "-" || s.size === selectedSize;
      const matchColor = !selectedColor || selectedColor === "-" || s.color === selectedColor;
      return matchSize && matchColor;
    });

    // Trường hợp CHƯA CHỌN ĐỦ BIẾN THỂ
    const needsSize = skus.some(s => s.size) && !selectedSize;
    const needsColor = skus.some(s => s.color) && !selectedColor;

    if (needsSize || needsColor || !matchingSku) {
      const minPrice = skus.length ? Math.min(...skus.map(s => s.price)) : 0;
      if (priceEl) priceEl.textContent = formatMoney(minPrice);
      if (stockStatusEl) {
        stockStatusEl.textContent = "Chưa chọn đủ biến thể";
        stockStatusEl.className = "tsport-pdp-stock-status";
      }
      if (btnAddCart) {
        btnAddCart.disabled = true;
      }
      if (hintEl) {
        hintEl.style.display = "block";
        hintEl.textContent = `👉 Vui lòng chọn ${needsSize && needsColor ? 'Kích thước và Màu sắc' : needsSize ? 'Kích thước' : 'Màu sắc'} trước khi thêm vào giỏ!`;
      }
      return;
    }

    // Trường hợp ĐÃ CHỌN ĐỦ BIẾN THỂ
    if (priceEl) priceEl.textContent = formatMoney(matchingSku.price);
    if (hintEl) hintEl.style.display = "none";

    if (matchingSku.stock > 0) {
      if (stockStatusEl) {
        stockStatusEl.textContent = `✓ Còn hàng (${matchingSku.stock} ${matchingSku.unit === 'LO' ? 'lô' : 'sản phẩm'})`;
        stockStatusEl.className = "tsport-pdp-stock-status in-stock";
      }
      if (btnAddCart) {
        btnAddCart.disabled = false;
      }
      if (qtyInput) {
        qtyInput.max = matchingSku.stock;
        if (Number(qtyInput.value) > matchingSku.stock) qtyInput.value = matchingSku.stock;
      }
    } else {
      if (stockStatusEl) {
        stockStatusEl.textContent = "✕ Tạm hết hàng trong kho";
        stockStatusEl.className = "tsport-pdp-stock-status out-stock";
      }
      if (btnAddCart) {
        btnAddCart.disabled = true;
      }
    }
  }

  // 4. BẢNG THÔNG SỐ KỸ THUẬT (SPECS)
  function renderSpecifications(prod) {
    const specsTbody = document.getElementById("pdpSpecsTbody");
    if (!specsTbody) return;

    const specs = prod.specifications || {};
    const entries = Object.entries(specs);

    if (entries.length === 0) {
      specsTbody.innerHTML = '<tr><td colspan="2" style="color:#94A3B8;">Đang cập nhật thông số chi tiết.</td></tr>';
      return;
    }

    const labelsMap = {
      weight: "Trọng lượng",
      grip: "Chu vi cán vợt",
      tension: "Sức căng cước tối đa",
      balance: "Điểm cân bằng",
      material: "Chất liệu",
      size: "Kích thước tiêu chuẩn",
      width: "Độ rộng form chân",
      usage_time: "Thời gian đã dùng",
      condition_grade: "Tỷ lệ mới còn lại"
    };

    specsTbody.innerHTML = entries.map(([key, val]) => `
      <tr>
        <td>${escapeHtml(labelsMap[key] || key)}</td>
        <td>${escapeHtml(val)}</td>
      </tr>
    `).join("");
  }

  // 5. GẮN SỰ KIỆN TƯƠNG TÁC
  function bindEvents() {
    // Chọn Size
    document.getElementById("pdpSizeOptions")?.addEventListener("click", (e) => {
      const pill = e.target.closest(".js-size-pill");
      if (!pill) return;
      document.querySelectorAll(".js-size-pill").forEach(p => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      selectedSize = pill.dataset.size;
      updateSkuDisplay();
    });

    // Chọn Màu
    document.getElementById("pdpColorOptions")?.addEventListener("click", (e) => {
      const pill = e.target.closest(".js-color-pill");
      if (!pill) return;
      document.querySelectorAll(".js-color-pill").forEach(p => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      selectedColor = pill.dataset.color;
      updateSkuDisplay();
    });

    // Tăng / Giảm số lượng
    const qtyInput = document.getElementById("pdpQuantity");
    document.getElementById("btnQtyMinus")?.addEventListener("click", () => {
      let val = Number(qtyInput.value) || 1;
      if (val > 1) {
        qtyInput.value = val - 1;
        currentQuantity = val - 1;
      }
    });

    document.getElementById("btnQtyPlus")?.addEventListener("click", () => {
      let val = Number(qtyInput.value) || 1;
      const max = matchingSku ? matchingSku.stock : 999;
      if (val < max) {
        qtyInput.value = val + 1;
        currentQuantity = val + 1;
      } else {
        showToast(`Kho chỉ còn tối đa ${max} sản phẩm!`, "error");
      }
    });

    // NÚT THÊM VÀO GIỎ HÀNG
    document.getElementById("btnAddToCart")?.addEventListener("click", () => {
      if (!matchingSku) {
        alert("⚠️ Vui lòng chọn đầy đủ biến thể kích cỡ và màu sắc!");
        return;
      }

      const qty = Number(document.getElementById("pdpQuantity")?.value) || 1;
      try {
        const store = window.tsportStore;
        store.addToCart(currentProduct.id, matchingSku.id, qty);

        // Hiển thị toast và cập nhật badge
        showToast(`Đã thêm ${qty} x "${currentProduct.name}" vào giỏ hàng!`, "success");
        if (typeof window.updateHeaderCartBadge === "function") {
          window.updateHeaderCartBadge();
        }
      } catch (err) {
        alert("⚠️ " + err.message);
      }
    });

    // CHỌN SỐ SAO ĐÁNH GIÁ (1 - 5 SAO)
    const starPicker = document.getElementById("starPickerGroup");
    const starValueInput = document.getElementById("reviewStarValue");
    const starLabel = document.getElementById("reviewStarLabel");
    const starLabelsMap = {
      1: "1 / 5 sao (Rất tệ)",
      2: "2 / 5 sao (Chưa hài lòng)",
      3: "3 / 5 sao (Bình thường)",
      4: "4 / 5 sao (Tốt)",
      5: "5 / 5 sao (Rất hài lòng)"
    };

    function highlightStars(val) {
      if (!starPicker) return;
      starPicker.querySelectorAll(".js-star").forEach(s => {
        const starVal = Number(s.dataset.val);
        s.style.color = starVal <= val ? "#F59E0B" : "#CBD5E1";
      });
      if (starLabel) starLabel.textContent = starLabelsMap[val] || `${val} sao`;
    }

    // Khởi tạo 5 sao
    highlightStars(5);

    starPicker?.addEventListener("click", (e) => {
      const star = e.target.closest(".js-star");
      if (!star) return;
      const val = Number(star.dataset.val);
      if (starValueInput) starValueInput.value = val;
      highlightStars(val);
    });

    // GỬI ĐÁNH GIÁ SẢN PHẨM
    document.getElementById("formSubmitReview")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store || !currentProduct) return;

      const rating = Number(document.getElementById("reviewStarValue")?.value) || 5;
      const comment = document.getElementById("reviewCommentText")?.value.trim();
      const currentUser = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || { id: 2, full_name: "Nguyễn Văn An" };

      if (!comment) {
        alert("⚠️ Vui lòng nhập nội dung nhận xét!");
        return;
      }

      try {
        store.addReview({
          product_id: currentProduct.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name || "Khách hàng Tsport",
          rating,
          comment
        });

        document.getElementById("reviewCommentText").value = "";
        renderRatingAndReviews(currentProduct.id);
        showToast("Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.", "success");
      } catch (err) {
        alert("⚠️ " + err.message);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initProductDetailModule);
})();
