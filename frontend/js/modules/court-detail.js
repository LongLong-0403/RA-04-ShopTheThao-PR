/**
 * TSPORT — MODULE CHI TIẾT SÂN & ĐẶT CA CỐ ĐỊNH (COURT DETAIL FIGMA)
 * - Hiển thị hình sân, địa chỉ, thông tin mặt sân & tiện ích
 * - Chọn ngày đặt sân (7 ngày tới định dạng Thứ, DD/MM/YYYY)
 * - Hiển thị lưới ca 2 cột với trạng thái: Trống / Đang chọn / Đã được giữ / Đã đặt
 * - Xác nhận thông tin đặt sân & gửi yêu cầu lưu vào tsportStore.createBooking()
 */

(function () {
  let currentCourt = null;
  let selectedDateISO = "";
  let selectedSlotId = null;

  const DAYS_VI = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  function initCourtDetail() {
    initHeaderSearch();
    const store = window.tsportStore;
    if (!store) return;

    const params = typeof getUrlParams === "function" ? getUrlParams() : {};
    const courtId = Number(params.id) || 1;
    const courts = store.getCourts() || [];
    currentCourt = courts.find((c) => Number(c.id) === courtId) || courts[0];

    if (!currentCourt) {
      window.location.href = "courts.html";
      return;
    }

    renderCourtInfo(currentCourt);
    populateDateSelect();
    renderSlotsGrid();
    bindEvents();
  }

  function initHeaderSearch() {
    const form = document.getElementById("courtDetailSearchForm");
    const input = document.getElementById("courtDetailSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function renderCourtInfo(court) {
    document.title = `${court.name} | Tsport`;

    const bc = document.getElementById("cdBreadcrumbName");
    const title = document.getElementById("cdCourtName");
    const sub = document.getElementById("cdCourtSub");
    const img = document.getElementById("cdCourtImage");
    const amenities = document.getElementById("cdCourtAmenities");
    const hours = document.getElementById("cdCourtHours");

    if (bc) bc.textContent = court.name;
    if (title) title.textContent = court.name;
    if (sub) {
      const surface = court.surface || "Mặt sân tiêu chuẩn trong nhà";
      sub.textContent = `${court.address || "Hà Nội"} • ${surface}`;
    }

    if (img) {
      const fallback = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800";
      img.src = court.image_url || fallback;
      img.alt = court.name;
      img.onerror = () => {
        img.src = fallback;
      };
    }

    if (amenities) {
      amenities.textContent = `${court.surface || "Sân tiêu chuẩn"} • Có khu thay đồ & bãi gửi xe`;
    }
    if (hours && court.opening_hours) {
      hours.textContent = `Giờ hoạt động: ${court.opening_hours}`;
    }
  }

  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDMY(iso) {
    const parts = String(iso || "").split("-");
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function populateDateSelect() {
    const select = document.getElementById("cdDateSelect");
    if (!select) return;

    const today = new Date();
    const opts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = toISODate(d);
      const label = `${DAYS_VI[d.getDay()]}, ${formatDMY(iso)}`;
      opts.push(`<option value="${iso}">${label}</option>`);
    }
    select.innerHTML = opts.join("");
    selectedDateISO = select.value;
  }

  function getSlotsForCourt(courtId) {
    const store = window.tsportStore;
    const allSlots = (store && store.getSlots && store.getSlots()) || [];
    let slots = allSlots.filter((s) => Number(s.court_id) === Number(courtId));

    // Nếu sân chưa có cấu hình ca riêng, dùng bộ 4 ca tiêu chuẩn
    if (!slots.length) {
      slots = [
        { id: Number(`${courtId}01`), court_id: courtId, time_slot: "06:00 - 08:00", fixed_price: 120000 },
        { id: Number(`${courtId}02`), court_id: courtId, time_slot: "08:00 - 10:00", fixed_price: 150000 },
        { id: Number(`${courtId}03`), court_id: courtId, time_slot: "16:00 - 18:00", fixed_price: 180000 },
        { id: Number(`${courtId}04`), court_id: courtId, time_slot: "18:00 - 20:00", fixed_price: 200000 }
      ];
    }
    return slots;
  }

  function getSlotBookingState(courtId, slotId, dateISO) {
    const store = window.tsportStore;
    const bookings = (store && store.getBookings && store.getBookings()) || [];
    const match = bookings.find(
      (b) =>
        Number(b.court_id) === Number(courtId) &&
        Number(b.slot_id) === Number(slotId) &&
        String(b.booking_date) === String(dateISO) &&
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED"
    );
    if (!match) return "AVAILABLE";
    if (match.status === "CONFIRMED" || match.status === "COMPLETED") return "BOOKED";
    return "HELD";
  }

  function renderSlotsGrid() {
    const grid = document.getElementById("cdSlotsGrid");
    if (!grid || !currentCourt) return;

    const slots = getSlotsForCourt(currentCourt.id);

    // Nếu chưa chọn ca nào hoặc ca đã chọn không còn trống -> tự chọn ca trống đầu tiên
    const validSelected = slots.find(
      (s) => Number(s.id) === Number(selectedSlotId) && getSlotBookingState(currentCourt.id, s.id, selectedDateISO) === "AVAILABLE"
    );
    if (!validSelected) {
      const firstFree = slots.find((s) => getSlotBookingState(currentCourt.id, s.id, selectedDateISO) === "AVAILABLE");
      selectedSlotId = firstFree ? firstFree.id : null;
    }

    grid.innerHTML = slots
      .map((s) => {
        const state = getSlotBookingState(currentCourt.id, s.id, selectedDateISO);
        const isSelected = state === "AVAILABLE" && Number(s.id) === Number(selectedSlotId);
        const isDisabled = state !== "AVAILABLE";

        let stateLabel = "Trống";
        let stateClass = "";
        if (isSelected) {
          stateLabel = "Đang chọn";
          stateClass = "is-selected";
        } else if (state === "HELD") {
          stateLabel = "Đã được giữ";
          stateClass = "is-disabled";
        } else if (state === "BOOKED") {
          stateLabel = "Đã đặt";
          stateClass = "is-disabled";
        }

        return `
          <button
            type="button"
            class="ts-court-det-slot ${stateClass}"
            data-slot-id="${s.id}"
            ${isDisabled ? "disabled" : ""}
          >
            <span class="ts-court-det-slot-time">${escapeHtml(s.time_slot)}</span>
            <span class="ts-court-det-slot-meta">${formatMoneyVN(s.fixed_price)} • ${stateLabel}</span>
          </button>
        `;
      })
      .join("");

    updateSummaryCard(slots);
  }

  function updateSummaryCard(slots) {
    const courtDateEl = document.getElementById("cdSummaryCourtDate");
    const slotEl = document.getElementById("cdSummarySlot");
    const priceEl = document.getElementById("cdSummaryPrice");
    const submitBtn = document.getElementById("btnConfirmCourtBooking");

    const slot = slots.find((s) => Number(s.id) === Number(selectedSlotId));

    if (courtDateEl) {
      courtDateEl.textContent = `${currentCourt.name} • ${formatDMY(selectedDateISO)}`;
    }

    if (slot) {
      if (slotEl) slotEl.textContent = `Ca ${slot.time_slot}`;
      if (priceEl) priceEl.textContent = formatMoneyVN(slot.fixed_price);
      if (submitBtn) submitBtn.disabled = false;
    } else {
      if (slotEl) slotEl.textContent = "Tất cả ca trong ngày đã được giữ chỗ";
      if (priceEl) priceEl.textContent = "0đ";
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  function bindEvents() {
    document.getElementById("cdDateSelect")?.addEventListener("change", (e) => {
      selectedDateISO = e.target.value;
      selectedSlotId = null;
      renderSlotsGrid();
    });

    document.getElementById("cdSlotsGrid")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-court-det-slot");
      if (!btn || btn.disabled) return;
      selectedSlotId = Number(btn.dataset.slotId);
      renderSlotsGrid();
    });

    document.getElementById("btnConfirmCourtBooking")?.addEventListener("click", () => {
      if (!currentCourt || !selectedSlotId || !selectedDateISO) return;
      const store = window.tsportStore;
      if (!store) return;

      const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || {
        full_name: "Nguyễn Minh Anh",
        phone: "0901234567"
      };

      try {
        const bkg = store.createBooking({
          court_id: currentCourt.id,
          slot_id: selectedSlotId,
          booking_date: selectedDateISO,
          customer_name: user.full_name || "Khách hàng Tsport",
          phone: user.phone || "0901234567",
          note: ""
        });
        showToast(`Đã gửi yêu cầu đặt sân (${bkg.booking_code})! Ca đã được giữ chỗ.`, "success");
        selectedSlotId = null;
        renderSlotsGrid();
      } catch (err) {
        showToast(err.message || "Không thể gửi yêu cầu đặt sân.", "error");
      }
    });
  }

  function formatMoneyVN(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
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

  document.addEventListener("DOMContentLoaded", initCourtDetail);
})();
