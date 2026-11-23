/**
 * TSPORT — MODULE GHÉP KÈO THỂ THAO TỐI GIẢN (COMMUNITY V2 FIGMA)
 * - Lọc theo Môn thể thao, Thời gian (ngày) và Trình độ
 * - Lưới 2 cột thẻ bài đăng (Đang tìm đối / Đã đủ người, ngày/giờ, địa điểm + trình độ, liên hệ)
 * - Đăng bài mới, Sửa bài (có kiểm tra quyền), Xin tham gia, Duyệt/Từ chối & Tự đóng khi đủ người
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

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    } catch (_e) {
      return null;
    }
  }

  function getActorKey(user) {
    if (!user) return "";
    if (user.id) return `id:${user.id}`;
    const phone = String(user.phone || "").replace(/\D/g, "");
    if (phone) return `phone:${phone}`;
    const name = String(user.full_name || user.name || "").trim().toLowerCase();
    return name ? `name:${name}` : "";
  }

  function isMatchOwner(match) {
    if (!match) return false;
    const user = getCurrentUser();
    if (!user) return true; // Chạy local chưa đăng nhập: cho phép thao tác chủ bài để test nhanh
    const role = String(user.role || "").toUpperCase();
    if (role === "ADMIN") return true;

    const currentPhone = String(user.phone || "").replace(/\D/g, "");
    const matchPhone = String(match.contact_phone || "").replace(/\D/g, "");
    if (currentPhone && matchPhone && currentPhone === matchPhone) return true;

    if (user.id && match.user_id && Number(user.id) === Number(match.user_id)) return true;

    const currentName = String(user.full_name || user.name || "").trim().toLowerCase();
    const contactName = String(match.contact_name || "").trim().toLowerCase();
    if (currentName && contactName && currentName === contactName) return true;

    return false;
  }

  function canEditMatch(match) {
    return isMatchOwner(match);
  }

  function ensureJoinState(match) {
    const slotsNeeded = Math.max(1, Number(match.slots_needed) || 2);
    const joinRequests = Array.isArray(match.join_requests) ? match.join_requests : [];
    const acceptedCount = joinRequests.filter((r) => r.status === "ACCEPTED").length;
    return { slotsNeeded, joinRequests, acceptedCount };
  }

  function syncMatchCapacityStatus(store, match) {
    if (!store || !match) return;
    const { slotsNeeded, acceptedCount } = ensureJoinState(match);
    if (acceptedCount >= slotsNeeded && match.status !== "CLOSED") {
      match.status = "CLOSED";
      store.save();
    }
  }

  function showListView() {
    currentEditingMatchId = null;
    const listView = document.getElementById("communityListView");
    const createView = document.getElementById("communityCreateView");
    if (listView) listView.style.display = "block";
    if (createView) createView.style.display = "none";
    document.title = "Ghép kèo thể thao | Tsport";
    renderMatchesList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showCreateView(matchToEdit = null) {
    const form = document.getElementById("formMatch");
    const headingEl = document.querySelector("#communityCreateView .ts-comm-create-head .ts-comm-v2-title");
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (matchToEdit) {
      currentEditingMatchId = Number(matchToEdit.id);
      if (headingEl) headingEl.textContent = "Chỉnh sửa bài tìm đối";
      if (submitBtn) submitBtn.textContent = "Lưu cập nhật bài kèo";

      const sportEl = document.getElementById("matchSportId");
      const dtEl = document.getElementById("matchDateTime");
      const locEl = document.getElementById("matchLocation");
      const lvlEl = document.getElementById("matchLevel");
      const phoneEl = document.getElementById("matchContactPhone");

      if (sportEl && matchToEdit.sport_id) sportEl.value = String(matchToEdit.sport_id);
      if (dtEl) {
        const dmy = formatDMY(matchToEdit.match_date);
        const time = matchToEdit.match_time || "18:00";
        dtEl.value = `${dmy} ${time}`.trim();
      }
      if (locEl) locEl.value = matchToEdit.location || "";
      if (lvlEl && matchToEdit.level) lvlEl.value = matchToEdit.level;
      if (phoneEl) phoneEl.value = matchToEdit.contact_phone ? `${matchToEdit.contact_phone} / Zalo` : "";
    } else {
      currentEditingMatchId = null;
      if (headingEl) headingEl.textContent = "Đăng bài tìm đối";
      if (submitBtn) submitBtn.textContent = "Đăng bài ghép kèo";
      if (form) form.reset();

      const dtInput = document.getElementById("matchDateTime");
      if (dtInput && !dtInput.value) {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, "0");
        const m = String(today.getMonth() + 1).padStart(2, "0");
        dtInput.value = `${d}/${m}/${today.getFullYear()} 18:00`;
      }

      const user = getCurrentUser();
      const phoneEl = document.getElementById("matchContactPhone");
      if (phoneEl && !phoneEl.value && user && user.phone) {
        phoneEl.value = `${user.phone} / Zalo`;
      }
    }

    const listView = document.getElementById("communityListView");
    const createView = document.getElementById("communityCreateView");
    if (listView) listView.style.display = "none";
    if (createView) createView.style.display = "block";
    document.title = matchToEdit ? "Chỉnh sửa bài tìm đối | Tsport" : "Đăng bài tìm đối | Tsport";
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

  function renderJoinSection(match) {
    const { slotsNeeded, joinRequests, acceptedCount } = ensureJoinState(match);
    const isClosed = match.status === "CLOSED" || acceptedCount >= slotsNeeded;
    const user = getCurrentUser();
    const actorKey = getActorKey(user);
    const owner = isMatchOwner(match);

    const myRequest = actorKey
      ? joinRequests.find((r) => r.requester_key === actorKey)
      : null;

    const pendingRequests = joinRequests.filter((r) => r.status === "PENDING");
    const acceptedRequests = joinRequests.filter((r) => r.status === "ACCEPTED");

    let joinActionHtml = "";
    if (isClosed) {
      joinActionHtml = `<span style="font-size:12px; font-weight:700; color:#6B7280;">Đã đủ người (${acceptedCount}/${slotsNeeded})</span>`;
    } else if (myRequest && myRequest.status === "PENDING") {
      joinActionHtml = `<span style="font-size:12px; font-weight:700; color:#D97706;">Đã gửi yêu cầu (Chờ duyệt)</span>`;
    } else if (myRequest && myRequest.status === "ACCEPTED") {
      joinActionHtml = `<span style="font-size:12px; font-weight:700; color:#16A34A;">Đã được chấp nhận tham gia</span>`;
    } else {
      joinActionHtml = `
        <button type="button" class="ts-comm-v2-mini-btn js-join-match" data-id="${match.id}" style="font-weight:700;">
          Xin tham gia
        </button>
      `;
    }

    const ownerPendingHtml =
      owner && pendingRequests.length > 0
        ? `
          <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #E5E7EB;">
            <div style="font-size:12px; font-weight:700; color:#111827; margin-bottom:6px;">
              Yêu cầu xin tham gia (${pendingRequests.length} chờ duyệt):
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${pendingRequests
                .map(
                  (req) => `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; background:#F9FAFB; padding:6px 8px; border-radius:6px;">
                  <span>
                    <strong>${escapeHtml(req.requester_name)}</strong>
                    ${req.requester_phone ? ` • ${escapeHtml(req.requester_phone)}` : ""}
                  </span>
                  <span style="display:flex; gap:4px;">
                    <button type="button" class="ts-comm-v2-mini-btn js-accept-join" data-match-id="${match.id}" data-req-id="${escapeHtml(req.id)}" style="background:#16A34A; color:#fff; border-color:#16A34A;">
                      Chấp nhận
                    </button>
                    <button type="button" class="ts-comm-v2-mini-btn js-reject-join" data-match-id="${match.id}" data-req-id="${escapeHtml(req.id)}" style="color:#DC2626; border-color:#FCA5A5;">
                      Từ chối
                    </button>
                  </span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
        : "";

    const acceptedNamesHtml =
      acceptedRequests.length > 0
        ? `<div style="font-size:12px; color:#4B5563; margin-top:6px;">
             Đã tham gia (${acceptedCount}/${slotsNeeded}): <strong>${escapeHtml(acceptedRequests.map((r) => r.requester_name).join(", "))}</strong>
           </div>`
        : `<div style="font-size:12px; color:#6B7280; margin-top:6px;">
             Đã nhận: <strong>${acceptedCount}/${slotsNeeded}</strong> người
           </div>`;

    return `
      <div style="margin-top:10px; padding-top:10px; border-top:1px solid #F3F4F6;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <span style="font-size:12px; color:#374151;">Cần thêm: <strong>${slotsNeeded}</strong> người</span>
          ${joinActionHtml}
        </div>
        ${acceptedNamesHtml}
        ${ownerPendingHtml}
      </div>
    `;
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

    matches.forEach((m) => syncMatchCapacityStatus(store, m));

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
        const editable = canEditMatch(m);

        return `
          <article class="ts-comm-v2-card">
            <div class="ts-comm-v2-card-top">
              <span class="ts-comm-v2-pill ${isClosed ? "is-closed" : ""}">
                ${isClosed ? "Đã đủ người" : "Đang tìm đối"}
              </span>
              <div class="ts-comm-v2-card-actions">
                ${editable ? `<button type="button" class="ts-comm-v2-mini-btn js-edit-match" data-id="${m.id}">Sửa</button>` : ""}
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

            ${renderJoinSection(m)}
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

    const isEditing = Boolean(currentEditingMatchId);
    const existingMatch =
      isEditing && typeof store.getMatchById === "function"
        ? store.getMatchById(currentEditingMatchId)
        : null;

    if (isEditing && existingMatch && !canEditMatch(existingMatch)) {
      if (typeof showToast === "function") {
        showToast("Bạn không có quyền chỉnh sửa bài tìm bạn này.", "error");
      }
      return;
    }

    const sportId = Number(document.getElementById("matchSportId").value);
    const sportObj = store.getSports().find((s) => Number(s.id) === sportId);
    const sportName = sportObj ? sportObj.name : "Thể thao";
    const dt = parseDateTimeInput(document.getElementById("matchDateTime")?.value);
    const location = document.getElementById("matchLocation").value.trim();
    const level = document.getElementById("matchLevel").value;
    const contactRaw = document.getElementById("matchContactPhone").value.trim();
    const user = getCurrentUser();

    const data = {
      id: currentEditingMatchId,
      title: `Giao lưu ${sportName} - ${location.split(",")[0]}`,
      sport_id: sportId,
      match_date: dt.match_date,
      match_time: dt.match_time,
      location,
      slots_needed: existingMatch?.slots_needed || 2,
      level,
      price_share: existingMatch?.price_share || "Chia đều sân",
      contact_name: existingMatch?.contact_name || (user && user.full_name) || "Thành viên Tsport",
      contact_phone: contactRaw.replace(/\s*\/\s*zalo/i, "").trim(),
      description: existingMatch?.description || "",
      join_requests: existingMatch?.join_requests || []
    };

    try {
      store.saveMatch(data);

      if (!isEditing && window.api && (localStorage.getItem("token") || localStorage.getItem("tsport_token"))) {
        const hhmm = /^\d{1,2}:\d{2}/.test(dt.match_time) ? dt.match_time.slice(0, 5) : "18:00";
        window.api
          .post("/match-posts", {
            sport_id: sportId,
            match_time: `${dt.match_date}T${hhmm}:00`,
            location,
            skill_level: level,
            contact_info: contactRaw
          })
          .catch(() => {});
      }

      const fSport = document.getElementById("filterMatchSport");
      const fDate = document.getElementById("filterMatchDate");
      const fLevel = document.getElementById("filterMatchLevel");
      if (fSport) fSport.value = "ALL";
      if (fDate) fDate.value = "";
      if (fLevel) fLevel.value = "ALL";

      if (typeof showToast === "function") {
        showToast(isEditing ? "Đã cập nhật bài ghép kèo thành công!" : "Đã đăng bài ghép kèo thành công!", "success");
      }
      showListView();
    } catch (err) {
      if (typeof showToast === "function") {
        showToast(err.message || "Không thể lưu bài lúc này.", "error");
      }
    }
  }

  function handleJoinRequest(store, matchId) {
    const match = typeof store.getMatchById === "function" ? store.getMatchById(matchId) : null;
    if (!match) return;

    const { slotsNeeded, joinRequests, acceptedCount } = ensureJoinState(match);
    if (match.status === "CLOSED" || acceptedCount >= slotsNeeded) {
      if (typeof showToast === "function") showToast("Bài tìm bạn đã đủ người hoặc đã đóng.", "info");
      return;
    }

    const user = getCurrentUser();
    let requesterName = user?.full_name || user?.name || "";
    let requesterPhone = user?.phone || "";

    if (!requesterName) {
      requesterName = (prompt("Nhập tên của bạn để xin tham gia:") || "").trim();
      if (!requesterName) return;
      requesterPhone = (prompt("Nhập số điện thoại / Zalo liên hệ (tuỳ chọn):") || "").trim();
    }

    const reqKey =
      getActorKey(user) ||
      (requesterPhone ? `phone:${requesterPhone.replace(/\D/g, "")}` : `name:${requesterName.toLowerCase()}`);

    const existed = joinRequests.find((r) => r.requester_key === reqKey && r.status !== "REJECTED");
    if (existed) {
      if (typeof showToast === "function") showToast("Bạn đã gửi yêu cầu tham gia bài này rồi.", "info");
      return;
    }

    match.join_requests = [
      ...joinRequests,
      {
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        requester_key: reqKey,
        requester_name: requesterName,
        requester_phone: requesterPhone,
        status: "PENDING",
        created_at: new Date().toISOString()
      }
    ];
    store.save();
    renderMatchesList();
    if (typeof showToast === "function") {
      showToast("Đã gửi yêu cầu xin tham gia, chờ chủ bài duyệt.", "success");
    }
  }

  function handleReviewJoinRequest(store, matchId, reqId, decision) {
    const match = typeof store.getMatchById === "function" ? store.getMatchById(matchId) : null;
    if (!match) return;

    if (!isMatchOwner(match)) {
      if (typeof showToast === "function") showToast("Chỉ chủ bài mới có quyền duyệt yêu cầu.", "error");
      return;
    }

    const list = Array.isArray(match.join_requests) ? match.join_requests : [];
    const target = list.find((r) => String(r.id) === String(reqId));
    if (!target || target.status !== "PENDING") return;

    const slotsNeeded = Math.max(1, Number(match.slots_needed) || 2);
    const currentAccepted = list.filter((r) => r.status === "ACCEPTED").length;

    if (decision === "ACCEPTED" && currentAccepted >= slotsNeeded) {
      match.status = "CLOSED";
      store.save();
      renderMatchesList();
      if (typeof showToast === "function") showToast("Bài đã đủ người và tự động đóng.", "info");
      return;
    }

    target.status = decision;
    const nextAccepted = list.filter((r) => r.status === "ACCEPTED").length;
    const autoClosed = nextAccepted >= slotsNeeded;
    if (autoClosed) {
      match.status = "CLOSED";
    }

    match.join_requests = list;
    store.save();
    renderMatchesList();

    if (typeof showToast === "function") {
      if (decision === "ACCEPTED") {
        showToast(
          autoClosed
            ? "Đã chấp nhận — Bài đủ người nên tự động đóng!"
            : "Đã chấp nhận yêu cầu tham gia.",
          "success"
        );
      } else {
        showToast("Đã từ chối yêu cầu tham gia.", "info");
      }
    }
  }

  function bindEvents() {
    document.getElementById("filterMatchSport")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchDate")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchLevel")?.addEventListener("change", renderMatchesList);
    document.getElementById("btnApplyMatchFilter")?.addEventListener("click", renderMatchesList);

    document.getElementById("btnOpenCreateMatch")?.addEventListener("click", () => showCreateView(null));
    document.getElementById("btnBackToMatchesList")?.addEventListener("click", (e) => {
      e.preventDefault();
      showListView();
    });
    document.getElementById("formMatch")?.addEventListener("submit", handleMatchSubmit);

    document.getElementById("matchesGrid")?.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const joinBtn = e.target.closest(".js-join-match");
      if (joinBtn) {
        handleJoinRequest(store, Number(joinBtn.dataset.id));
        return;
      }

      const acceptBtn = e.target.closest(".js-accept-join");
      if (acceptBtn) {
        handleReviewJoinRequest(
          store,
          Number(acceptBtn.dataset.matchId),
          acceptBtn.dataset.reqId,
          "ACCEPTED"
        );
        return;
      }

      const rejectBtn = e.target.closest(".js-reject-join");
      if (rejectBtn) {
        handleReviewJoinRequest(
          store,
          Number(rejectBtn.dataset.matchId),
          rejectBtn.dataset.reqId,
          "REJECTED"
        );
        return;
      }

      const editBtn = e.target.closest(".js-edit-match");
      if (editBtn) {
        const match = typeof store.getMatchById === "function" ? store.getMatchById(editBtn.dataset.id) : null;
        if (!match) return;
        if (!canEditMatch(match)) {
          if (typeof showToast === "function") {
            showToast("Bạn không có quyền sửa bài tìm bạn này.", "error");
          }
          return;
        }
        showCreateView(match);
        return;
      }

      const closeBtn = e.target.closest(".js-close-match");
      if (closeBtn) {
        store.closeMatch(closeBtn.dataset.id);
        renderMatchesList();
        if (typeof showToast === "function") {
          showToast("Đã chuyển bài đăng sang trạng thái Đã đủ người.", "info");
        }
        return;
      }

      const delBtn = e.target.closest(".js-delete-match");
      if (delBtn) {
        if (confirm("Bạn có chắc muốn xóa bài đăng tìm kèo này?")) {
          store.deleteMatch(delBtn.dataset.id);
          renderMatchesList();
          if (typeof showToast === "function") {
            showToast("Đã xóa bài đăng.", "success");
          }
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