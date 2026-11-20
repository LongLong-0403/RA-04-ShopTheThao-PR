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
  let appliedCoupon = null;

  function updateCheckoutTotals() {
    const store = window.tsportStore;
    if (!store) return;
    const totals = store.getCartTotals();
    const subtotalEl = document.getElementById("checkoutSubtotal");
    const grandTotalEl = document.getElementById("checkoutGrandTotal");
    const rowDiscount = document.getElementById("rowDiscount");
    const appliedTag = document.getElementById("appliedCouponTag");
    const discountAmountEl = document.getElementById("checkoutDiscountAmount");
    const msgEl = document.getElementById("couponStatusMsg");

    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);

    if (appliedCoupon) {
      const valRes = store.validateAndCalculateCoupon(appliedCoupon.code, totals.subtotal);
      if (valRes.valid) {
        if (rowDiscount) rowDiscount.style.display = "flex";
        if (appliedTag) appliedTag.textContent = appliedCoupon.code;
        if (discountAmountEl) discountAmountEl.textContent = `-${formatMoney(valRes.discount_amount)}`;
        if (grandTotalEl) grandTotalEl.textContent = formatMoney(valRes.final_total);
        if (msgEl) {
          msgEl.style.display = "block";
          msgEl.style.color = "#16A34A";
          msgEl.textContent = valRes.message;
        }
      } else {
        appliedCoupon = null;
        if (rowDiscount) rowDiscount.style.display = "none";
        if (grandTotalEl) grandTotalEl.textContent = formatMoney(totals.grandTotal);
        if (msgEl) {
          msgEl.style.display = "block";
          msgEl.style.color = "#DC2626";
          msgEl.textContent = valRes.message;
        }
      }
    } else {
      if (rowDiscount) rowDiscount.style.display = "none";
      if (grandTotalEl) grandTotalEl.textContent = formatMoney(totals.grandTotal);
    }
  }

  function handleApplyCoupon() {
    const store = window.tsportStore;
    const input = document.getElementById("inputCheckoutCoupon");
    const msgEl = document.getElementById("couponStatusMsg");
    if (!input || !store) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
      if (msgEl) {
        msgEl.style.display = "block";
        msgEl.style.color = "#DC2626";
        msgEl.textContent = "Vui lòng nhập mã giảm giá!";
      }
      return;
    }

    const totals = store.getCartTotals();
    const res = store.validateAndCalculateCoupon(code, totals.subtotal);

    if (res.valid) {
      appliedCoupon = res.coupon;
      input.value = res.coupon.code;
      updateCheckoutTotals();
      showToast(`Áp dụng thành công mã "${res.coupon.code}"!`, "success");
    } else {
      appliedCoupon = null;
      updateCheckoutTotals();
      if (msgEl) {
        msgEl.style.display = "block";
        msgEl.style.color = "#DC2626";
        msgEl.textContent = res.message;
      }
      showToast(res.message, "error");
    }
  }

  function handleRemoveCoupon() {
    appliedCoupon = null;
    const input = document.getElementById("inputCheckoutCoupon");
    const msgEl = document.getElementById("couponStatusMsg");
    if (input) input.value = "";
    if (msgEl) {
      msgEl.style.display = "none";
      msgEl.textContent = "";
    }
    updateCheckoutTotals();
    showToast("Đã hủy áp dụng mã giảm giá.", "info");
  }

  function initCartModule() {
    initCartHeaderSearch();
    renderCartPage();
    renderCartRecommendations();
    initCheckoutPage();
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

    const fallbackImg = "/frontend/assets/products/victor-auraspeed-90k-ii.png";
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
                src="${escapeHtml(primaryImg.image_url)}"
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
            <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.product_name)}" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
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

    if (codeEl) codeEl.textContent = order.order_code || "ORD-20261107-001";
    if (totalEl) totalEl.textContent = formatCartMoney(order.total_amount || 0);
    if (payEl) payEl.textContent = payMap[order.payment_method] || order.payment_method || "COD";
    if (detailBtn) detailBtn.href = `orders.html?code=${encodeURIComponent(order.order_code || "")}`;

    if (formView) formView.style.display = "none";
    if (successView) successView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 2. KHỞI TẠO TRANG CHECKOUT
  function initCheckoutPage() {
    const checkoutForm = document.getElementById("formCheckout");
    if (!checkoutForm) return;

    const urlParams = typeof getUrlParams === "function" ? getUrlParams() : {};
    if (urlParams.success === "1" || urlParams.order) {
      const store = window.tsportStore;
      const latestOrder =
        (store && store.getOrders && store.getOrders().find((o) => o.order_code === urlParams.order)) ||
        (store && store.getOrders && store.getOrders()[0]) || {
          order_code: urlParams.order || "ORD-20261107-001",
          total_amount: 2850000,
          payment_method: "COD"
        };
      showCheckoutSuccessView(latestOrder);
      return;
    }

    const store = window.tsportStore;
    if (!store) return;

    const totals = store.getCartTotals();
    const orderItems = totals.items;

    // Tự động điền thông tin người dùng nếu đã đăng nhập
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
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

    // BIND SỰ KIỆN MÃ GIẢM GIÁ (COUPON)
    document.getElementById("btnApplyCoupon")?.addEventListener("click", handleApplyCoupon);
    document.getElementById("inputCheckoutCoupon")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApplyCoupon();
      }
    });
    document.getElementById("btnRemoveCoupon")?.addEventListener("click", handleRemoveCoupon);
    document.querySelectorAll(".js-quick-coupon").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const code = el.getAttribute("data-code");
        const input = document.getElementById("inputCheckoutCoupon");
        if (input && code) {
          input.value = code;
          handleApplyCoupon();
        }
      });
    });
    updateCheckoutTotals();
    initCheckoutPaymentSelector();

    // XỬ LÝ SUBMIT ĐẶT HÀNG (KÈM CHỐNG BẤM LẶP & CHECK TỒN KHO)
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }

  function initCheckoutPaymentSelector() {
    const payList = document.getElementById("checkoutPayList");
    if (!payList) return;

    const bankDetail = document.getElementById("payDetailBank");
    const walletDetail = document.getElementById("payDetailWallet");
    const submitBtn = document.getElementById("btnPlaceOrder");
    const walletHidden = document.getElementById("selectedWalletProvider");

    function updatePayUI(method) {
      payList.querySelectorAll(".ts-checkout-v2-cod-box").forEach((box) => {
        const isMatch = box.dataset.pay === method;
        box.classList.toggle("is-selected", isMatch);
        const radio = box.querySelector('input[name="paymentMethod"]');
        if (radio) radio.checked = isMatch;
      });

      if (bankDetail) bankDetail.style.display = method === "BANK" ? "block" : "none";
      if (walletDetail) walletDetail.style.display = method === "EWALLET" ? "block" : "none";

      if (submitBtn && !submitBtn.disabled) {
        if (method === "BANK") {
          submitBtn.textContent = "Đặt hàng & Chuyển khoản";
        } else if (method === "EWALLET") {
          const w = walletHidden?.value || "MoMo";
          submitBtn.textContent = `Thanh toán qua ${w}`;
        } else {
          submitBtn.textContent = "Đặt hàng COD";
        }
      }
    }

    payList.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        updatePayUI(radio.value);
      });
    });

    document.getElementById("checkoutWalletPills")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-checkout-v2-wallet-btn");
      if (!btn) return;
      document.querySelectorAll(".ts-checkout-v2-wallet-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (walletHidden) walletHidden.value = btn.dataset.wallet || "MoMo";
      const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "COD";
      if (checkedMethod === "EWALLET") updatePayUI("EWALLET");
    });
  }

  // 3. XỬ LÝ ĐẶT HÀNG VỚI CƠ CHẾ CHỐNG LẶP & LỖI TỒN KHO
  function handleCheckoutSubmit(e) {
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
    const note = document.getElementById("checkoutNote")?.value.trim() || "";
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "COD";
    const walletProvider = document.getElementById("selectedWalletProvider")?.value || "MoMo";
    const payment = selectedMethod === "EWALLET" ? `EWALLET_${walletProvider.toUpperCase()}` : selectedMethod;

    if (!name || !phone || !addr) {
      alert("⚠️ Vui lòng nhập đầy đủ Tên người nhận, SĐT và Địa chỉ giao hàng!");
      return;
    }

    // Bật trạng thái đang gửi
    isSubmitting = true;
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>⏳</span><span>Đang xử lý đặt đơn hàng...</span>`;
    }

    // Trì hoãn nhẹ 300ms để kiểm tra tính toàn vẹn tồn kho
    setTimeout(() => {
      try {
        const store = window.tsportStore;
        // Gọi hàm tạo đơn hàng trong store (tự động kiểm tra và trừ tồn kho, kiểm tra & tính lại mã giảm giá)
        const order = store.createOrder({
          customer_name: name,
          phone,
          address: addr,
          payment_method: payment,
          note,
          coupon_code: appliedCoupon ? appliedCoupon.code : ""
        });

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
        } else {
          alert(err.message);
        }
      } finally {
        isSubmitting = false;
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Đặt hàng COD";
        }
      }
    }, 300);
  }

  // 4. BẮT CÁC SỰ KIỆN TRONG BẢNG GIỎ HÀNG
  function bindCartEvents() {
    document.addEventListener("click", (e) => {
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
          } catch (err) {
            alert("⚠️ " + err.message);
          }
        }
      }

      // Nút Giảm số lượng (-)
      const minusBtn = e.target.closest(".js-cart-minus");
      if (minusBtn) {
        const skuId = Number(minusBtn.dataset.sku);
        const item = store.getCart().find((i) => i.sku_id === skuId);
        if (item) {
          if (item.quantity > 1) {
            store.updateCartItem(skuId, item.quantity - 1);
            renderCartPage();
          } else {
            if (confirm(`Bạn có chắc muốn xóa "${item.product_name}" khỏi giỏ hàng?`)) {
              store.removeFromCart(skuId);
              renderCartPage();
              showToast("Đã xóa sản phẩm khỏi giỏ hàng", "info");
            }
          }
        }
      }

      // Nút Xóa dòng
      const removeBtn = e.target.closest(".js-cart-remove");
      if (removeBtn) {
        const skuId = Number(removeBtn.dataset.sku);
        store.removeFromCart(skuId);
        renderCartPage();
        showToast("Đã xóa sản phẩm khỏi giỏ hàng", "info");
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
        } catch (err) {
          alert("⚠️ " + err.message);
          renderCartPage();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initCartModule);
})();
