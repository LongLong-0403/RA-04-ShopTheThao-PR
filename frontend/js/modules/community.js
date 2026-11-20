/**
 * TSPORT — MODULE GHÉP KÈO THỂ THAO TỐI GIẢN (COMMUNITY V2 FIGMA)
 * - Lọc theo Môn thể thao, Thời gian (ngày) và Trình độ
 * - Lưới 2 cột thẻ bài đăng sạch gọn (Đang tìm đối, tiêu đề, ngày/giờ, địa điểm + trình độ, liên hệ)
 * - Đăng bài mới, Đóng bài hoặc Xóa bài
 */

(function () {
  let currentEditingMatchId = null;

  function initCommunityModule() {
    initHeaderSearch();
    renderSportFilterOptions();
    renderMatchesList();
    bindEvents();
  }

  function initHeaderSearch() {
    const form = document.getElementById("commHeaderSearchForm");
    const input = document.getElementById("commHeaderSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function renderSportFilterOptions() {
    const store = window.tsportStore;
    const sportSelect = document.getElementById("filterMatchSport");
    const formSportSelect = document.getElementById("matchSportId");
    if (!store) return;

    const sports = store.getSports() || [];
    if (sportSelect) {
      sportSelect.innerHTML =
        `<option value="ALL">Tất cả môn</option>` +
        sports.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
    if (formSportSelect) {
      formSportSelect.innerHTML = sports
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join("");
    }
  }

  function formatDMY(iso) {
    const parts = String(iso || "").split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso || "";
  }

  function renderMatchesList() {
    const grid = document.getElementById("matchesGrid");
    const store = window.tsportStore;
    if (!grid || !store) return;

    const sportId = document.getElementById("filterMatchSport")?.value || "ALL";
    const date = document.getElementById("filterMatchDate")?.value || "";
    const levelFilter = document.getElementById("filterMatchLevel")?.value || "ALL";

    let matches = store.getMatches({
      sport_id: sportId,
      date,
      showHidden: false
    });

    if (levelFilter !== "ALL") {
      matches = matches.filter((m) =>
        String(m.level || "").toLowerCase().includes(levelFilter.toLowerCase())
      );
    }

    if (matches.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px; padding:48px 24px; text-align:center;">
          <h3 style="font-size:17px; font-weight:800; color:#111827; margin:0 0 8px 0;">Không tìm thấy bài đăng phù hợp</h3>
          <p style="font-size:13px; color:#6B7280; margin:0;">Hãy thử chọn môn thể thao, ngày hoặc trình độ khác.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = matches
      .map((m) => {
        const isClosed = m.status === "CLOSED";
        const dateStr = formatDMY(m.match_date);
        const timeStr = m.match_time || "18:00";
        const levelStr = m.level || "Trung bình";
        const phone = m.contact_phone || "0901234567";

        return `
          <article class="ts-comm-v2-card">
            <div class="ts-comm-v2-card-top">
              <span class="ts-comm-v2-pill ${isClosed ? "is-closed" : ""}">
                ${isClosed ? "Đã đủ người" : "Đang tìm đối"}
              </span>
              <div class="ts-comm-v2-card-actions">
                ${!isClosed ? `<button type="button" class="ts-comm-v2-mini-btn js-close-match" data-id="${m.id}">Đóng bài</button>` : ""}
                <button type="button" class="ts-comm-v2-mini-btn js-delete-match" data-id="${m.id}">Xóa</button>
              </div>
            </div>

            <h3 class="ts-comm-v2-card-title">${escapeHtml(m.title)}</h3>
            <div class="ts-comm-v2-meta-line">${escapeHtml(dateStr)} • ${escapeHtml(timeStr)}</div>
            <div class="ts-comm-v2-meta-line">${escapeHtml(m.location || "Hà Nội")} • Trình độ: ${escapeHtml(levelStr)}</div>

            <div class="ts-comm-v2-contact-row">
              <div class="ts-comm-v2-contact">
                Liên hệ: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a> / Zalo
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function openCreateModal() {
    currentEditingMatchId = null;
    const form = document.getElementById("formMatch");
    if (form) form.reset();

    const dateInput = document.getElementById("matchDate");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }

    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    if (user) {
      const nameEl = document.getElementById("matchContactName");
      const phoneEl = document.getElementById("matchContactPhone");
      if (nameEl) nameEl.value = user.full_name || "";
      if (phoneEl) phoneEl.value = user.phone || "";
    }

    openModal("modalMatchForm");
  }

  function handleMatchSubmit(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store) return;

    const data = {
      id: currentEditingMatchId,
      title: document.getElementById("matchTitle").value.trim(),
      sport_id: Number(document.getElementById("matchSportId").value),
      match_date: document.getElementById("matchDate").value,
      match_time: document.getElementById("matchTime").value.trim(),
      location: document.getElementById("matchLocation").value.trim(),
      slots_needed: Number(document.getElementById("matchSlots")?.value) || 2,
      level: document.getElementById("matchLevel").value,
      price_share: document.getElementById("matchPriceShare")?.value || "Chia đều sân",
      contact_name: document.getElementById("matchContactName").value.trim(),
      contact_phone: document.getElementById("matchContactPhone").value.trim(),
      description: document.getElementById("matchDesc")?.value || ""
    };

    try {
      store.saveMatch(data);
      closeModal("modalMatchForm");
      renderMatchesList();
      showToast("Đã đăng bài tìm kèo thành công!", "success");
    } catch (err) {
      showToast(err.message || "Không thể đăng bài lúc này.", "error");
    }
  }

  function bindEvents() {
    document.getElementById("filterMatchSport")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchDate")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchLevel")?.addEventListener("change", renderMatchesList);
    document.getElementById("btnApplyMatchFilter")?.addEventListener("click", renderMatchesList);

    document.getElementById("btnOpenCreateMatch")?.addEventListener("click", openCreateModal);
    document.getElementById("formMatch")?.addEventListener("submit", handleMatchSubmit);

    document.getElementById("matchesGrid")?.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const closeBtn = e.target.closest(".js-close-match");
      if (closeBtn) {
        store.closeMatch(closeBtn.dataset.id);
        renderMatchesList();
        showToast("Đã chuyển bài đăng sang trạng thái Đã đủ người.", "info");
        return;
      }

      const delBtn = e.target.closest(".js-delete-match");
      if (delBtn) {
        if (confirm("Bạn có chắc muốn xóa bài đăng tìm kèo này?")) {
          store.deleteMatch(delBtn.dataset.id);
          renderMatchesList();
          showToast("Đã xóa bài đăng.", "success");
        }
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

  document.addEventListener("DOMContentLoaded", initCommunityModule);
})();
