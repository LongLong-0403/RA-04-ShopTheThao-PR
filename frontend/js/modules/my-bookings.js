/**
 * TSPORT — MODULE LỊCH ĐẶT SÂN CỦA TÔI (MY BOOKINGS FIGMA)
 * - Hiển thị bảng 4 cột: Sân / Ngày, Ca giờ / Giá đã đặt, Trạng thái, Thao tác
 * - Hỗ trợ Hủy yêu cầu (Chờ xác nhận), Hủy lịch (Đã xác nhận) và Xem thông tin (Từ chối / Đã hủy)
 */

(function () {
  function initMyBookingsPage() {
    initSidebarUser();
    initHeaderSearch();
    renderBookingsTable();
    bindEvents();
  }

  function getInitials(name) {
    const parts = String(name || "TS").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function initSidebarUser() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || {
      full_name: "Nguyễn Minh Anh",
      role: "CUSTOMER"
    };
    const nameEl = document.getElementById("sbBookingsName");
    const roleEl = document.getElementById("sbBookingsRole");
    const avatarEl = document.getElementById("sbBookingsAvatar");
    if (nameEl) nameEl.textContent = user.full_name || user.email || "Khách hàng";
    if (roleEl) roleEl.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    if (avatarEl) avatarEl.textContent = getInitials(user.full_name || user.email);

    document.getElementById("btnBookingsLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function initHeaderSearch() {
    const form = document.getElementById("myBookingsSearchForm");
    const input = document.getElementById("myBookingsSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function formatDMY(iso) {
    const parts = String(iso || "").split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso || "";
  }

  function formatMoneyVN(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function getStatusMeta(status) {
    const map = {
      PENDING: { label: "Chờ xác nhận", cls: "is-pending", action: "Hủy yêu cầu", actionType: "cancel" },
      CONFIRMED: { label: "Đã xác nhận", cls: "", action: "Hủy lịch", actionType: "cancel" },
      COMPLETED: { label: "Hoàn tất", cls: "", action: "Xem thông tin", actionType: "info" },
      REJECTED: { label: "Từ chối", cls: "", action: "Xem thông tin", actionType: "info" },
      CANCELLED: { label: "Đã hủy", cls: "is-cancelled", action: "Xem thông tin", actionType: "info" }
    };
    return map[status] || { label: status, cls: "", action: "Xem thông tin", actionType: "info" };
  }

  function renderBookingsTable() {
    const tbody = document.getElementById("myBookingsTableBody");
    const store = window.tsportStore;
    if (!tbody || !store) return;

    const bookings = store.getBookings() || [];

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:44px 16px; color:#6B7280;">
            Bạn chưa có lịch đặt sân nào. Bấm "Đặt thêm sân" để chọn ca chơi ngay.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings
      .map((b) => {
        const st = getStatusMeta(b.status);
        return `
          <tr>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(b.court_name)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(formatDMY(b.booking_date))}</div>
            </td>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(b.time_slot)}</div>
              <div class="ts-orders-v2-date">${formatMoneyVN(b.fixed_price)}</div>
            </td>
            <td>
              <span class="ts-orders-v2-status ${st.cls}">${escapeHtml(st.label)}</span>
            </td>
            <td>
              <button
                type="button"
                class="ts-orders-v2-detail-btn js-booking-action"
                data-booking-id="${b.id}"
                data-action-type="${st.actionType}"
              >
                ${escapeHtml(st.action)}
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function bindEvents() {
    document.getElementById("myBookingsTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-booking-action");
      if (!btn) return;
      const store = window.tsportStore;
      if (!store) return;

      const id = Number(btn.dataset.bookingId);
      const type = btn.dataset.actionType;
      const booking = store.getBookings().find((b) => Number(b.id) === id);
      if (!booking) return;

      if (type === "cancel") {
        const ok = confirm(`Bạn có chắc muốn hủy lịch "${booking.court_name}" (${booking.time_slot})?`);
        if (!ok) return;
        try {
          if (booking.status === "PENDING") {
            store.cancelBooking(id);
          } else {
            store.updateBookingStatus(id, "CANCELLED", "Khách hàng chủ động hủy lịch");
          }
          showToast("Đã hủy lịch đặt sân thành công.", "success");
          renderBookingsTable();
        } catch (err) {
          showToast(err.message || "Không thể hủy lịch này.", "error");
        }
      } else {
        const reason = booking.reject_reason || booking.note || "Không có ghi chú thêm.";
        showToast(`${booking.court_name} (${formatDMY(booking.booking_date)} • ${booking.time_slot}): ${reason}`, "info");
      }
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

  document.addEventListener("DOMContentLoaded", initMyBookingsPage);
})();
