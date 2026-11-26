/**
 * TSPORT — MODULE QUẢN LÝ SÂN & CA GIỜ (ADMIN COURTS & SLOTS FIGMA)
 * - Cột trái: Danh sách sân chọn trực tiếp + Thông tin sân + Thêm/Sửa sân
 * - Cột phải: Bảng Ca giờ của sân đang chọn + Form Thêm/Sửa ca cố định
 */

(function () {
  let selectedCourtId = null;
  let selectedSlotId = null;
  let editingCourtMode = "edit";

  let courts = [];
  let slots = [];
  let sports = [];

  async function initAdminCourts() {
    [courts, slots, sports] = await Promise.all([api.get('/courts/'), api.get('/slots/'), api.get('/sports')]);
    initTopbarControls();
    populateSportOptions();
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
  }

  function populateSportOptions() {
    const select = document.getElementById("admCourtSport");
    if (!select) return;
    select.innerHTML = sports
      .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
      .join("");
  }

  function formatMoneyVN(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function renderAll() {
    renderCourtsList();
    renderSelectedCourtInfo();
    renderSlotsTable();
    fillSlotForm();
  }

  function renderCourtsList() {
    const wrap = document.getElementById("admCourtsList");
    if (!wrap) return;

    if (selectedCourtId == null && courts.length) {
      selectedCourtId = courts[0].id;
    }

    wrap.innerHTML = courts
      .map((c) => {
        const isSelected = Number(c.id) === Number(selectedCourtId);
        const status = c.status || "ACTIVE";
        return `
          <button
            type="button"
            class="ts-adm-court-item ${isSelected ? "is-active" : ""}"
            data-court-id="${c.id}"
          >
            <div class="ts-adm-court-item-name">${escapeHtml(c.name)}</div>
            <div class="ts-adm-court-item-status">${escapeHtml(status)}</div>
          </button>
        `;
      })
      .join("");
  }

  function renderSelectedCourtInfo() {
    const court = courts.find((c) => Number(c.id) === Number(selectedCourtId));
    if (!court) return;

    const line1 = document.getElementById("admCourtMetaLine1");
    const line2 = document.getElementById("admCourtMetaLine2");
    const slotsHead = document.getElementById("admSlotsHeading");

    if (line1) {
      line1.textContent = `${court.name} • ${sports.find(sport => sport.id === court.sport_id)?.name || "—"} • ${court.address || "Hà Nội"}`;
    }
    if (line2) {
      line2.textContent = `${court.description || "Sân tiêu chuẩn"} • ${court.status || "ACTIVE"}`;
    }
    if (slotsHead) {
      slotsHead.textContent = `Ca giờ - ${court.name}`;
    }
  }

  function getSlotsForSelectedCourt() {
    if (!selectedCourtId) return [];
    return slots.filter((s) => Number(s.court_id) === Number(selectedCourtId));
  }

  function slotTime(slot) {
    return slot.start_time.slice(0, 5) + ' - ' + slot.end_time.slice(0, 5);
  }

  function renderSlotsTable() {
    const tbody = document.getElementById("admSlotsTbody");
    if (!tbody) return;

    const slots = getSlotsForSelectedCourt();
    if (selectedSlotId == null && slots.length) {
      selectedSlotId = slots[0].id;
    }

    if (slots.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding:26px 12px; color:#6B7280;">
            Chưa có ca giờ cố định cho sân này. Nhập biểu mẫu bên dưới để thêm.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = slots
      .map((s) => {
        const isSelected = Number(s.id) === Number(selectedSlotId);
        const isActive = (s.status || "ACTIVE") === "ACTIVE";
        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-slot-id="${s.id}">
            <td>${escapeHtml(slotTime(s))}</td>
            <td>${formatMoneyVN(s.price)}</td>
            <td>
              <span class="ts-orders-v2-status ${isActive ? "" : "is-cancelled"}">
                ${isActive ? "Hoạt động" : "Tạm ngưng"}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function fillSlotForm() {
    const slots = getSlotsForSelectedCourt();
    const slot = slots.find((s) => Number(s.id) === Number(selectedSlotId));

    const nameEl = document.getElementById("slotNameInput");
    const startEl = document.getElementById("slotStartInput");
    const endEl = document.getElementById("slotEndInput");
    const psEl = document.getElementById("slotPriceStatusInput");

    if (slot) {
      const timeMatch = String(slotTime(slot) || "").match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      const start = timeMatch ? timeMatch[1] : "16:00";
      const end = timeMatch ? timeMatch[2] : "18:00";
      if (nameEl) nameEl.value = slot.slot_name || `Ca: ${start} - ${end}`;
      if (startEl) startEl.value = start;
      if (endEl) endEl.value = end;
      if (psEl) psEl.value = `${formatMoneyVN(slot.price)} / ${slot.status || "ACTIVE"}`;
    } else {
      if (nameEl) nameEl.value = "";
      if (startEl) startEl.value = "16:00";
      if (endEl) endEl.value = "18:00";
      if (psEl) psEl.value = "180.000đ / ACTIVE";
    }
  }

  function openCourtModal(mode) {
    editingCourtMode = mode;
    const titleEl = document.getElementById("modalAdmCourtTitle");
    const nameEl = document.getElementById("admCourtName");
    const sportEl = document.getElementById("admCourtSport");
    const statusEl = document.getElementById("admCourtStatus");
    const addrEl = document.getElementById("admCourtAddress");
    const surfEl = document.getElementById("admCourtSurface");

    if (mode === "edit" && selectedCourtId) {
      const court = courts.find((c) => Number(c.id) === Number(selectedCourtId));
      if (court) {
        if (titleEl) titleEl.textContent = "Sửa thông tin sân";
        if (nameEl) nameEl.value = court.name || "";
        if (sportEl) sportEl.value = String(court.sport_id || 1);
        if (statusEl) statusEl.value = court.status || "ACTIVE";
        if (addrEl) addrEl.value = court.address || "";
        if (surfEl) surfEl.value = court.description || "";
      }
    } else {
      if (titleEl) titleEl.textContent = "Thêm sân mới";
      document.getElementById("formAdmCourt")?.reset();
      if (statusEl) statusEl.value = "ACTIVE";
    }

    openModal("modalAdmCourt");
  }

  function bindEvents() {
    document.getElementById("admCourtsList")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-adm-court-item");
      if (!btn) return;
      selectedCourtId = Number(btn.dataset.courtId);
      selectedSlotId = null;
      renderAll();
    });

    document.getElementById("admSlotsTbody")?.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-slot-id]");
      if (!row) return;
      selectedSlotId = Number(row.dataset.slotId);
      renderSlotsTable();
      fillSlotForm();
    });

    document.getElementById("btnAdmNewSlot")?.addEventListener("click", () => {
      selectedSlotId = -1;
      renderSlotsTable();
      fillSlotForm();
      document.getElementById("slotNameInput")?.focus();
    });

    document.getElementById("btnAdmAddCourt")?.addEventListener("click", () => openCourtModal("add"));
    document.getElementById("btnAdmEditCourt")?.addEventListener("click", () => openCourtModal("edit"));

    // Lưu ca giờ cố định
    document.getElementById("formAdmSlot")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!selectedCourtId) return;

      const slotName = document.getElementById("slotNameInput")?.value.trim() || "";
      const start = document.getElementById("slotStartInput")?.value.trim() || "16:00";
      const end = document.getElementById("slotEndInput")?.value.trim() || "18:00";
      const psRaw = document.getElementById("slotPriceStatusInput")?.value.trim() || "";

      const priceDigits = psRaw.split("/")[0].replace(/[^\d]/g, "");
      const fixed_price = priceDigits ? Number(priceDigits) : 150000;
      const statusPart = (psRaw.split("/")[1] || "ACTIVE").trim().toUpperCase();
      const status = statusPart === "INACTIVE" ? "INACTIVE" : "ACTIVE";
      const payload = { court_id: selectedCourtId, slot_name: slotName, start_time: start,
        end_time: end, price: fixed_price, status };
      const existing = slots.find(slot => slot.id === selectedSlotId);
      try {
        const saved = existing ? await api.put("/slots/" + existing.id, payload) : await api.post("/slots", payload);
        slots = existing ? slots.map(slot => slot.id === saved.id ? saved : slot) : [...slots, saved];
        selectedSlotId = saved.id;
        showToast("Đã lưu ca giờ.", "success");
      } catch (error) {
        showToast(error.message, "error");
        return;
      }
      renderSlotsTable();
      fillSlotForm();
    });

    // Lưu thêm / sửa thông tin sân
    document.getElementById("formAdmCourt")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("admCourtName")?.value.trim();
      const sport_id = Number(document.getElementById("admCourtSport")?.value) || 1;
      const status = document.getElementById("admCourtStatus")?.value || "ACTIVE";
      const address = document.getElementById("admCourtAddress")?.value.trim() || "";
      const surface = document.getElementById("admCourtSurface")?.value.trim() || "Sân tiêu chuẩn";

      if (!name) return;

      const payload = { name, sport_id, address, description: surface, status };
      const existing = editingCourtMode === "edit" && selectedCourtId;
      try {
        const saved = existing ? await api.put("/courts/" + existing, payload) : await api.post("/courts", payload);
        courts = existing ? courts.map(court => court.id === saved.id ? saved : court) : [saved, ...courts];
        selectedCourtId = saved.id;
        if (!existing) selectedSlotId = null;
        showToast("Đã lưu sân.", "success");
      } catch (error) {
        showToast(error.message, "error");
        return;
      }
      closeModal("modalAdmCourt");
      renderAll();
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminCourts));
})();
