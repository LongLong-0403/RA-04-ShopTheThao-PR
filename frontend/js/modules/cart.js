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
    initCheckoutPage();
    bindCartEvents();
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

  // 2. KHỞI TẠO TRANG CHECKOUT
  function initCheckoutPage() {
    const checkoutForm = document.getElementById("formCheckout");
    if (!checkoutForm) return;

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

    // Render danh sách sản phẩm tóm tắt trong trang Checkout
    const summaryItems = document.getElementById("checkoutSummaryItems");
    if (summaryItems) {
      if (orderItems.length === 0) {
        summaryItems.innerHTML = '<div style="color:#EF4444; font-weight:700;">Giỏ hàng trống! Vui lòng quay lại giỏ hàng.</div>';
        const submitBtn = document.getElementById("btnPlaceOrder");
        if (submitBtn) submitBtn.disabled = true;
      } else {
        summaryItems.innerHTML = orderItems.map((item) => `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:13px;">
            <div style="flex:1; padding-right:10px;">
              <strong>${escapeHtml(item.product_name)}</strong>
              <div style="color:#64748B; font-size:11px;">${item.size} • ${item.color} x ${item.quantity}</div>
            </div>
            <div style="font-weight:700; color:#D94C26;">${formatMoney(item.price * item.quantity)}</div>
          </div>
        `).join("");
      }
    }

    const grandTotalEl = document.getElementById("checkoutGrandTotal");
    if (grandTotalEl) grandTotalEl.textContent = formatMoney(totals.grandTotal);

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

    // XỬ LÝ SUBMIT ĐẶT HÀNG (KÈM CHỐNG BẤM LẶP & CHECK TỒN KHO)
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
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
    const payment = "COD"; // Phương thức COD theo yêu cầu

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

        // HIỂN THỊ POPUP ĐẶT HÀNG THÀNH CÔNG
        const successModal = document.getElementById("modalOrderSuccess");
        const codeEl = document.getElementById("successOrderCode");
        const totalEl = document.getElementById("successOrderTotal");

        if (codeEl) codeEl.textContent = order.order_code;
        if (totalEl) totalEl.textContent = formatMoney(order.total_amount);

        openModal("modalOrderSuccess");
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
          alert("⚠️ " + err.message);
        }
      } finally {
        isSubmitting = false;
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>✓</span><span>Xác nhận Đặt hàng (COD)</span>`;
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
