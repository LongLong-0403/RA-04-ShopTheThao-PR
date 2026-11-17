/**
 * TSPORT — MODULE ĐẶT SÂN THỂ THAO & QUẢN LÝ CA SÂN (COURT BOOKING)
 * Tính năng:
 * - Khách: Chọn Môn -> Chọn Sân -> Chọn Ngày -> Chọn Ca (Slot giá cố định) -> Gửi yêu cầu, xem trạng thái, Hủy khi còn Chờ duyệt
 * - Admin: Tạo sân / Tạo ca giá cố định, Danh sách yêu cầu đặt sân toàn hệ thống, Xác nhận / Từ chối / Hủy
 */

(function () {
  let selectedSlotId = null;

  function initCourtsModule() {
    renderBookingSportOptions();
    renderBookingCourts();
    renderBookingSlots();
    renderMyBookings();
    renderAdminBookingRequests();
    renderAdminCourtsAndSlots();
    bindEvents();
  }

  // 1. RENDER DROPDOWN MÔN CHO FORM ĐẶT SÂN
  function renderBookingSportOptions() {
    const store = window.tsportStore;
    const sportSelect = document.getElementById("bookingSportSelect");
    const adminCourtSport = document.getElementById("adminCourtSport");
    if (!store) return;

    const sports = store.getSports();
    if (sportSelect) {
      sportSelect.innerHTML = sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
    if (adminCourtSport) {
      adminCourtSport.innerHTML = sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
  }

  // 2. RENDER DROPDOWN SÂN THEO MÔN ĐÃ CHỌN
  function renderBookingCourts() {
    const store = window.tsportStore;
    const sportId = document.getElementById("bookingSportSelect")?.value || 1;
    const courtSelect = document.getElementById("bookingCourtSelect");
    const adminSlotCourt = document.getElementById("adminSlotCourt");
    if (!store) return;

    const courts = store.getCourts(sportId);
    if (courtSelect) {
      if (courts.length === 0) {
        courtSelect.innerHTML = `<option value="">(Chưa có sân nào thuộc môn này)</option>`;
      } else {
        courtSelect.innerHTML = courts.map((c) => `<option value="${c.id}">${escapeHtml(c.name)} - ${escapeHtml(c.surface || '')}</option>`).join("");
      }
    }

    const allCourts = store.getCourts();
    if (adminSlotCourt) {
      adminSlotCourt.innerHTML = allCourts.map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.sport_name)})</option>`).join("");
    }
  }

  // 3. RENDER CÁC CA CHƠI & BẢNG GIÁ CỐ ĐỊNH
  function renderBookingSlots() {
    const store = window.tsportStore;
    const courtId = document.getElementById("bookingCourtSelect")?.value;
    const slotWrap = document.getElementById("bookingSlotSelector");
    if (!store || !slotWrap) return;

    if (!courtId) {
      slotWrap.innerHTML = `<div style="color:#64748B; font-size:13px;">Vui lòng chọn sân trước.</div>`;
      return;
    }

    const slots = store.getSlots(courtId);
    if (slots.length === 0) {
      slotWrap.innerHTML = `<div style="color:#EF4444; font-size:13px; font-weight:700;">Sân này hiện chưa được cấu hình ca giờ chơi!</div>`;
      selectedSlotId = null;
      return;
    }

    slotWrap.innerHTML = slots.map((s, idx) => `
      <div class="tsport-slot-btn js-slot-btn ${idx === 0 ? 'is-active' : ''}" data-slot-id="${s.id}">
        <div class="tsport-slot-time">⏰ ${escapeHtml(s.time_slot)}</div>
        <div class="tsport-slot-price">${formatMoney(s.fixed_price)}</div>
      </div>
    `).join("");

    selectedSlotId = slots[0]?.id || null;
  }

  // 4. KHÁCH XEM DANH SÁCH YÊU CẦU ĐẶT SÂN CỦA MÌNH
  function renderMyBookings() {
    const tbody = document.getElementById("myBookingsTbody");
    if (!tbody) return;

    const store = window.tsportStore;
    if (!store) return;

    const bookings = store.getBookings();

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94A3B8; padding:24px;">Bạn chưa có yêu cầu đặt sân nào.</td></tr>`;
      return;
    }

    const statusBadgeMap = {
      PENDING: '<span class="badge" style="background:#FEF3C7; color:#B45309;">⏳ Chờ duyệt</span>',
      CONFIRMED: '<span class="badge badge-active">✓ Đã duyệt (Thành công)</span>',
      REJECTED: '<span class="badge badge-inactive" style="background:#FEE2E2; color:#B91C1C;">✕ Từ chối</span>',
      CANCELLED: '<span class="badge badge-inactive">Đã hủy</span>'
    };

    tbody.innerHTML = bookings.map((b) => `
      <tr>
        <td><strong>${escapeHtml(b.booking_code)}</strong></td>
        <td>
          <div style="font-weight:700; color:#0F172A;">${escapeHtml(b.court_name)}</div>
          <span class="badge badge-sport" style="font-size:10px;">${escapeHtml(b.sport_name)}</span>
        </td>
        <td>${escapeHtml(b.booking_date)}</td>
        <td><code>${escapeHtml(b.time_slot)}</code></td>
        <td style="font-weight:800; color:#D94C26;">${formatMoney(b.fixed_price)}</td>
        <td>
          ${statusBadgeMap[b.status] || b.status}
          ${b.admin_note ? `<div style="font-size:11px; color:#DC2626; margin-top:2px;">Lý do: ${escapeHtml(b.admin_note)}</div>` : ''}
        </td>
        <td style="text-align:center;">
          ${b.status === 'PENDING' ? `
            <button type="button" class="btn btn-danger btn-sm js-cancel-booking" data-id="${b.id}" title="Hủy yêu cầu đặt sân">
              Hủy
            </button>
          ` : `
            <span style="font-size:12px; color:#94A3B8;">—</span>
          `}
        </td>
      </tr>
    `).join("");
  }

  // 5. ADMIN XEM & XỬ LÝ TOÀN BỘ YÊU CẦU ĐẶT SÂN
  function renderAdminBookingRequests() {
    const tbody = document.getElementById("adminBookingRequestsTbody");
    if (!tbody) return;

    const store = window.tsportStore;
    if (!store) return;

    const bookings = store.getBookings();

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94A3B8; padding:24px;">Không có yêu cầu nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map((b) => `
      <tr>
        <td><strong>${escapeHtml(b.booking_code)}</strong></td>
        <td>
          <strong>${escapeHtml(b.customer_name)}</strong>
          <div style="font-size:11px; color:#64748B;">SĐT: ${escapeHtml(b.phone)}</div>
        </td>
        <td>
          <strong>${escapeHtml(b.court_name)}</strong>
          <div style="font-size:11px; color:#64748B;">${b.sport_name} • Ngày: ${b.booking_date}</div>
        </td>
        <td><code>${escapeHtml(b.time_slot)}</code></td>
        <td style="font-weight:700; color:#D94C26;">${formatMoney(b.fixed_price)}</td>
        <td><span class="badge ${b.status === 'CONFIRMED' ? 'badge-active' : b.status === 'PENDING' ? 'badge-warning' : 'badge-inactive'}">${b.status}</span></td>
        <td style="text-align:center;">
          ${b.status === 'PENDING' ? `
            <div style="display:flex; gap:4px; justify-content:center;">
              <button type="button" class="btn btn-primary btn-sm js-admin-confirm-booking" data-id="${b.id}" title="Duyệt yêu cầu">
                ✓ Duyệt
              </button>
              <button type="button" class="btn btn-danger btn-sm js-admin-reject-booking" data-id="${b.id}" title="Từ chối yêu cầu">
                ✕ Từ chối
              </button>
            </div>
          ` : `
            <span style="font-size:12px; color:#64748B;">Đã xử lý</span>
          `}
        </td>
      </tr>
    `).join("");
  }

  // 6. ADMIN XEM DANH SÁCH SÂN VÀ CA GIÁ CỐ ĐỊNH
  function renderAdminCourtsAndSlots() {
    const store = window.tsportStore;
    if (!store) return;

    const courtsTbody = document.getElementById("adminCourtsListTbody");
    const slotsTbody = document.getElementById("adminSlotsListTbody");

    if (courtsTbody) {
      const courts = store.getCourts();
      courtsTbody.innerHTML = courts.map((c) => `
        <tr>
          <td>#${c.id}</td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td><span class="badge badge-sport">${escapeHtml(c.sport_name)}</span></td>
          <td>${escapeHtml(c.surface || 'Chuẩn thi đấu')}</td>
          <td>${escapeHtml(c.address || '-')}</td>
        </tr>
      `).join("");
    }

    if (slotsTbody) {
      const slots = store.getSlots();
      const courts = store.getCourts();
      slotsTbody.innerHTML = slots.map((s) => {
        const court = courts.find((c) => c.id === s.court_id);
        return `
          <tr>
            <td>#${s.id}</td>
            <td><strong>${escapeHtml(court ? court.name : `#${s.court_id}`)}</strong></td>
            <td><code>${escapeHtml(s.time_slot)}</code></td>
            <td style="font-weight:800; color:#D94C26;">${formatMoney(s.fixed_price)}</td>
          </tr>
        `;
      }).join("");
    }
  }

  // GẮN CÁC SỰ KIỆN TƯƠNG TÁC
  function bindEvents() {
    // Thay đổi môn ở form đặt sân -> cập nhật danh sách sân & ca
    document.getElementById("bookingSportSelect")?.addEventListener("change", () => {
      renderBookingCourts();
      renderBookingSlots();
    });

    // Thay đổi sân -> cập nhật ca
    document.getElementById("bookingCourtSelect")?.addEventListener("change", () => {
      renderBookingSlots();
    });

    // Chọn Ca chơi
    document.getElementById("bookingSlotSelector")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-slot-btn");
      if (btn) {
        document.querySelectorAll(".js-slot-btn").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        selectedSlotId = Number(btn.dataset.slotId);
      }
    });

    // Khách Gửi yêu cầu đặt sân
    document.getElementById("formCustomerBooking")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const courtId = Number(document.getElementById("bookingCourtSelect")?.value);
      const bookingDate = document.getElementById("bookingDate")?.value;
      const name = document.getElementById("bookingCustomerName")?.value.trim();
      const phone = document.getElementById("bookingCustomerPhone")?.value.trim();
      const note = document.getElementById("bookingCustomerNote")?.value.trim() || "";

      if (!courtId || !selectedSlotId || !bookingDate) {
        alert("⚠️ Vui lòng chọn đầy đủ Sân, Ngày và Ca giờ chơi!");
        return;
      }

      try {
        const newBooking = store.createBooking({
          court_id: courtId,
          slot_id: selectedSlotId,
          booking_date: bookingDate,
          customer_name: name,
          phone,
          note
        });

        renderMyBookings();
        renderAdminBookingRequests();
        showToast(`Đã gửi yêu cầu đặt sân thành công! Mã yêu cầu: ${newBooking.booking_code}`, "success");
      } catch (err) {
        alert("⚠️ " + err.message);
      }
    });

    // Khách Hủy yêu cầu đặt sân
    document.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const cancelBtn = e.target.closest(".js-cancel-booking");
      if (cancelBtn) {
        if (confirm("Bạn có chắc chắn muốn hủy yêu cầu đặt sân này không?")) {
          try {
            store.cancelBooking(cancelBtn.dataset.id);
            renderMyBookings();
            renderAdminBookingRequests();
            showToast("Đã hủy yêu cầu đặt sân thành công!", "info");
          } catch (err) {
            alert("⚠️ " + err.message);
          }
        }
      }

      // Admin Duyệt yêu cầu
      const confirmBtn = e.target.closest(".js-admin-confirm-booking");
      if (confirmBtn) {
        store.updateBookingStatus(confirmBtn.dataset.id, "CONFIRMED");
        renderMyBookings();
        renderAdminBookingRequests();
        showToast("Đã duyệt yêu cầu đặt sân thành công!", "success");
      }

      // Admin Từ chối yêu cầu
      const rejectBtn = e.target.closest(".js-admin-reject-booking");
      if (rejectBtn) {
        const reason = prompt("Nhập lý do từ chối yêu cầu đặt sân (ví dụ: Sân đã kín, Sân đang bảo dưỡng định kỳ):", "Sân đang bảo dưỡng định kỳ");
        if (reason !== null) {
          store.updateBookingStatus(rejectBtn.dataset.id, "REJECTED", reason);
          renderMyBookings();
          renderAdminBookingRequests();
          showToast("Đã từ chối yêu cầu đặt sân", "info");
        }
      }
    });

    // Form Admin Tạo Sân Con mới
    document.getElementById("formAdminCreateCourt")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const name = document.getElementById("adminCourtName")?.value.trim();
      const sportId = Number(document.getElementById("adminCourtSport")?.value);
      const surface = document.getElementById("adminCourtSurface")?.value.trim();
      const addr = document.getElementById("adminCourtAddress")?.value.trim();

      try {
        store.saveCourt({ name, sport_id: sportId, surface, address: addr });
        closeModal("modalAdminCourtForm");
        renderBookingCourts();
        renderAdminCourtsAndSlots();
        showToast(`Đã tạo sân mới "${name}" thành công!`, "success");
      } catch (err) {
        alert("⚠️ " + err.message);
      }
    });

    // Form Admin Cấu hình Ca Giờ & Giá Cố Định
    document.getElementById("formAdminCreateSlot")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const courtId = Number(document.getElementById("adminSlotCourt")?.value);
      const timeSlot = document.getElementById("adminSlotTime")?.value.trim();
      const price = Number(document.getElementById("adminSlotPrice")?.value);

      try {
        store.saveSlot({ court_id: courtId, time_slot: timeSlot, fixed_price: price });
        closeModal("modalAdminSlotForm");
        renderBookingSlots();
        renderAdminCourtsAndSlots();
        showToast(`Đã cấu hình ca chơi "${timeSlot}" thành công!`, "success");
      } catch (err) {
        alert("⚠️ " + err.message);
      }
    });

    // Mở modal admin
    document.getElementById("btnOpenAdminAddCourt")?.addEventListener("click", () => openModal("modalAdminCourtForm"));
    document.getElementById("btnOpenAdminAddSlot")?.addEventListener("click", () => openModal("modalAdminSlotForm"));
  }

  document.addEventListener("DOMContentLoaded", initCourtsModule);
})();
