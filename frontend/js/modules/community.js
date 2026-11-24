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

    const params = typeof getUrlParams === "function" ? getUrlParams() : {};
    if (params.create === "1") {
      showCreateView();
    }
  }

  function showListView() {
    const listView = document.getElementById("communityListView");
    const createView = document.getElementById("communityCreateView");
    if (listView) listView.style.display = "block";
    if (createView) createView.style.display = "none";
    document.title = "Ghép kèo thể thao | Tsport";
    renderMatchesList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showCreateView() {
    currentEditingMatchId = null;
    const form = document.getElementById("formMatch");
    if (form) form.reset();

    const dtInput = document.getElementById("matchDateTime");
    if (dtInput && !dtInput.value) {
      const today = new Date();
      const d = String(today.getDate()).padStart(2, "0");
      const m = String(today.getMonth() + 1).padStart(2, "0");
      dtInput.value = `${d}/${m}/${today.getFullYear()} 18:00`;
    }

    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    const phoneEl = document.getElementById("matchContactPhone");
    if (phoneEl && !phoneEl.value && user && user.phone) {
      phoneEl.value = `${user.phone} / Zalo`;
    }

    const listView = document.getElementById("communityListView");
    const createView = document.getElementById("communityCreateView");
    if (listView) listView.style.display = "none";
    if (createView) createView.style.display = "block";
    document.title = "Đăng bài tìm đối | Tsport";
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  async function renderMatchesList() {
    const grid = document.getElementById("matchesGrid");
    const store = window.tsportStore;
    if (!grid || !store) return;

    const sportId = document.getElementById("filterMatchSport")?.value || "ALL";
    const date = document.getElementById("filterMatchDate")?.value || "";
    const levelFilter = document.getElementById("filterMatchLevel")?.value || "ALL";

    let matches;
    try { matches = (await api.get("/match-posts", sportId === "ALL" ? {} : {sport_id: sportId})).map(matchView).filter(m => !date || m.match_date === date); }
    catch (err) { showToast(err.message, "error"); return; }

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
        const isClosed = m.status !== "OPEN";
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
              <div class="ts-comm-v2-card-actions" ${Number(m.user_id) === Number(JSON.parse(localStorage.getItem("tsport_current_user") || "null")?.id) ? "" : "hidden"}>
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

  function parseDateTimeInput(raw) {
    const text = String(raw || "").trim();
    const parts = text.split(/\s+/);
    let isoDate = new Date().toISOString().split("T")[0];
    let timeStr = "18:00";

    if (parts[0]) {
      const dmy = parts[0].split("/");
      if (dmy.length === 3) {
        isoDate = `${dmy[2]}-${dmy[1].padStart(2, "0")}-${dmy[0].padStart(2, "0")}`;
      } else if (parts[0].includes("-")) {
        isoDate = parts[0];
      }
    }
    if (parts[1]) timeStr = parts[1];
    return { match_date: isoDate, match_time: timeStr };
  }

  async function handleMatchSubmit(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store) return;

    const sportId = Number(document.getElementById("matchSportId").value);
    const sportObj = store.getSports().find((s) => Number(s.id) === sportId);
    const sportName = sportObj ? sportObj.name : "Thể thao";
    const dt = parseDateTimeInput(document.getElementById("matchDateTime")?.value);
    const location = document.getElementById("matchLocation").value.trim();
    const level = document.getElementById("matchLevel").value;
    const contactRaw = document.getElementById("matchContactPhone").value.trim();
    try {
      await api.post("/match-posts", {sport_id:sportId, match_time:dt.match_date+"T"+dt.match_time+":00",
        location, skill_level:level, contact_info:contactRaw});

      // Reset bộ lọc để bài vừa đăng luôn hiển thị ngay đầu danh sách
      const fSport = document.getElementById("filterMatchSport");
      const fDate = document.getElementById("filterMatchDate");
      const fLevel = document.getElementById("filterMatchLevel");
      if (fSport) fSport.value = "ALL";
      if (fDate) fDate.value = "";
      if (fLevel) fLevel.value = "ALL";

      showToast("Đã đăng bài ghép kèo thành công!", "success");
      showListView();
    } catch (err) {
      showToast(err.message || "Không thể đăng bài lúc này.", "error");
    }
  }

  function bindEvents() {
    document.getElementById("filterMatchSport")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchDate")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchLevel")?.addEventListener("change", renderMatchesList);
    document.getElementById("btnApplyMatchFilter")?.addEventListener("click", renderMatchesList);

    document.getElementById("btnOpenCreateMatch")?.addEventListener("click", showCreateView);
    document.getElementById("btnBackToMatchesList")?.addEventListener("click", (e) => {
      e.preventDefault();
      showListView();
    });
    document.getElementById("formMatch")?.addEventListener("submit", handleMatchSubmit);

    document.getElementById("matchesGrid")?.addEventListener("click", async (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const closeBtn = e.target.closest(".js-close-match");
      if (closeBtn) {
        try { await api.patch(`/match-posts/${closeBtn.dataset.id}/status`, {status: "CLOSED"}); }
        catch (err) { showToast(err.message, "error"); return; }
        renderMatchesList();
        showToast("Đã chuyển bài đăng sang trạng thái Đã đủ người.", "success");
        return;
      }

      const delBtn = e.target.closest(".js-delete-match");
      if (delBtn) {
        if (await confirmAction("Bạn có chắc muốn xóa bài đăng tìm kèo này?", "Xóa bài")) {
          try { await api.patch(`/match-posts/${delBtn.dataset.id}/status`, {status: "CANCELLED"}); }
        catch (err) { showToast(err.message, "error"); return; }
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
