/**
 * TSPORT — MODULE DUYỆT LỊCH ĐẶT SÂN (ADMIN BOOKINGS FIGMA)
 * - Lọc theo Ngày đặt, Sân và Trạng thái
 * - Duyệt (Xác nhận lịch), Từ chối hoặc Hủy lịch trực tiếp trong tsportStore
 * - Chặn xác nhận trùng sân + ca + ngày với lịch đã xác nhận khác
 */

(function () {
  let selectedBookingId = null;

  function initAdminBookings() {
    initTopbarControls();
    populateCourtFilter();
    renderAll();
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

  function populateCourtFilter() {
    const select = document.getElementById("admBkgCourtFilter");
    const store = window.tsportStore;
    if (!select || !store) return;
    const courts = store.getCourts() || [];
    select.innerHTML =
      `<option value="ALL">Tất cả</option>` +
      courts.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
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
      PENDING: { label: "Chờ xác nhận", cls: "is-pending" },
      CONFIRMED: { label: "Đã xác nhận", cls: "" },
      COMPLETED: { label: "Hoàn tất", cls: "" },
      REJECTED: { label: "Từ chối", cls: "is-cancelled" },
      CANCELLED: { label: "Đã hủy", cls: "is-cancelled" }
    };
    return map[status] || { label: status, cls: "" };
  }

  function renderAll() {
    renderBookingsTable();
    renderSelectedCard();
  }

  function renderBookingsTable() {
    const tbody = document.getElementById("admBookingsTbody");
    const store = window.tsportStore;
    if (!tbody || !store) return;

    const dateFilter = document.getElementById("admBkgDateFilter")?.value || "";
    const courtFilter = document.getElementById("admBkgCourtFilter")?.value || "ALL";
    const statusFilter = document.getElementById("admBkgStatusFilter")?.value || "ALL";

    let bookings = store.getBookings() || [];
    if (dateFilter) {
      bookings = bookings.filter((b) => String(b.booking_date) === dateFilter);
    }
    if (courtFilter !== "ALL") {
      bookings = bookings.filter((b) => Number(b.court_id) === Number(courtFilter));
    }
    if (statusFilter !== "ALL") {
      bookings = bookings.filter((b) => b.status === statusFilter);
    }

    if (selectedBookingId == null && bookings.length) {
      selectedBookingId = bookings[0].id;
    }

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:36px 16px; color:#6B7280;">
            Không tìm thấy lịch đặt sân phù hợp bộ lọc.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings
      .map((b) => {
        const st = getStatusMeta(b.status);
        const isSelected = Number(b.id) === Number(selectedBookingId);

        let actionHtml = `<span style="color:#9CA3AF;">—</span>`;
        if (b.status === "PENDING") {
          actionHtml = `
            <span style="display:inline-flex; align-items:center; gap:6px;">
              <button type="button" class="ts-orders-v2-detail-btn js-bkg-confirm" data-id="${b.id}">Duyệt</button>
              <span style="color:#9CA3AF;">/</span>
              <button type="button" class="ts-orders-v2-detail-btn js-bkg-reject" data-id="${b.id}">Từ chối</button>
            </span>
          `;
        } else if (b.status === "CONFIRMED") {
          actionHtml = `<button type="button" class="ts-orders-v2-detail-btn js-bkg-cancel" data-id="${b.id}">Hủy lịch</button>`;
        }

        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-bkg-id="${b.id}">
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(b.customer_name || "Khách hàng")}</div>
              <div class="ts-orders-v2-date">${escapeHtml(b.phone || "")}</div>
            </td>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(b.court_name)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(formatDMY(b.booking_date))}</div>
            </td>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(b.time_slot)}</div>
              <div class="ts-orders-v2-date">${formatMoneyVN(b.fixed_price)}</div>
            </td>
            <td>
              <span class="ts-orders-v2-status ${st.cls}">${st.label}</span>
            </td>
            <td>${actionHtml}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSelectedCard() {
    const store = window.tsportStore;
    if (!store) return;

    const b = (store.getBookings() || []).find((x) => Number(x.id) === Number(selectedBookingId));
    const titleEl = document.getElementById("admBkgSelectedTitle");
    const metaEl = document.getElementById("admBkgSelectedMeta");
    const btnConfirm = document.getElementById("btnAdmConfirmBkg");
    const btnReject = document.getElementById("btnAdmRejectBkg");
    const btnCancel = document.getElementById("btnAdmCancelBkg");

    if (!b) {
      if (titleEl) titleEl.textContent = "Chưa chọn yêu cầu đặt sân";
      if (metaEl) metaEl.textContent = "Bấm vào một dòng trong bảng phía trên để thao tác.";
      if (btnConfirm) btnConfirm.disabled = true;
      if (btnReject) btnReject.disabled = true;
      if (btnCancel) btnCancel.disabled = true;
      return;
    }

    if (titleEl) titleEl.textContent = `Yêu cầu của ${b.customer_name || "Khách hàng"}`;
    if (metaEl) {
      metaEl.textContent = `${b.court_name} • ${formatDMY(b.booking_date)} • ${b.time_slot} • Giá lúc đặt: ${formatMoneyVN(b.fixed_price)}`;
    }

    if (btnConfirm) btnConfirm.disabled = b.status !== "PENDING";
    if (btnReject) btnReject.disabled = b.status !== "PENDING";
    if (btnCancel) btnCancel.disabled = b.status === "CANCELLED" || b.status === "REJECTED";
  }

  function changeBookingStatus(id, nextStatus) {
    const store = window.tsportStore;
    if (!store) return;

    const bookings = store.getBookings() || [];
    const target = bookings.find((b) => Number(b.id) === Number(id));
    if (!target) return;

    // Kiểm tra trùng lịch trước khi xác nhận
    if (nextStatus === "CONFIRMED") {
      const conflict = bookings.find(
        (b) =>
          Number(b.id) !== Number(target.id) &&
          Number(b.court_id) === Number(target.court_id) &&
          String(b.booking_date) === String(target.booking_date) &&
          String(b.time_slot) === String(target.time_slot) &&
          b.status === "CONFIRMED"
      );
      if (conflict) {
        showToast("Sân và ca này đã có lịch được xác nhận trùng thời gian!", "error");
        return;
      }
    }

    const reason =
      nextStatus === "REJECTED"
        ? "Quản trị viên từ chối yêu cầu"
        : nextStatus === "CANCELLED"
        ? "Quản trị viên hủy lịch"
        : "";

    store.updateBookingStatus(id, nextStatus, reason);
    selectedBookingId = Number(id);
    renderAll();

    const msgMap = {
      CONFIRMED: "Đã xác nhận lịch đặt sân!",
      REJECTED: "Đã từ chối yêu cầu đặt sân.",
      CANCELLED: "Đã hủy lịch đặt sân."
    };
    showToast(msgMap[nextStatus] || "Đã cập nhật trạng thái.", nextStatus === "CONFIRMED" ? "success" : "info");
  }

  function bindEvents() {
    document.getElementById("admBkgDateFilter")?.addEventListener("change", renderAll);
    document.getElementById("admBkgCourtFilter")?.addEventListener("change", renderAll);
    document.getElementById("admBkgStatusFilter")?.addEventListener("change", renderAll);

    document.getElementById("admBookingsTbody")?.addEventListener("click", (e) => {
      const confirmBtn = e.target.closest(".js-bkg-confirm");
      if (confirmBtn) {
        changeBookingStatus(confirmBtn.dataset.id, "CONFIRMED");
        return;
      }
      const rejectBtn = e.target.closest(".js-bkg-reject");
      if (rejectBtn) {
        changeBookingStatus(rejectBtn.dataset.id, "REJECTED");
        return;
      }
      const cancelBtn = e.target.closest(".js-bkg-cancel");
      if (cancelBtn) {
        changeBookingStatus(cancelBtn.dataset.id, "CANCELLED");
        return;
      }

      const row = e.target.closest("tr[data-bkg-id]");
      if (row) {
        selectedBookingId = Number(row.dataset.bkgId);
        renderAll();
      }
    });

    document.getElementById("btnAdmConfirmBkg")?.addEventListener("click", () => {
      if (selectedBookingId) changeBookingStatus(selectedBookingId, "CONFIRMED");
    });
    document.getElementById("btnAdmRejectBkg")?.addEventListener("click", () => {
      if (selectedBookingId) changeBookingStatus(selectedBookingId, "REJECTED");
    });
    document.getElementById("btnAdmCancelBkg")?.addEventListener("click", () => {
      if (selectedBookingId) changeBookingStatus(selectedBookingId, "CANCELLED");
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

  document.addEventListener("DOMContentLoaded", initAdminBookings);
})();
