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

  function loadSavedCouponFromStorage() {
    const store = window.tsportStore;
    if (!store) return;
    const savedCode = localStorage.getItem("tsport_selected_coupon");
    if (savedCode) {
      const found = store.getCouponByCode(savedCode);
      if (found && found.status === "ACTIVE") {
        appliedCoupon = found;
      }
    }
  }

  function renderSelectableVoucherCards(containerId, subtotal) {
    const store = window.tsportStore;
    const container = document.getElementById(containerId);
    if (!store || !container) return;

    const today = new Date().toISOString().split("T")[0];
    const activeCoupons = store.getCoupons({ status: "ACTIVE" }).filter(c => {
      if (c.expires_at && c.expires_at < today) return false;
      if (c.usage_limit && Number(c.used_count) >= Number(c.usage_limit)) return false;
      return true;
    });

    if (activeCoupons.length === 0) {
      container.innerHTML = `<div style="font-size:12px; color:#64748B;">Hiện chưa có mã voucher khả dụng.</div>`;
      return;
    }

    const currentCode = appliedCoupon ? appliedCoupon.code.toUpperCase() : "";

    container.innerHTML = activeCoupons.map(c => {
      const isSelected = currentCode === c.code.toUpperCase();
      const valRes = store.validateAndCalculateCoupon(c.code, subtotal);
      const isEligible = valRes.valid;
      const badgeLabel = c.discount_type === "PERCENT"
        ? `-${c.discount_value}%`
        : `-${formatMoney(c.discount_value)}`;

      const neededMore = (c.min_order_value || 0) - subtotal;

      return `
        <div class="js-select-voucher-card" data-code="${escapeHtml(c.code)}" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; cursor:pointer; transition:all 0.15s ease; background:${isSelected ? '#FFF7ED' : '#FFFFFF'}; border:1.5px solid ${isSelected ? '#D94C26' : '#E2E8F0'}; opacity:${isEligible ? '1' : '0.85'};">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <span style="background:${isSelected ? '#D94C26' : '#FFF1EB'}; color:${isSelected ? '#FFFFFF' : '#D94C26'}; font-weight:800; font-size:11px; padding:4px 7px; border-radius:6px; white-space:nowrap;">
              ${escapeHtml(badgeLabel)}
            </span>
            <div style="min-width:0;">
              <div style="font-size:12.5px; font-weight:800; color:#0F172A;">
                ${escapeHtml(c.code)}
                ${isEligible ? `<span style="color:#16A34A; font-weight:700; font-size:11px; margin-left:4px;">(-${formatMoney(valRes.discount_amount)})</span>` : ''}
              </div>
              <div style="font-size:11px; color:${isEligible ? '#64748B' : '#D97706'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${isEligible ? escapeHtml(c.description || 'Đủ điều kiện áp dụng') : `Mua thêm ${formatMoney(Math.max(0, neededMore))} để áp dụng`}
              </div>
            </div>
          </div>
          <button type="button" style="border:none; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:800; cursor:pointer; white-space:nowrap; background:${isSelected ? '#D94C26' : (isEligible ? '#FFF1EB' : '#F1F5F9')}; color:${isSelected ? '#FFFFFF' : (isEligible ? '#D94C26' : '#64748B')};">
            ${isSelected ? '✓ Đang dùng' : 'Chọn'}
          </button>
        </div>
      `;
    }).join("");
  }

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
    const inputEl = document.getElementById("inputCheckoutCoupon");

    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);

    if (appliedCoupon) {
      const valRes = store.validateAndCalculateCoupon(appliedCoupon.code, totals.subtotal);
      if (valRes.valid) {
        if (inputEl) inputEl.value = appliedCoupon.code;
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

    renderSelectableVoucherCards("checkoutVoucherSelectList", totals.subtotal);
  }

  function applyCouponByCode(rawCode, isCartPage = false) {
    const store = window.tsportStore;
    if (!store) return;
    const msgEl = document.getElementById(isCartPage ? "cartCouponStatusMsg" : "couponStatusMsg");
    const inputEl = document.getElementById(isCartPage ? "inputCartCoupon" : "inputCheckoutCoupon");

    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) {
      if (msgEl) {
        msgEl.style.display = "block";
        msgEl.style.color = "#DC2626";
        msgEl.textContent = "Vui lòng chọn hoặc nhập mã voucher!";
      }
      return;
    }

    const totals = store.getCartTotals();
    const res = store.validateAndCalculateCoupon(code, totals.subtotal);

    if (res.valid) {
      appliedCoupon = res.coupon;
      localStorage.setItem("tsport_selected_coupon", res.coupon.code);
      if (inputEl) inputEl.value = res.coupon.code;
      renderTotals(totals);
      updateCheckoutTotals();
      showToast(`Đã áp dụng voucher "${res.coupon.code}" (-${formatMoney(res.discount_amount)})!`, "success");
    } else {
      if (msgEl) {
        msgEl.style.display = "block";
        msgEl.style.color = "#DC2626";
        msgEl.textContent = res.message;
      }
      renderTotals(totals);
      updateCheckoutTotals();
      showToast(res.message, "error");
    }
  }

  function handleApplyCoupon() {
    const input = document.getElementById("inputCheckoutCoupon");
    applyCouponByCode(input ? input.value : "", false);
  }

  function handleApplyCartCoupon() {
    const input = document.getElementById("inputCartCoupon");
    applyCouponByCode(input ? input.value : "", true);
  }

  function handleRemoveCoupon() {
    appliedCoupon = null;
    localStorage.removeItem("tsport_selected_coupon");
    const inputCheckout = document.getElementById("inputCheckoutCoupon");
    const inputCart = document.getElementById("inputCartCoupon");
    const msgCheckout = document.getElementById("couponStatusMsg");
    const msgCart = document.getElementById("cartCouponStatusMsg");
    if (inputCheckout) inputCheckout.value = "";
    if (inputCart) inputCart.value = "";
    if (msgCheckout) {
      msgCheckout.style.display = "none";
      msgCheckout.textContent = "";
    }
    if (msgCart) {
      msgCart.style.display = "none";
      msgCart.textContent = "";
    }
    const store = window.tsportStore;
    if (store) renderTotals(store.getCartTotals());
    updateCheckoutTotals();
    showToast("Đã bỏ chọn mã voucher giảm giá.", "info");
  }

  function initCartModule() {
    loadSavedCouponFromStorage();
    renderCartPage();
    initCheckoutPage();
    bindCartEvents();
  }

  // 1. RENDER TRANG GIỎ HÀNG
  function renderCartPage() {
    const listWrap = document.getElementById("cartItemsList");
    const summaryWrap = document.getElementById("cartSummaryWrap");
    if (!listWrap) return;

    const store = window.tsportStore;
    if (!store) return;

    const totals = store.getCartTotals();
    const items = totals.items;

    if (items.length === 0) {
      listWrap.innerHTML = `
        <div style="text-align:center; padding:48px 20px;">
          <div style="font-size:48px; margin-bottom:12px;">🛒</div>
          <h3 style="font-size:18px; font-weight:800; color:#1E293B; margin-bottom:6px;">Giỏ hàng của bạn đang trống</h3>
          <p style="font-size:13px; color:#64748B; margin-bottom:18px;">Hãy dạo qua cửa hàng để chọn những món đồ thể thao ưng ý nhé!</p>
          <a href="shop.html" class="btn btn-primary">🛍️ Khám phá cửa hàng ngay</a>
        </div>
      `;
      if (summaryWrap) summaryWrap.style.display = "none";
      return;
    }

    if (summaryWrap) summaryWrap.style.display = "block";

    listWrap.innerHTML = items.map((item) => `
      <div class="tsport-cart-item" data-sku-id="${item.sku_id}">
        <img src="${escapeHtml(item.image_url)}" class="tsport-cart-img" alt="${escapeHtml(item.product_name)}" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
        
        <div>
          <h4 class="tsport-cart-item-name">${escapeHtml(item.product_name)}</h4>
          <div class="tsport-cart-item-variant">
            <span>Size: <strong>${escapeHtml(item.size)}</strong></span>
            <span>•</span>
            <span>Màu: <strong>${escapeHtml(item.color)}</strong></span>
            ${item.condition_type === 'CU' ? '<span class="badge" style="background:#FEF3C7; color:#92400E; font-size:10px;">ĐỒ CŨ</span>' : ''}
          </div>
          <div style="font-size:12px; color:#64748B; margin-top:4px;">
            Đơn giá: ${formatMoney(item.price)} / ${item.unit === 'LO' ? 'lô' : 'chiếc'}
          </div>
        </div>

        <!-- Bộ tăng giảm số lượng -->
        <div class="tsport-qty-picker">
          <button type="button" class="tsport-qty-btn js-cart-minus" data-sku="${item.sku_id}">−</button>
          <input type="number" class="tsport-qty-input js-cart-input" value="${item.quantity}" min="1" max="${item.stock}" data-sku="${item.sku_id}" />
          <button type="button" class="tsport-qty-btn js-cart-plus" data-sku="${item.sku_id}">+</button>
        </div>

        <div style="display:flex; align-items:center; gap:14px;">
          <div class="tsport-cart-item-price">${formatMoney(item.price * item.quantity)}</div>
          <button type="button" class="btn-cart-remove js-cart-remove" data-sku="${item.sku_id}" title="Xóa món này khỏi giỏ">🗑️</button>
        </div>
      </div>
    `).join("");

    // Render tóm tắt tiền
    renderTotals(totals);
  }

  function renderTotals(totals) {
    const store = window.tsportStore;
    const subtotalEl = document.getElementById("cartSubtotal");
    const grandTotalEl = document.getElementById("cartGrandTotal");
    const totalCountEl = document.getElementById("cartTotalCount");
    const rowDiscountEl = document.getElementById("rowCartDiscount");
    const tagEl = document.getElementById("cartAppliedCouponTag");
    const discountAmountEl = document.getElementById("cartDiscountAmount");
    const msgEl = document.getElementById("cartCouponStatusMsg");
    const inputEl = document.getElementById("inputCartCoupon");

    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);
    if (totalCountEl) totalCountEl.textContent = `${totals.totalItems} sản phẩm`;

    if (store && appliedCoupon) {
      const valRes = store.validateAndCalculateCoupon(appliedCoupon.code, totals.subtotal);
      if (valRes.valid) {
        if (inputEl) inputEl.value = appliedCoupon.code;
        if (rowDiscountEl) rowDiscountEl.style.display = "flex";
        if (tagEl) tagEl.textContent = appliedCoupon.code;
        if (discountAmountEl) discountAmountEl.textContent = `-${formatMoney(valRes.discount_amount)}`;
        if (grandTotalEl) grandTotalEl.textContent = formatMoney(valRes.final_total);
        if (msgEl) {
          msgEl.style.display = "block";
          msgEl.style.color = "#16A34A";
          msgEl.textContent = valRes.message;
        }
      } else {
        if (rowDiscountEl) rowDiscountEl.style.display = "none";
        if (grandTotalEl) grandTotalEl.textContent = formatMoney(totals.grandTotal);
        if (msgEl) {
          msgEl.style.display = "block";
          msgEl.style.color = "#DC2626";
          msgEl.textContent = valRes.message;
        }
      }
    } else {
      if (rowDiscountEl) rowDiscountEl.style.display = "none";
      if (grandTotalEl) grandTotalEl.textContent = formatMoney(totals.grandTotal);
    }

    renderSelectableVoucherCards("cartVoucherSelectList", totals.subtotal);

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

    // BIND SỰ KIỆN MÃ GIẢM GIÁ (COUPON) Ở TRANG CHECKOUT
    document.getElementById("btnApplyCoupon")?.addEventListener("click", handleApplyCoupon);
    document.getElementById("inputCheckoutCoupon")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApplyCoupon();
      }
    });
    document.getElementById("btnRemoveCoupon")?.addEventListener("click", handleRemoveCoupon);
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
        const totals = store.getCartTotals();
        let validCouponCode = "";
        if (appliedCoupon) {
          const check = store.validateAndCalculateCoupon(appliedCoupon.code, totals.subtotal);
          if (check.valid) validCouponCode = appliedCoupon.code;
        }

        // Gọi hàm tạo đơn hàng trong store (tự động kiểm tra và trừ tồn kho, kiểm tra & tính lại mã giảm giá)
        const order = store.createOrder({
          customer_name: name,
          phone,
          address: addr,
          payment_method: payment,
          note,
          coupon_code: validCouponCode
        });

        // Xóa mã đã lưu sau khi đặt đơn thành công
        appliedCoupon = null;
        localStorage.removeItem("tsport_selected_coupon");

        // HIỂN THỊ POPUP ĐẶT HÀNG THÀNH CÔNG
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

  // 4. BẮT CÁC SỰ KIỆN TRONG BẢNG GIỎ HÀNG & LỰA CHỌN VOUCHER
  function bindCartEvents() {
    document.getElementById("btnApplyCartCoupon")?.addEventListener("click", handleApplyCartCoupon);
    document.getElementById("inputCartCoupon")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApplyCartCoupon();
      }
    });
    document.getElementById("btnRemoveCartCoupon")?.addEventListener("click", handleRemoveCoupon);

    document.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      // Bấm chọn hoặc bỏ chọn thẻ Voucher trong danh sách (ở Giỏ hàng hoặc Checkout)
      const voucherCard = e.target.closest(".js-select-voucher-card");
      if (voucherCard) {
        const code = voucherCard.dataset.code;
        if (appliedCoupon && appliedCoupon.code.toUpperCase() === code.toUpperCase()) {
          handleRemoveCoupon();
        } else {
          const isCart = Boolean(voucherCard.closest("#cartVoucherSelectList"));
          applyCouponByCode(code, isCart);
        }
        return;
      }

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
