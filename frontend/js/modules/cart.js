/**
 * TSPORT — MODULE GIỎ HÀNG & THANH TOÁN (CART & CHECKOUT)
 * Tính năng:
 * - Sửa số lượng (kiểm tra tồn kho), Xóa từng dòng, Tính tổng tiền tự động
 * - Trang checkout: Nhập người nhận, SĐT, Địa chỉ, chọn COD
 * - Chặn bấm lặp (Debounce / Disable submit chống tạo 2 đơn hàng trùng)
 * - Hiển thị lỗi tồn kho rõ ràng nếu SKU không còn đủ hàng
 * - Thông báo đặt hàng thành công kèm Mã đơn hàng
 */

(function () {
  let isSubmitting = false;
  let checkoutItems = null;

  async function initCartModule(user) {
    initCartHeaderSearch();
    renderCartPage();
    renderCartRecommendations();
    await initCheckoutPage(user);
    bindCartEvents();
  }

  // GỢI Ý 6 SẢN PHẨM VỢT "CÓ THỂ BẠN SẼ THÍCH" DƯỚI GIỎ HÀNG
  function renderCartRecommendations() {
    const grid = document.getElementById("cartRecommendationsGrid");
    if (!grid) return;

    const store = window.tsportStore;
    if (!store) return;

    const allProducts = store.getProducts({ status: "ACTIVE" }) || [];
    const rackets = allProducts.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      return name.includes("vợt") || Number(p.category_id) === 2 || Number(p.category_id) === 3 || Number(p.category_id) === 4;
    });

    // Đưa Victor Auraspeed 90K II (id=10) và các mẫu vợt nổi bật lên trước
    const sorted = [...rackets].sort((a, b) => {
      if (Number(a.id) === 10) return -1;
      if (Number(b.id) === 10) return 1;
      return Number(a.id) - Number(b.id);
    });
    const baseList = sorted.slice(0, 6);
    // Nhân đôi danh sách để trượt vô tận mượt từ trái sang phải và kéo chuột thoải mái
    const list = baseList.length ? [...baseList, ...baseList] : [];

    const fallbackImg = "/assets/products/victor-auraspeed-90k-ii.png";
    const promoDiscounts = [18, 0, 15, 0, 22, 25];

    grid.innerHTML = list
      .map((p, idx) => {
        const primaryImg =
          (p.images && p.images.find((i) => i.is_primary)) ||
          (p.images && p.images[0]) ||
          { image_url: fallbackImg };

        const skus = p.skus || [];
        const basePrices = skus.map((s) => Number(s.price) || 0).filter(Boolean);
        const effPrices = skus
          .map((s) => (s.sale_price && Number(s.sale_price) > 0 ? Number(s.sale_price) : Number(s.price) || 0))
          .filter(Boolean);

        const minOrig = basePrices.length ? Math.min(...basePrices) : 1500000;
        let minEff = effPrices.length ? Math.min(...effPrices) : minOrig;
        let discountPct = 0;

        const promoIdx = idx % promoDiscounts.length;
        if (minEff < minOrig) {
          discountPct = Math.round(((minOrig - minEff) / minOrig) * 100);
        } else if (promoDiscounts[promoIdx] > 0) {
          discountPct = promoDiscounts[promoIdx];
          minEff = Math.round((minOrig * (100 - discountPct)) / 100 / 1000) * 1000;
        }

        return `
          <a href="product-detail.html?id=${p.id}" class="ts-cart-rec-card" draggable="false">
            <div class="ts-cart-rec-media">
              ${discountPct > 0 ? `<span class="ts-cart-rec-discount">- ${discountPct}%</span>` : ""}
              <img
                src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}"
                alt="${escapeHtml(p.name)}"
                loading="lazy"
                draggable="false"
                onerror="this.src='${fallbackImg}'"
              />
            </div>
            <h3 class="ts-cart-rec-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
            <div class="ts-cart-rec-price">${formatCartMoney(minEff)}</div>
            ${discountPct > 0 ? `<div class="ts-cart-rec-oldprice">${formatCartMoney(minOrig)}</div>` : ""}
          </a>
        `;
      })
      .join("");

    initCartRecCarousel(grid);
  }

  // CAROUSEL GỢI Ý: KÉO CHUỘT MƯỢT + TỰ TRƯỢT TỪ TRÁI SANG PHẢI TRONG ĐÚNG 1S
  function initCartRecCarousel(track) {
    if (!track || track.dataset.carouselBound === "true") return;
    track.dataset.carouselBound = "true";

    let isDown = false;
    let isHovered = false;
    let didDrag = false;
    let startX = 0;
    let startScrollLeft = 0;
    let animFrame = null;
    let autoTimer = null;

    function getHalfWidth() {
      return track.scrollWidth / 2;
    }

    // Bắt đầu từ nửa sau để có khoảng trống trượt mượt từ trái sang phải ngay lập tức
    requestAnimationFrame(() => {
      const half = getHalfWidth();
      if (half > 0) track.scrollLeft = half;
    });

    function animateScrollTo(targetLeft, durationMs) {
      if (animFrame) cancelAnimationFrame(animFrame);
      const from = track.scrollLeft;
      const diff = targetLeft - from;
      const startTime = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        // Cubic ease-in-out mượt mà trong đúng 1s
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        track.scrollLeft = from + diff * eased;
        if (t < 1) {
          animFrame = requestAnimationFrame(tick);
        } else {
          animFrame = null;
        }
      }
      animFrame = requestAnimationFrame(tick);
    }

    function slideLeftToRightOnce() {
      if (isDown || isHovered) return;
      const firstCard = track.querySelector(".ts-cart-rec-card");
      if (!firstCard) return;

      const step = firstCard.getBoundingClientRect().width + 18;
      const half = getHalfWidth();
      if (half <= 0) return;

      // Nếu sắp chạm mép trái thì nhảy ngầm sang nửa sau cùng vị trí để trượt vô tận không khựng
      if (track.scrollLeft <= step * 0.5) {
        track.scrollLeft += half;
      }

      const target = Math.max(0, track.scrollLeft - step);
      animateScrollTo(target, 1000);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(slideLeftToRightOnce, 2200);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
    }

    // Kéo chuột (Mouse / Touch drag-to-scroll)
    track.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      didDrag = false;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
      stopAuto();
      track.classList.add("is-dragging");
      track.setPointerCapture?.(e.pointerId);
    });

    track.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) didDrag = true;
      track.scrollLeft = startScrollLeft - dx;

      const half = getHalfWidth();
      if (half > 0) {
        if (track.scrollLeft <= 2) {
          track.scrollLeft += half;
          startScrollLeft = track.scrollLeft;
          startX = e.clientX;
        } else if (track.scrollLeft >= half + half - track.clientWidth - 2) {
          track.scrollLeft -= half;
          startScrollLeft = track.scrollLeft;
          startX = e.clientX;
        }
      }
    });

    function endDrag(e) {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
      track.releasePointerCapture?.(e.pointerId);
      if (!isHovered) startAuto();
    }

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    track.addEventListener("click", (e) => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }
    });

    track.addEventListener("mouseenter", () => {
      isHovered = true;
      stopAuto();
    });

    track.addEventListener("mouseleave", () => {
      isHovered = false;
      if (!isDown) startAuto();
    });

    startAuto();
  }

  function initCartHeaderSearch() {
    const form = document.getElementById("cartSearchForm");
    const input = document.getElementById("cartSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  // 1. RENDER TRANG GIỎ HÀNG (TỐI GIẢN CHUẨN FIGMA)
  function renderCartPage() {
    const listWrap = document.getElementById("cartItemsList");
    const checkoutBtn = document.getElementById("cartCheckoutBtn");
    if (!listWrap) return;

    const store = window.tsportStore;
    if (!store) return;

    const totals = store.getCartTotals();
    const items = totals.items;

    renderTotals(totals);

    if (items.length === 0) {
      listWrap.innerHTML = `
        <div class="ts-cart-v2-empty">
          <h3 class="ts-cart-v2-empty-title">Giỏ hàng của bạn đang trống</h3>
          <p class="ts-cart-v2-empty-desc">Hãy chọn sản phẩm thể thao bạn cần và kiểm tra biến thể trước khi thanh toán.</p>
          <a href="shop.html" class="ts-cart-v2-empty-btn">Khám phá sản phẩm ngay</a>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.classList.add("is-disabled");
      return;
    }

    if (checkoutBtn) checkoutBtn.classList.remove("is-disabled");

    listWrap.innerHTML = items.map((item) => {
      const isUsed = item.condition_type === "CU";
      const unitText = item.unit === "LO"
        ? `Ống / ${item.quantity_per_lot || 12} quả`
        : "Chiếc";
      const variantParts = [item.size, item.color, unitText].filter(Boolean).join(" • ");
      const stockText = Number(item.stock) > 0 ? "Còn hàng" : "Tạm hết hàng";
      const detailUrl = item.product_id ? `product-detail.html?id=${item.product_id}` : "shop.html";

      return `
        <article class="ts-cart-v2-item" data-sku-id="${item.sku_id}">
          <a href="${detailUrl}" class="ts-cart-v2-thumb">
            <img src="${escapeHtml(storefrontImageUrl(item.image_url))}" alt="${escapeHtml(item.product_name)}" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
          </a>

          <div class="ts-cart-v2-info">
            <div>
              <a href="${detailUrl}" class="ts-cart-v2-name">${escapeHtml(item.product_name)}</a>
              <span class="ts-cart-v2-cond ${isUsed ? 'is-used' : ''}">${isUsed ? 'Đã qua sử dụng' : 'Mới'}</span>
              <div class="ts-cart-v2-variant">${escapeHtml(variantParts)}</div>
            </div>
            <div class="ts-cart-v2-stock">${stockText}</div>
          </div>

          <div class="ts-cart-v2-right">
            <div class="ts-cart-v2-right-top">
              <div class="ts-cart-v2-qty">
                <button type="button" class="ts-cart-v2-qty-btn js-cart-minus" data-sku="${item.sku_id}" aria-label="Giảm số lượng">−</button>
                <input type="number" class="ts-cart-v2-qty-input js-cart-input" value="${item.quantity}" min="1" max="${item.stock}" data-sku="${item.sku_id}" aria-label="Số lượng" />
                <button type="button" class="ts-cart-v2-qty-btn js-cart-plus" data-sku="${item.sku_id}" aria-label="Tăng số lượng">+</button>
              </div>
              <div class="ts-cart-v2-price">${formatCartMoney(item.price * item.quantity)}</div>
            </div>

            <button type="button" class="ts-cart-v2-remove js-cart-remove" data-sku="${item.sku_id}">Xóa</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function formatCartMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function renderTotals(totals) {
    const subtotalEl = document.getElementById("cartSubtotal");
    const grandTotalEl = document.getElementById("cartGrandTotal");
    const totalCountEl = document.getElementById("cartTotalCount");

    if (subtotalEl) subtotalEl.textContent = formatCartMoney(totals.subtotal);
    if (grandTotalEl) grandTotalEl.textContent = formatCartMoney(totals.grandTotal);
    if (totalCountEl) totalCountEl.textContent = `${totals.totalItems} sản phẩm`;

    if (typeof window.updateHeaderCartBadge === "function") {
      window.updateHeaderCartBadge();
    }
  }

  function showCheckoutSuccessView(order) {
    const formView = document.getElementById("checkoutFormView");
    const successView = document.getElementById("checkoutSuccessView");
    const codeEl = document.getElementById("successOrderCode");
    const totalEl = document.getElementById("successOrderTotal");
    const payEl = document.getElementById("successOrderPayment");
    const detailBtn = document.getElementById("btnViewOrderDetail");

    const payMap = {
      COD: "COD",
      BANK: "Chuyển khoản ngân hàng",
      EWALLET_MOMO: "Ví MoMo",
      EWALLET_ZALOPAY: "Ví ZaloPay",
      EWALLET_VNPAY: "Ví VNPay"
    };

    if (codeEl) codeEl.textContent = order.order_code;
    if (totalEl) totalEl.textContent = formatCartMoney(order.total_amount || 0);
    if (payEl) payEl.textContent = payMap[order.payment_method] || order.payment_method || "COD";
    if (detailBtn) detailBtn.href = `orders.html?code=${encodeURIComponent(order.order_code || "")}`;

    if (formView) formView.style.display = "none";
    if (successView) successView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getCheckoutTotalsForItems(items) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    return { items, totalItems: items.reduce((sum, item) => sum + Number(item.quantity), 0), subtotal, shipping: 0, grandTotal: subtotal };
  }

  // 2. KHỞI TẠO TRANG CHECKOUT
  async function initCheckoutPage(user) {
    const checkoutForm = document.getElementById("formCheckout");
    if (!checkoutForm) return;

    const urlParams = typeof getUrlParams === "function" ? getUrlParams() : {};
    if (urlParams.success === "1" || urlParams.order) {
      const orders = await api.get("/orders");
      const order = urlParams.order ? orders.find(row => row.order_code === urlParams.order) : orders[0];
      if (order) { showCheckoutSuccessView(order); return; }
    }

    const store = window.tsportStore;
    if (!store) return;

    const directItems = typeof getUrlParams === "function" && getUrlParams().direct === "1"
      ? (() => {
          try { return JSON.parse(sessionStorage.getItem("tsport_direct_checkout") || "[]"); }
          catch (_) { return []; }
        })()
      : [];
    checkoutItems = urlParams.direct === "1" ? directItems : null;
    const totals = checkoutItems
      ? getCheckoutTotalsForItems(checkoutItems)
      : store.getCartTotals();
    const orderItems = totals.items;

    // Tự động điền thông tin người dùng nếu đã đăng nhập
    if (user) {
      const nameInput = document.getElementById("checkoutName");
      const phoneInput = document.getElementById("checkoutPhone");
      const addrInput = document.getElementById("checkoutAddress");
      if (nameInput && !nameInput.value) nameInput.value = user.full_name || "";
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || "";
      if (addrInput && !addrInput.value) addrInput.value = user.address || "";
    }

    // Render danh sách sản phẩm tóm tắt trong trang Checkout (chuẩn tối giản)
    const summaryItems = document.getElementById("checkoutSummaryItems");
    if (summaryItems) {
      if (orderItems.length === 0) {
        summaryItems.innerHTML = '<div style="color:#111827; font-weight:700; font-size:13px;">Giỏ hàng đang trống. Vui lòng quay lại giỏ hàng để thêm sản phẩm.</div>';
        const submitBtn = document.getElementById("btnPlaceOrder");
        if (submitBtn) submitBtn.disabled = true;
      } else {
        summaryItems.innerHTML = orderItems.map((item) => {
          const condText = item.condition_type === "CU" ? "Đã qua sử dụng" : "Mới";
          const unitText = item.unit === "LO" ? `Ống / ${item.quantity_per_lot || 12} quả` : "Chiếc";
          const metaLine = [item.size, item.color, condText, unitText].filter(Boolean).join(" • ");
          return `
            <div class="ts-checkout-v2-item">
              <div class="ts-checkout-v2-item-name">${escapeHtml(item.product_name)} ×${item.quantity}</div>
              <div class="ts-checkout-v2-item-meta">${escapeHtml(metaLine)}</div>
              <div class="ts-checkout-v2-item-price">${formatCartMoney(item.price * item.quantity)}</div>
            </div>
          `;
        }).join("");
      }
    }

    const subtotalEl = document.getElementById("checkoutSubtotal");
    if (subtotalEl) subtotalEl.textContent = formatCartMoney(totals.subtotal);
    const grandTotalEl = document.getElementById("checkoutGrandTotal");
    if (grandTotalEl) grandTotalEl.textContent = formatCartMoney(totals.grandTotal);

    // XỬ LÝ SUBMIT ĐẶT HÀNG (KÈM CHỐNG BẤM LẶP & CHECK TỒN KHO)
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();

    // CHẶN BẤM LẶP (DEBOUNCE / PREVENT DUPLICATE SUBMIT)
    if (isSubmitting) return;

    const btnSubmit = document.getElementById("btnPlaceOrder");
    const errorBanner = document.getElementById("checkoutErrorBanner");
    const errorText = document.getElementById("checkoutErrorText");

    if (errorBanner) errorBanner.style.display = "none";

    const name = document.getElementById("checkoutName")?.value.trim();
    const phone = document.getElementById("checkoutPhone")?.value.trim();
    const addr = document.getElementById("checkoutAddress")?.value.trim();
    if (!name || !phone || !addr) {
      showToast("Vui lòng nhập đầy đủ Tên người nhận, SĐT và Địa chỉ giao hàng!", "error");
      return;
    }

    // Bật trạng thái đang gửi
    isSubmitting = true;
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>⏳</span><span>Đang xử lý đặt đơn hàng...</span>`;
    }

    try {
      const store = window.tsportStore;
      const directCheckout = checkoutItems !== null;
      const items = (checkoutItems ?? store.getCart()).map(item => ({
        product_sku_id: item.sku_id, quantity: item.quantity
      }));
      const payload = { receiver_name: name, receiver_phone: phone, shipping_address: addr, items };
      const fingerprint = JSON.stringify(payload);
      const pending = JSON.parse(sessionStorage.getItem("tsport_checkout_request") || "null");
      const owner = store.ownerKey;
      const requestId = pending?.fingerprint === fingerprint && pending.owner === owner
        ? pending.id : crypto.randomUUID();
      sessionStorage.setItem("tsport_checkout_request", JSON.stringify({ owner, fingerprint, id: requestId }));
      const order = await api.post("/orders", { ...payload, request_id: requestId });
      sessionStorage.removeItem("tsport_checkout_request");
      if (!directCheckout) store.clearCart();
      history.replaceState({}, "", "checkout.html?order=" + encodeURIComponent(order.order_code));
      if (directCheckout) {
        sessionStorage.removeItem("tsport_direct_checkout");
        checkoutItems = null;
      }

      // CHUYỂN SANG MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG (FULL-PAGE CARD)
      showCheckoutSuccessView(order);
      showToast(`Đặt hàng thành công! Mã đơn: ${order.order_code}`, "success");

      if (typeof window.updateHeaderCartBadge === "function") {
        window.updateHeaderCartBadge();
      }

    } catch (err) {
      // HIỂN THỊ LỖI TỒN KHO HOẶC LỖI NGHIỆP VỤ
      if (errorBanner && errorText) {
        errorBanner.style.display = "flex";
        errorText.textContent = err.message;
      }
      showToast(err.message || "Không thể đặt hàng.", "error");
    } finally {
      isSubmitting = false;
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Đặt hàng COD";
      }
    }
  }

  // 4. BẮT CÁC SỰ KIỆN TRONG BẢNG GIỎ HÀNG
  function bindCartEvents() {
    document.addEventListener("click", async (e) => {
      const store = window.tsportStore;
      if (!store) return;

      // Nút Tăng số lượng (+)
      const plusBtn = e.target.closest(".js-cart-plus");
      if (plusBtn) {
        const skuId = Number(plusBtn.dataset.sku);
        const item = store.getCart().find((i) => i.sku_id === skuId);
        if (item) {
          try {
            store.updateCartItem(skuId, item.quantity + 1);
            renderCartPage();
            showToast("Đã cập nhật số lượng sản phẩm.", "success");
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      }

      // Giảm số lượng hoặc xóa sản phẩm khỏi giỏ
      const minusBtn = e.target.closest(".js-cart-minus");
      const action = minusBtn || e.target.closest(".js-cart-remove");
      if (!action) return;
      const skuId = Number(action.dataset.sku);
      const item = store.getCart().find((i) => i.sku_id === skuId);
      if (!item) return;
      const shouldRemove = !minusBtn || item.quantity <= 1;
      if (shouldRemove && !(await confirmAction(
        `Bạn có chắc muốn xóa "${item.product_name}" khỏi giỏ hàng?`,
        "Xóa sản phẩm"
      ))) return;
      try {
        if (shouldRemove) store.removeFromCart(skuId);
        else store.updateCartItem(skuId, item.quantity - 1);
        renderCartPage();
        showToast(shouldRemove ? "Đã xóa sản phẩm khỏi giỏ hàng." : "Đã cập nhật số lượng sản phẩm.", "success");
      } catch (error) {
        showToast(error.message || "Không thể cập nhật giỏ hàng.", "error");
      }
    });

    // Thay đổi số lượng từ ô input
    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("js-cart-input")) {
        const store = window.tsportStore;
        const skuId = Number(e.target.dataset.sku);
        const val = Number(e.target.value);
        try {
          store.updateCartItem(skuId, val);
          renderCartPage();
          showToast("Đã cập nhật số lượng sản phẩm.", "success");
        } catch (err) {
          showToast(err.message, "error");
          renderCartPage();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => initCustomerPage(initCartModule));
})();
