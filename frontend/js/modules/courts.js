/**
 * TSPORT — MODULE ĐẶT SÂN THỂ THAO & QUẢN LÝ CA SÂN (COURT BOOKING)
 * Tính năng:
 * - Khách: Chọn Môn -> Chọn Sân -> Chọn Ngày -> Chọn Ca (Slot giá cố định) -> Gửi yêu cầu, xem trạng thái, Hủy khi còn Chờ duyệt
 * - Admin: Tạo sân / Tạo ca giá cố định, Danh sách yêu cầu đặt sân toàn hệ thống, Xác nhận / Từ chối / Hủy
 */

(function () {
  let selectedSlotId = null;
  let currentSportFilter = "ALL";
  let currentSearchKeyword = "";

  function initCourtsModule() {
    renderBookingSportOptions();
    renderBookingCourts();
    renderBookingSlots();
    renderCustomerCourtCards();
    renderMyBookings();
    renderAdminBookingRequests();
    renderAdminCourtsAndSlots();
    bindEvents();
  }

  // 0. RENDER LƯỚI KHUNG ẢNH CỤM SÂN (IMAGE 1 CHUẨN THIẾT KẾ)
  function renderCustomerCourtCards() {
    const grid = document.getElementById("customerCourtCardsGrid");
    const countLabel = document.getElementById("courtCountLabel");
    const store = window.tsportStore;
    if (!grid || !store) return;

    let courts = store.getCourts();
    if (currentSportFilter && currentSportFilter !== "ALL") {
      courts = courts.filter(c => c.sport_id === Number(currentSportFilter));
    }

    if (currentSearchKeyword) {
      courts = courts.filter(c => 
        (c.name && c.name.toLowerCase().includes(currentSearchKeyword)) ||
        (c.address && c.address.toLowerCase().includes(currentSearchKeyword)) ||
        (c.sport_name && c.sport_name.toLowerCase().includes(currentSearchKeyword))
      );
    }

    if (countLabel) {
      countLabel.textContent = `Đang hiển thị ${courts.length} cụm sân`;
    }

    if (courts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #fff; border-radius: 12px; border: 1px dashed #CBD5E1;">
          <div style="font-size: 36px; margin-bottom: 8px;">🏟️</div>
          <h3 style="font-size: 16px; font-weight: 800; color: #1E293B;">Không tìm thấy cụm sân phù hợp</h3>
          <p style="font-size: 13px; color: #64748B;">Vui lòng thử chọn môn thể thao khác hoặc xóa từ khóa tìm kiếm.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = courts.map(c => {
      const rating = c.rating ? Number(c.rating).toFixed(1) : "5.0";
      const distance = c.distance || "150m";
      const hours = c.opening_hours || "06:00 - 23:00";
      const img = c.image_url || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800";
      const logo = c.logo_url || "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120";

      return `
        <div class="tsport-court-card" data-court-id="${c.id}" data-sport-id="${c.sport_id}">
          <div class="tsport-court-media">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(c.name)}" loading="lazy" />
            
            <div class="tsport-court-overlay-top-left">
              <span class="tsport-court-badge-rating">⭐ ${rating}</span>
              <span class="tsport-court-badge-type">Đơn ngày</span>
              <span class="tsport-court-badge-event">Sự kiện</span>
            </div>

            <div class="tsport-court-overlay-top-right">
              <button type="button" class="tsport-court-btn-round js-btn-court-fav" title="Yêu thích">🤍</button>
              <button type="button" class="tsport-court-btn-round js-btn-court-map" data-court-name="${escapeHtml(c.name)}" data-court-addr="${escapeHtml(c.address || '')}" title="Chỉ đường">↗</button>
            </div>
          </div>

          <div class="tsport-court-body">
            <img class="tsport-court-avatar" src="${escapeHtml(logo)}" alt="Logo" onerror="this.src='https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120'" />
            <div class="tsport-court-info">
              <h3 class="tsport-court-title" title="${escapeHtml(c.name)}">
                <a href="court-detail.html?id=${c.id}" style="color:inherit; text-decoration:none;">${escapeHtml(c.name)}</a>
              </h3>
              <div class="tsport-court-meta" title="${escapeHtml(c.address || '')}">
                <span class="tsport-court-distance">[${escapeHtml(distance)}]</span>
                <span>${escapeHtml(c.address || '')}</span>
              </div>
              <div class="tsport-court-hours">
                <span>🕒</span>
                <span>${escapeHtml(hours)}</span>
              </div>
            </div>

            <div class="tsport-court-action">
              ${c.has_discount ? `<span class="tsport-court-promo-badge">${escapeHtml(c.discount_label || 'Ưu đãi')}</span>` : ''}
              <a href="court-detail.html?id=${c.id}" class="tsport-btn-book-court" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">
                ĐẶT LỊCH
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");
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

  // 3. RENDER CÁC CA CHƠI & BẢNG GIÁ CỐ ĐỊNH (KIỂM TRA CA BỊ CHIẾM)
  function renderBookingSlots() {
    const store = window.tsportStore;
    const courtId = document.getElementById("bookingCourtSelect")?.value;
    const slotWrap = document.getElementById("bookingSlotSelector");
    const bookingDate = document.getElementById("bookingDate")?.value || new Date().toISOString().split("T")[0];
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

    let firstAvailableSet = false;

    slotWrap.innerHTML = slots.map((s, idx) => {
      const isOccupied = store.isSlotOccupied(courtId, bookingDate, s.time_slot);
      const isSelectable = !isOccupied;
      const isFirstAvailable = isSelectable && !firstAvailableSet;
      if (isFirstAvailable) firstAvailableSet = true;

      return `
        <div class="tsport-slot-btn js-slot-btn ${isFirstAvailable ? 'is-active' : ''} ${isOccupied ? 'is-occupied' : ''}" 
             data-slot-id="${s.id}" 
             data-occupied="${isOccupied ? 'true' : 'false'}"
             style="${isOccupied ? 'opacity:0.5; background:#F1F5F9; border-color:#CBD5E1; cursor:not-allowed;' : ''}">
          <div class="tsport-slot-time">⏰ ${escapeHtml(s.time_slot)}</div>
          <div class="tsport-slot-price">${formatMoney(s.fixed_price)}</div>
          ${isOccupied ? '<div style="font-size:10px; color:#DC2626; font-weight:800; margin-top:4px;">🔒 ĐÃ KÍN CA</div>' : '<div style="font-size:10px; color:#16A34A; font-weight:700; margin-top:4px;">✓ Sẵn sàng</div>'}
        </div>
      `;
    }).join("");

    const firstActive = slotWrap.querySelector(".js-slot-btn.is-active");
    selectedSlotId = firstActive ? Number(firstActive.dataset.slotId) : null;
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
              <button type="button" class="btn btn-primary btn-sm js-admin-confirm-booking" data-id="${b.id}" data-version="${b.version || 1}" title="Duyệt yêu cầu và khóa ca sân">
                ✓ Duyệt
              </button>
              <button type="button" class="btn btn-danger btn-sm js-admin-reject-booking" data-id="${b.id}" title="Từ chối yêu cầu">
                ✕ Từ chối
              </button>
            </div>
          ` : b.status === 'CONFIRMED' ? `
            <button type="button" class="btn btn-secondary btn-sm js-admin-release-booking" data-id="${b.id}" style="color:#DC2626; border-color:#FCA5A5; font-size:11px;" title="Giải phóng ca sân về trạng thái sẵn sàng">
              🔓 Hủy / Giải phóng ca
            </button>
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
    // 1. Tab chọn môn thể thao (Image 2 style)
    const sportsTabs = document.querySelectorAll("#courtSportsTabs .tsport-sport-tab");
    sportsTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        sportsTabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        currentSportFilter = tab.dataset.sportId;
        renderCustomerCourtCards();
      });
    });

    // 2. Ô tìm kiếm cụm sân
    const searchInput = document.getElementById("courtSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentSearchKeyword = e.target.value.trim().toLowerCase();
        renderCustomerCourtCards();
      });
    }

    // 3. Xử lý tương tác trên Lưới cụm sân (ĐẶT LỊCH, Thả tim, Chỉ đường)
    document.addEventListener("click", (e) => {
      const bookBtn = e.target.closest(".js-btn-book-court");
      if (bookBtn) {
        const courtId = Number(bookBtn.dataset.courtId);
        const sportId = Number(bookBtn.dataset.sportId);

        const sportSelect = document.getElementById("bookingSportSelect");
        const courtSelect = document.getElementById("bookingCourtSelect");

        if (sportSelect) {
          sportSelect.value = sportId;
          renderBookingCourts();
        }
        if (courtSelect) {
          courtSelect.value = courtId;
          renderBookingSlots();
        }

        const formSection = document.getElementById("bookingFormSection");
        if (formSection) {
          formSection.scrollIntoView({ behavior: "smooth", block: "start" });
          formSection.style.transition = "background 0.5s ease";
          formSection.style.background = "#FFF7ED";
          setTimeout(() => {
            formSection.style.background = "transparent";
          }, 1500);
        }
        if (typeof showToast === "function") {
          showToast(`Đã chọn sân! Vui lòng chọn ca chơi & gửi yêu cầu.`, "info");
        }
      }

      const favBtn = e.target.closest(".js-btn-court-fav");
      if (favBtn) {
        if (favBtn.textContent === "🤍") {
          favBtn.textContent = "❤️";
          if (typeof showToast === "function") showToast("Đã lưu cụm sân vào danh sách yêu thích!", "success");
        } else {
          favBtn.textContent = "🤍";
          if (typeof showToast === "function") showToast("Đã bỏ lưu yêu thích.", "info");
        }
      }

      const mapBtn = e.target.closest(".js-btn-court-map");
      if (mapBtn) {
        const name = mapBtn.dataset.courtName || "Sân";
        const addr = mapBtn.dataset.courtAddr || "";
        if (typeof showToast === "function") showToast(`Chỉ đường tới: ${name} (${addr})`, "info");
      }
    });

    // Thay đổi môn ở form đặt sân -> cập nhật danh sách sân & ca
    document.getElementById("bookingSportSelect")?.addEventListener("change", () => {
      renderBookingCourts();
      renderBookingSlots();
    });

    // Thay đổi sân -> cập nhật ca
    document.getElementById("bookingCourtSelect")?.addEventListener("change", () => {
      renderBookingSlots();
    });

    // Thay đổi ngày -> cập nhật tình trạng ca trống / ca bị chiếm
    document.getElementById("bookingDate")?.addEventListener("change", () => {
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

      // Chọn ca giờ chơi
      const slotBtn = e.target.closest(".js-slot-btn");
      if (slotBtn) {
        if (slotBtn.dataset.occupied === "true") {
          alert("⚠️ Ca này đã có người đặt trước và được xác nhận! Vui lòng chọn ca khác hoặc ngày khác.");
          return;
        }
        document.querySelectorAll(".js-slot-btn").forEach(b => b.classList.remove("is-active"));
        slotBtn.classList.add("is-active");
        selectedSlotId = Number(slotBtn.dataset.slotId);
      }

      // Admin Duyệt yêu cầu (Kiểm tra xung đột 2 Admin đồng thời & Ca bị chiếm)
      const confirmBtn = e.target.closest(".js-admin-confirm-booking");
      if (confirmBtn) {
        const bookingId = Number(confirmBtn.dataset.id);
        const expectedVersion = Number(confirmBtn.dataset.version) || 1;
        try {
          store.adminConfirmBooking(bookingId, 1, expectedVersion);
          renderMyBookings();
          renderAdminBookingRequests();
          renderBookingSlots();
          showToast("✓ Đã duyệt yêu cầu đặt sân thành công (Khóa ca tránh trùng lịch)!", "success");
        } catch (err) {
          alert("⚠️ " + err.message);
          renderMyBookings();
          renderAdminBookingRequests();
          renderBookingSlots();
        }
      }

      // Admin Hủy / Giải phóng ca sân
      const releaseBtn = e.target.closest(".js-admin-release-booking");
      if (releaseBtn) {
        const bookingId = Number(releaseBtn.dataset.id);
        if (confirm("Bạn có chắc chắn muốn HỦY / GIẢI PHÓNG ca sân này về trạng thái sẵn sàng cho khách khác đặt không?")) {
          try {
            store.adminReleaseSlot(bookingId, "Admin giải phóng ca sân");
            renderMyBookings();
            renderAdminBookingRequests();
            renderBookingSlots();
            showToast("✓ Đã giải phóng ca sân thành công!", "success");
          } catch (err) {
            alert("⚠️ Lỗi: " + err.message);
          }
        }
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
