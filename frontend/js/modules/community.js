/** Ghép kèo: danh sách, đăng bài, chi tiết và đăng ký tham gia. */
(function () {
  const byId = (id) => document.getElementById(id);
  const futureDateFormat = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short", hourCycle: "h23"
  });
  let viewer = null;
  let lastListMarkup = "";
  let listRequest = 0;
  let detailRequest = 0;
  let detailLoading = false;
  let activeMatchId = null;
  let detailTrigger = null;
  let match = null;
  let participation = null;
  let participationToken = null;
  let detailAction = null;

  function setMessage(element, message, tone = "") {
    if (element.textContent !== message) element.textContent = message;
    element.hidden = !message;
    element.dataset.tone = tone;
  }

  function formatDate(iso) {
    return iso.split("-").reverse().join("/");
  }

  function sportName(id) {
    return window.tsportStore.getSports().find((sport) => sport.id === id)?.name || "Thể thao";
  }

  async function loadViewer() {
    const token = getSessionToken();
    if (!token) return null;
    try {
      const user = await api.get("/auth/me");
      return token === getSessionToken() ? user : null;
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  }

  async function refreshViewer() {
    const token = getSessionToken();
    const user = await loadViewer().catch(() => null);
    if (token === getSessionToken()) viewer = user;
  }

  function updateMatchFormatRules() {
    const isFootball = Number(byId("matchSportId").value) === 2;
    const format = byId("matchFormat");
    const players = byId("matchPlayersNeeded");
    for (const option of format.options) {
      option.disabled = option.hidden = isFootball !== (option.value === "Sân 7");
    }
    if (isFootball) format.value = "Sân 7";
    else if (format.value === "Sân 7") format.value = "Đơn";
    players.max = isFootball ? "6" : "7";
    if (Number(players.value) > Number(players.max)) players.value = players.max;
    byId("matchPlayersHint").textContent = `Có thể tuyển tối đa ${players.max} người ngoài người đăng.`;
  }

  function updateDateMinimum() {
    byId("matchDateTime").min = futureDateFormat.format(new Date(Date.now() + 60000)).replace(" ", "T");
  }

  function showListView() {
    byId("communityListView").hidden = false;
    byId("communityCreateView").hidden = true;
    const url = new URL(location.href);
    url.searchParams.delete("create");
    history.replaceState(history.state, "", url);
    document.title = "Ghép kèo thể thao | Tsport";
    renderMatchesList();
    window.scrollTo(0, 0);
  }

  async function showCreateView() {
    try {
      viewer = await loadViewer();
      if (!viewer) {
        location.href = "auth.html?create=1";
        return;
      }
      if (viewer.role !== "CUSTOMER") {
        showToast("Hãy dùng tài khoản khách hàng để đăng bài ghép kèo.", "error");
        return;
      }
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
    byId("formMatch").reset();
    updateMatchFormatRules();
    updateDateMinimum();
    byId("matchContactPhone").value = viewer.phone || "";
    setMessage(byId("matchCreateError"), "");
    byId("communityListView").hidden = true;
    byId("communityCreateView").hidden = false;
    document.title = "Đăng bài tìm đối | Tsport";
    window.scrollTo(0, 0);
    byId("matchSportId").focus({ preventScroll: true });
  }

  async function renderMatchesList(quiet = false) {
    const request = ++listRequest;
    const grid = byId("matchesGrid");
    const status = byId("matchListStatus");
    const retry = byId("matchListRetry");
    const sport = byId("filterMatchSport").value;
    const date = byId("filterMatchDate").value;
    const level = byId("filterMatchLevel").value;
    const availability = byId("filterMatchStatus").value;
    if (!quiet) {
      grid.setAttribute("aria-busy", "true");
      if (!lastListMarkup) setMessage(status, "Đang tải bài ghép kèo…");
      retry.hidden = true;
    }

    try {
      const rows = await api.get("/match-posts", sport === "ALL" ? {} : { sport_id: sport });
      if (request !== listRequest) return;
      const matches = rows.map(matchView).filter((item) =>
        (!date || item.match_date === date) &&
        (level === "ALL" || item.level === level) &&
        (availability === "ALL" || item.registration_status === availability)
      );
      const markup = matches.map(renderMatchCard).join("");
      if (markup !== lastListMarkup) {
        const focusedLink = grid.contains(document.activeElement) && document.activeElement.dataset.matchDetail;
        grid.innerHTML = markup;
        lastListMarkup = markup;
        if (focusedLink) grid.querySelector(`[data-match-detail="${focusedLink}"]`)?.focus({ preventScroll: true });
      }
      const filtered = sport !== "ALL" || date || level !== "ALL" || availability !== "ALL";
      setMessage(status, matches.length ? `${matches.length} kèo`
        : filtered ? "Không có kèo phù hợp. Hãy thử đổi hoặc xóa bộ lọc."
          : "Chưa có bài ghép kèo sắp tới.");
      retry.hidden = true;
    } catch (error) {
      if (request !== listRequest) return;
      setMessage(status, lastListMarkup
        ? "Chưa cập nhật được danh sách. Bạn đang xem kết quả lần tải trước."
        : "Không tải được danh sách ghép kèo.", "error");
      retry.hidden = false;
    } finally {
      if (request === listRequest) grid.removeAttribute("aria-busy");
    }
  }

  function renderMatchCard(item) {
    const isOpen = item.registration_status === "OPEN";
    const isOwner = viewer?.id === item.user_id;
    return `
      <article class="ts-comm-v2-card">
        <div class="ts-comm-v2-card-top">
          <span class="ts-comm-v2-pill" data-state="${item.registration_status}">${matchAvailability(item)}</span>
          <span class="ts-comm-card-sport">${escapeHtml(sportName(item.sport_id))}</span>
        </div>
        <h2 class="ts-comm-v2-card-title">${escapeHtml(item.location)}</h2>
        <p class="ts-comm-v2-meta-line">${escapeHtml(formatDate(item.match_date))} · ${escapeHtml(item.match_time)} · ${escapeHtml(item.match_format)}</p>
        <p class="ts-comm-v2-meta-line">Trình độ: ${escapeHtml(item.level)}</p>
        <div class="ts-comm-v2-contact-row">
          <a href="community.html?match=${item.id}" data-match-detail="${item.id}" class="ts-comm-button ts-comm-button-secondary">${isOwner ? "Quản lý kèo" : "Xem chi tiết"}</a>
          ${isOwner ? `<div class="ts-comm-v2-card-actions">
            ${isOpen ? '<button type="button" class="ts-comm-v2-mini-btn" data-match-action="CLOSED">Đóng bài</button>' : ""}
            <button type="button" class="ts-comm-v2-mini-btn" data-match-action="CANCELLED">Hủy bài</button>
          </div>` : ""}
        </div>
      </article>`;
  }

  function resetDetail() {
    match = null;
    participation = null;
    participationToken = null;
    detailAction = null;
    byId("matchDetailTitle").textContent = "Chi tiết kèo";
    byId("matchDetailSport").hidden = true;
    byId("matchDetailContent").hidden = true;
    byId("matchDetailRetry").hidden = true;
    byId("matchParticipantList").replaceChildren();
    byId("matchJoinForm").reset();
    byId("matchCapacityForm").reset();
    delete byId("matchRemainingSlots").dataset.edited;
    setMessage(byId("matchActionError"), "");
    setMessage(byId("matchDetailFeedback"), "Đang tải chi tiết kèo…");
  }

  function openMatchDetail(id, trigger = null) {
    const dialog = byId("matchDetailDialog");
    const url = new URL(location.href);
    url.searchParams.set("match", id);
    url.searchParams.delete("create");
    history.replaceState(history.state, "", url);
    activeMatchId = id;
    detailTrigger = trigger;
    resetDetail();
    if (!dialog.open) dialog.showModal();
    byId("matchDetailTitle").focus();
    refreshMatchDetail();
  }

  function renderMatchDetail(data, session, sessionError = "") {
    const isOpen = data.registration_status === "OPEN";
    const isOwner = session?.is_owner;
    const joined = session?.joined;
    const badge = byId("matchDetailBadge");
    byId("matchDetailTitle").textContent = data.location;
    byId("matchDetailSport").textContent = sportName(data.sport_id);
    byId("matchDetailSport").hidden = false;
    badge.textContent = matchAvailability(data);
    badge.dataset.state = data.registration_status;
    byId("matchDetailSummary").innerHTML = `
      <div><dt>Thời gian (giờ Việt Nam)</dt><dd>${escapeHtml(data.match_time)} · ${escapeHtml(formatDate(data.match_date))}</dd></div>
      <div><dt>Hình thức</dt><dd>${escapeHtml(data.match_format)}</dd></div>
      <div><dt>Trình độ</dt><dd>${escapeHtml(data.level)}</dd></div>
      <div><dt>Liên hệ chủ kèo</dt><dd>${escapeHtml(data.contact_phone)}</dd></div>`;
    const login = byId("matchJoinLogin");
    login.hidden = !isOpen || Boolean(session || sessionError);
    login.href = `auth.html?match=${encodeURIComponent(data.id)}`;
    byId("matchJoinForm").hidden = !isOpen || !session?.can_join || joined;
    byId("matchCapacityForm").hidden = !isOpen || !isOwner;
    byId("matchParticipants").hidden = !isOwner;
    const explanation = {
      FULL: "Kèo đã đủ người và đã ngừng nhận đăng ký.",
      CLOSED: "Chủ kèo đã đóng đăng ký.",
      EXPIRED: "Kèo đã qua giờ thi đấu."
    };
    setMessage(byId("matchJoinStatus"),
      joined ? "Bạn đã tham gia kèo này."
        : sessionError || explanation[data.registration_status] ||
          (session && !session.can_join && !isOwner ? "Hãy dùng tài khoản khách hàng để tham gia." : ""),
      joined ? "success" : sessionError ? "error" : ""
    );
    if (isOwner) {
      const slots = byId("matchRemainingSlots");
      slots.max = Math.max(0, (data.sport_id === 2 ? 6 : 7) - session.participants.length);
      if (!slots.dataset.edited) slots.value = data.players_needed;
      byId("matchParticipantsTitle").textContent = `Người đã tham gia (${session.participants.length})`;
      byId("matchParticipantList").innerHTML = session.participants.map((person) =>
        `<li><strong>${escapeHtml(person.full_name)}</strong><span>${escapeHtml(person.contact_info)}${person.skill_level ? " · " + escapeHtml(person.skill_level) : ""}</span>${person.note ? `<span>${escapeHtml(person.note)}</span>` : ""}</li>`
      ).join("") || "<li>Chưa có người đăng ký qua Tsport.</li>";
    } else {
      byId("matchParticipantList").replaceChildren();
    }
    byId("matchDetailContent").hidden = false;
  }

  async function refreshMatchDetail(quiet = false) {
    const id = activeMatchId;
    if (!id || (quiet && detailLoading)) return;
    const request = ++detailRequest;
    const token = getSessionToken();
    const isCurrent = () => request === detailRequest && activeMatchId === id && token === getSessionToken();
    if (participation && token !== participationToken) {
      participation = null;
      participationToken = null;
      byId("matchJoinForm").reset();
      renderMatchDetail(match, null);
    }
    detailLoading = true;
    const retry = byId("matchDetailRetry");
    try {
      const data = matchView(await api.get(`/match-posts/${id}`));
      if (!isCurrent()) return;
      let session = null;
      let sessionError = "";
      if (token) {
        try {
          session = await api.get(`/match-posts/${id}/participation`);
        } catch (error) {
          if (error.status !== 401) {
            session = quiet && error.status === 0 && token === participationToken ? participation : null;
            sessionError = error.message;
          }
        }
      }
      if (!isCurrent()) return;
      if (session && token !== participationToken) {
        const form = byId("matchJoinForm");
        form.elements.full_name.value = session.full_name || "";
        form.elements.contact_info.value = session.phone || "";
      }
      match = data;
      participation = session;
      participationToken = session ? token : null;
      renderMatchDetail(data, session, sessionError);
      setMessage(byId("matchDetailFeedback"), "");
      retry.hidden = !sessionError;
    } catch (error) {
      if (!isCurrent()) return;
      if (error.status === 404) {
        byId("matchDetailContent").hidden = true;
        byId("matchParticipantList").replaceChildren();
      }
      setMessage(byId("matchDetailFeedback"), error.status === 404
        ? "Bài ghép kèo đã được hủy hoặc không còn tồn tại."
        : match ? "Chưa thể kiểm tra cập nhật mới. Hãy thử lại." : "Không tải được chi tiết kèo.", "error");
      retry.hidden = error.status === 404;
    } finally {
      if (request === detailRequest) {
        detailLoading = false;
        if (activeMatchId === id && token !== getSessionToken()) refreshMatchDetail();
      }
    }
  }

  async function changeParticipation(event, changeCapacity) {
    event.preventDefault();
    if (!activeMatchId || detailAction) return;
    const id = activeMatchId;
    const token = getSessionToken();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    const action = {};
    detailAction = action;
    button.disabled = true;
    setMessage(byId("matchActionError"), "");
    try {
      const path = `/match-posts/${id}`;
      const updated = changeCapacity
        ? await api.patch(path + "/capacity", { players_needed: Number(data.players_needed) })
        : await api.post(path + "/participation", data);
      if (activeMatchId === id && token === getSessionToken() && detailAction === action) {
        if (changeCapacity) delete byId("matchRemainingSlots").dataset.edited;
        if (!changeCapacity && participation) participation.joined = true;
        match = matchView(updated);
        renderMatchDetail(match, participation);
        showToast(changeCapacity ? "Đã lưu số chỗ còn lại." : "Đã tham gia kèo.", "success");
      }
    } catch (error) {
      if (activeMatchId === id && detailAction === action) {
        setMessage(byId("matchActionError"), error.message, "error");
      }
    } finally {
      if (activeMatchId === id && detailAction === action) {
        await refreshMatchDetail();
        detailAction = null;
      }
      button.disabled = false;
      renderMatchesList(true);
    }
  }

  async function handleMatchSubmit(event) {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    if (button.disabled) return;
    updateDateMinimum();
    if (!event.currentTarget.reportValidity()) return;
    const errorMessage = byId("matchCreateError");
    setMessage(errorMessage, "");
    button.disabled = true;
    try {
      const created = await api.post("/match-posts", {
        sport_id: Number(byId("matchSportId").value),
        match_time: byId("matchDateTime").value,
        location: byId("matchLocation").value.trim(),
        skill_level: byId("matchLevel").value,
        contact_info: byId("matchContactPhone").value.trim(),
        match_format: byId("matchFormat").value,
        players_needed: Number(byId("matchPlayersNeeded").value)
      });
      byId("matchFilters").reset();
      showToast("Đã đăng bài ghép kèo.", "success");
      showListView();
      openMatchDetail(String(created.id));
    } catch (error) {
      setMessage(errorMessage, error.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để đăng bài." : error.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function handleGridClick(event) {
    const link = event.target.closest("[data-match-detail]");
    if (link) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openMatchDetail(link.dataset.matchDetail, link);
      return;
    }
    const button = event.target.closest("[data-match-action]");
    if (!button || button.disabled) return;
    const status = button.dataset.matchAction;
    const id = button.closest("article").querySelector("[data-match-detail]").dataset.matchDetail;
    const cancel = status === "CANCELLED";
    button.disabled = true;
    try {
      if (!await confirmAction(cancel ? "Hủy bài này và gỡ khỏi danh sách công khai?"
        : "Đóng đăng ký cho bài ghép kèo này?", cancel ? "Hủy bài" : "Đóng bài")) return;
      await api.patch(`/match-posts/${id}/status`, { status });
      showToast(cancel ? "Đã hủy bài ghép kèo." : "Đã đóng đăng ký.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      button.disabled = false;
      renderMatchesList(true);
    }
  }

  async function handleSessionChange(event) {
    if (event.key && !["token", "tsport_token"].includes(event.key)) return;
    viewer = null;
    participation = null;
    participationToken = null;
    if (activeMatchId && match) {
      byId("matchJoinForm").reset();
      renderMatchDetail(match, null);
    }
    if (activeMatchId) refreshMatchDetail();
    await refreshViewer();
    renderMatchesList(true);
  }

  function initCommunity() {
    const sports = window.tsportStore.getSports();
    const options = sports.map((sport) => `<option value="${sport.id}">${escapeHtml(sport.name)}</option>`).join("");
    byId("filterMatchSport").innerHTML = '<option value="ALL">Tất cả môn</option>' + options;
    byId("matchSportId").innerHTML = options;
    updateMatchFormatRules();
    byId("matchDateTime").addEventListener("focus", updateDateMinimum);
    byId("matchSportId").addEventListener("change", updateMatchFormatRules);
    byId("matchFilters").addEventListener("change", () => renderMatchesList());
    byId("matchFilters").addEventListener("reset", () => setTimeout(() => renderMatchesList(), 0));
    byId("matchFilters").addEventListener("submit", (event) => {
      event.preventDefault();
      renderMatchesList();
    });
    byId("matchListRetry").addEventListener("click", () => renderMatchesList());
    byId("matchDetailRetry").addEventListener("click", () => refreshMatchDetail());
    byId("btnOpenCreateMatch").addEventListener("click", showCreateView);
    byId("btnBackToMatchesList").addEventListener("click", (event) => {
      event.preventDefault();
      showListView();
    });
    byId("formMatch").addEventListener("submit", handleMatchSubmit);
    byId("matchJoinForm").addEventListener("submit", (event) => changeParticipation(event, false));
    byId("matchCapacityForm").addEventListener("submit", (event) => changeParticipation(event, true));
    byId("matchRemainingSlots").addEventListener("input", (event) => { event.target.dataset.edited = "true"; });
    byId("matchesGrid").addEventListener("click", handleGridClick);
    byId("commHeaderSearchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const search = byId("commHeaderSearchInput").value.trim();
      location.href = search ? `shop.html?q=${encodeURIComponent(search)}` : "shop.html";
    });
    byId("matchDetailDialog").addEventListener("close", () => {
      activeMatchId = null;
      resetDetail();
      const url = new URL(location.href);
      url.searchParams.delete("match");
      history.replaceState(history.state, "", url);
      if (detailTrigger?.isConnected) detailTrigger.focus();
      else byId("btnOpenCreateMatch").focus();
      detailTrigger = null;
    });
    window.addEventListener("storage", handleSessionChange);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        if (!byId("communityListView").hidden) renderMatchesList(true);
        if (activeMatchId) refreshMatchDetail(true);
      }
    });
    window.setInterval(() => {
      if (document.hidden) return;
      if (!byId("communityListView").hidden) renderMatchesList(true);
      if (activeMatchId) refreshMatchDetail(true);
    }, 15000);

    const params = getUrlParams();
    if (/^\d+$/.test(params.match || "")) openMatchDetail(params.match);
    else if (params.create === "1") showCreateView();
    refreshViewer().then(() => renderMatchesList());
  }

  document.addEventListener("DOMContentLoaded", initCommunity);
})();
