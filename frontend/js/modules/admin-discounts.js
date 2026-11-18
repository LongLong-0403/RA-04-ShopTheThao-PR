/**
 * TSPORT — MODULE QUẢN LÝ MÃ GIẢM GIÁ & KHUYẾN MÃI (ADMIN DISCOUNTS)
 * Hỗ trợ tạo voucher phần trăm / số tiền, đơn tối thiểu, hạn dùng, số lượt và kiểm tra tự động tại checkout
 */

(function () {
  let searchKeyword = "";
  let currentTypeFilter = "ALL";
  let currentStatusFilter = "ALL";

  function initAdminDiscounts() {
    renderCouponsTable();
    updateKpis();
    bindEvents();
  }

  // 1. CẬP NHẬT CÁC CHỈ SỐ KPI
  function updateKpis() {
    const store = window.tsportStore;
    if (!store) return;

    const coupons = store.getCoupons() || [];
    const orders = store.getOrders() || [];

    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.status === "ACTIVE").length;
    const usedCount = coupons.reduce((sum, c) => sum + (Number(c.used_count) || 0), 0);

    // Tính tổng tiền đã chiết khấu cho khách từ các đơn hàng có mã coupon
    const totalDiscount = orders.reduce((sum, o) => sum + (Number(o.discount_amount) || 0), 0);

    const kpiTotalEl = document.getElementById("kpiTotalCoupons");
    const kpiActiveEl = document.getElementById("kpiActiveCoupons");
    const kpiUsedEl = document.getElementById("kpiUsedCount");
    const kpiDiscountEl = document.getElementById("kpiTotalDiscount");

    if (kpiTotalEl) kpiTotalEl.textContent = totalCoupons;
    if (kpiActiveEl) kpiActiveEl.textContent = activeCoupons;
    if (kpiUsedEl) kpiUsedEl.textContent = usedCount;
    if (kpiDiscountEl) kpiDiscountEl.textContent = (totalDiscount || 0).toLocaleString("vi-VN") + " ₫";
  }

  // 2. RENDER BẢNG DỮ LIỆU MÃ GIẢM GIÁ
  function renderCouponsTable() {
    const store = window.tsportStore;
    const tbody = document.getElementById("couponsTableBody");
    const badge = document.getElementById("couponCountBadge");
    if (!tbody || !store) return;

    let list = store.getCoupons() || [];

    // Lọc theo từ khóa tìm kiếm
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      list = list.filter(c => 
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Lọc theo loại giảm
    if (currentTypeFilter !== "ALL") {
      list = list.filter(c => c.discount_type === currentTypeFilter);
    }

    // Lọc theo trạng thái
    if (currentStatusFilter !== "ALL") {
      list = list.filter(c => c.status === currentStatusFilter);
    }

    if (badge) badge.textContent = `${list.length} mã`;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:32px 16px; color:#64748B;">
            <div style="font-size:32px; margin-bottom:8px;">🏷️</div>
            <div style="font-weight:700;">Không tìm thấy mã giảm giá nào phù hợp</div>
            <div style="font-size:12px; margin-top:4px;">Thử thay đổi bộ lọc hoặc bấm "+ Tạo mã giảm giá mới" ở trên.</div>
          </td>
        </tr>
      `;
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    tbody.innerHTML = list.map((c) => {
      const isExpired = c.expires_at && c.expires_at < today;
      const isOverLimit = c.usage_limit && c.used_count >= c.usage_limit;
      const isInactive = c.status === "INACTIVE";

      // Badge loại giảm giá
      let discountDisplay = "";
      if (c.discount_type === "PERCENT") {
        discountDisplay = `
          <div style="font-weight:800; color:#2563EB; font-size:14px;">Giảm ${c.discount_value}%</div>
          ${c.max_discount ? `<div style="font-size:11px; color:#64748B;">Tối đa: ${(c.max_discount).toLocaleString('vi-VN')}₫</div>` : ''}
        `;
      } else {
        discountDisplay = `
          <div style="font-weight:800; color:#059669; font-size:14px;">Giảm ${(c.discount_value).toLocaleString('vi-VN')}₫</div>
        `;
      }

      // Đơn tối thiểu
      const minOrderText = c.min_order_value && c.min_order_value > 0
        ? `Từ ${(c.min_order_value).toLocaleString('vi-VN')}₫`
        : `<span style="color:#64748B;">Mọi đơn hàng</span>`;

      // Hạn sử dụng
      let expiryHtml = "";
      if (!c.expires_at) {
        expiryHtml = `<span style="color:#64748B;">Vô thời hạn</span>`;
      } else if (isExpired) {
        expiryHtml = `
          <div style="color:#DC2626; font-weight:700; font-size:12px;">${formatDateVn(c.expires_at)}</div>
          <span class="badge badge-inactive" style="font-size:10px;">Đã hết hạn</span>
        `;
      } else {
        expiryHtml = `<div style="color:#334155; font-weight:600; font-size:12px;">${formatDateVn(c.expires_at)}</div>`;
      }

      // Lượt sử dụng (tiến độ)
      const used = Number(c.used_count) || 0;
      const limit = c.usage_limit ? Number(c.usage_limit) : null;
      let usageHtml = "";
      if (!limit) {
        usageHtml = `<span style="font-weight:700; color:#334155;">${used} lượt</span> <span style="font-size:11px; color:#64748B;">(Không giới hạn)</span>`;
      } else {
        const percent = Math.min(100, Math.round((used / limit) * 100));
        usageHtml = `
          <div style="font-size:12px; font-weight:700; color:${isOverLimit ? '#DC2626' : '#334155'};">
            ${used} / ${limit} lượt
          </div>
          <div style="background:#E2E8F0; border-radius:4px; height:5px; width:100%; margin-top:4px; overflow:hidden;">
            <div style="background:${isOverLimit ? '#DC2626' : '#D94C26'}; width:${percent}%; height:100%;"></div>
          </div>
        `;
      }

      // Trạng thái badge
      let statusBadge = "";
      if (isInactive) {
        statusBadge = `<span class="badge badge-inactive">○ Đang khóa</span>`;
      } else if (isExpired) {
        statusBadge = `<span class="badge badge-inactive" style="background:#FEE2E2; color:#DC2626;">Hết hạn</span>`;
      } else if (isOverLimit) {
        statusBadge = `<span class="badge badge-inactive" style="background:#FEF3C7; color:#D97706;">Hết lượt</span>`;
      } else {
        statusBadge = `<span class="badge badge-active">● Khả dụng</span>`;
      }

      return `
        <tr style="${isInactive || isExpired ? 'opacity:0.75; background:#FAFAFA;' : ''}">
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <code style="background:#FFF1EE; color:#D94C26; font-size:13px; font-weight:800; padding:4px 8px; border-radius:6px; border:1px dashed #D94C26; letter-spacing:0.5px;">${escapeHtml(c.code)}</code>
              <button type="button" class="btn-icon" style="font-size:12px;" onclick="window.copyCouponCode('${c.code}')" title="Sao chép mã">📋</button>
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:#0F172A; font-size:13px;">${escapeHtml(c.description || c.code)}</div>
            <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Tạo ngày: ${c.created_at || 'Mặc định'}</div>
          </td>
          <td>${discountDisplay}</td>
          <td>${minOrderText}</td>
          <td>${expiryHtml}</td>
          <td>${usageHtml}</td>
          <td>${statusBadge}</td>
          <td style="text-align:center;">
            <div style="display:flex; justify-content:center; gap:4px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.editCoupon(${c.id})" title="Chỉnh sửa mã" style="padding:4px 8px; font-size:11px;">
                ✏️
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.toggleCoupon(${c.id})" title="${isInactive ? 'Kích hoạt mã' : 'Tạm khóa mã'}" style="padding:4px 8px; font-size:11px; color:${isInactive ? '#16A34A' : '#F59E0B'};">
                ${isInactive ? '▶' : '⏸'}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.deleteCoupon(${c.id})" title="Xóa mã" style="padding:4px 8px; font-size:11px; color:#DC2626;">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 3. XỬ LÝ SỰ KIỆN & MODAL
  function bindEvents() {
    // Tìm kiếm
    const searchInput = document.getElementById("couponSearchInput");
    searchInput?.addEventListener("input", (e) => {
      searchKeyword = e.target.value.trim();
      renderCouponsTable();
    });

    // Lọc loại
    const filterType = document.getElementById("filterCouponType");
    filterType?.addEventListener("change", (e) => {
      currentTypeFilter = e.target.value;
      renderCouponsTable();
    });

    // Lọc trạng thái
    const filterStatus = document.getElementById("filterCouponStatus");
    filterStatus?.addEventListener("change", (e) => {
      currentStatusFilter = e.target.value;
      renderCouponsTable();
    });

    // Nút mở modal tạo mã
    const btnOpenCreate = document.getElementById("btnOpenCreateCouponModal");
    btnOpenCreate?.addEventListener("click", () => openCouponModal(null));

    // Thay đổi loại giảm giá trong form (PERCENT vs FIXED)
    const typeSelect = document.getElementById("couponDiscountType");
    typeSelect?.addEventListener("change", handleDiscountTypeChange);

    // Form submit
    const form = document.getElementById("formCoupon");
    form?.addEventListener("submit", handleCouponFormSubmit);
  }

  function handleDiscountTypeChange() {
    const typeSelect = document.getElementById("couponDiscountType");
    const labelVal = document.getElementById("labelDiscountValue");
    const valInput = document.getElementById("couponDiscountValue");
    const wrapMax = document.getElementById("wrapMaxDiscount");

    if (typeSelect?.value === "PERCENT") {
      if (labelVal) labelVal.innerHTML = 'Mức giảm (%) <span class="req">*</span>';
      if (valInput) {
        valInput.placeholder = "10";
        valInput.max = "100";
      }
      if (wrapMax) wrapMax.style.display = "block";
    } else {
      if (labelVal) labelVal.innerHTML = 'Mức giảm (₫) <span class="req">*</span>';
      if (valInput) {
        valInput.placeholder = "100000";
        valInput.removeAttribute("max");
      }
      if (wrapMax) wrapMax.style.display = "none";
    }
  }

  // 4. MỞ VÀ ĐÓNG MODAL
  function openCouponModal(couponId = null) {
    const store = window.tsportStore;
    const modal = document.getElementById("modalCouponForm");
    const titleEl = document.getElementById("couponModalTitle");
    const form = document.getElementById("formCoupon");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("couponEditId").value = "";

    if (couponId) {
      const c = store.getCouponById(couponId);
      if (!c) return;
      if (titleEl) titleEl.textContent = `Chỉnh sửa mã giảm giá: ${c.code}`;
      document.getElementById("couponEditId").value = c.id;
      document.getElementById("couponCode").value = c.code;
      document.getElementById("couponDescription").value = c.description || "";
      document.getElementById("couponDiscountType").value = c.discount_type || "PERCENT";
      document.getElementById("couponDiscountValue").value = c.discount_value;
      document.getElementById("couponMaxDiscount").value = c.max_discount || "";
      document.getElementById("couponMinOrder").value = c.min_order_value || 0;
      document.getElementById("couponExpiresAt").value = c.expires_at || "";
      document.getElementById("couponUsageLimit").value = c.usage_limit || "";
      document.getElementById("couponStatus").value = c.status || "ACTIVE";
    } else {
      if (titleEl) titleEl.textContent = "Tạo mã giảm giá mới";
      document.getElementById("couponDiscountType").value = "PERCENT";
      document.getElementById("couponStatus").value = "ACTIVE";
      document.getElementById("couponMinOrder").value = "0";
    }

    handleDiscountTypeChange();
    modal.classList.add("is-visible");
  }

  window.closeCouponModal = function () {
    const modal = document.getElementById("modalCouponForm");
    if (modal) modal.classList.remove("is-visible");
  };

  // 5. LƯU MÃ GIẢM GIÁ
  function handleCouponFormSubmit(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store) return;

    const editId = document.getElementById("couponEditId").value;
    const code = document.getElementById("couponCode").value.trim().toUpperCase();
    const description = document.getElementById("couponDescription").value.trim();
    const discount_type = document.getElementById("couponDiscountType").value;
    const discount_value = Number(document.getElementById("couponDiscountValue").value);
    const max_discount = document.getElementById("couponMaxDiscount").value ? Number(document.getElementById("couponMaxDiscount").value) : null;
    const min_order_value = Number(document.getElementById("couponMinOrder").value) || 0;
    const expires_at = document.getElementById("couponExpiresAt").value || null;
    const usage_limit = document.getElementById("couponUsageLimit").value ? Number(document.getElementById("couponUsageLimit").value) : null;
    const status = document.getElementById("couponStatus").value;

    try {
      store.saveCoupon({
        id: editId ? Number(editId) : null,
        code,
        description,
        discount_type,
        discount_value,
        max_discount,
        min_order_value,
        expires_at,
        usage_limit,
        status
      });

      window.closeCouponModal();
      renderCouponsTable();
      updateKpis();
      showToast(editId ? `Đã cập nhật mã "${code}" thành công!` : `Đã tạo mới mã giảm giá "${code}" thành công!`, "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  // 6. CÁC HÀM TIỆN ÍCH CHO WINDOW SCOPE
  window.editCoupon = function (id) {
    openCouponModal(id);
  };

  window.toggleCoupon = function (id) {
    const store = window.tsportStore;
    if (!store) return;
    try {
      const updated = store.toggleCouponStatus(id);
      renderCouponsTable();
      updateKpis();
      showToast(`Đã ${updated.status === 'ACTIVE' ? 'kích hoạt' : 'tạm khóa'} mã "${updated.code}"!`, "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  };

  window.deleteCoupon = function (id) {
    const store = window.tsportStore;
    if (!store) return;
    const coupon = store.getCouponById(id);
    if (!coupon) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá "${coupon.code}" không?`)) {
      return;
    }

    try {
      store.deleteCoupon(id);
      renderCouponsTable();
      updateKpis();
      showToast(`Đã xóa mã giảm giá "${coupon.code}" thành công!`, "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  };

  window.copyCouponCode = function (code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã "${code}" vào clipboard!`, "success");
    } else {
      prompt("Sao chép mã giảm giá:", code);
    }
  };

  function formatDateVn(dateStr) {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
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

  document.addEventListener("DOMContentLoaded", initAdminDiscounts);
})();
