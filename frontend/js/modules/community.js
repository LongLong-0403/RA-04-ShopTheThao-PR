/**
 * TSPORT — MODULE KẾT NỐI NGƯỜI CHƠI (COMMUNITY MATCHES)
 * Tính năng:
 * - Danh sách bài đăng giao lưu có bộ lọc: Môn thể thao, Ngày chơi, Địa điểm
 * - Form đăng / sửa bài viết tìm bạn chơi
 * - Quyền người đăng: Nút Đóng bài, Nút Xóa bài của mình
 * - Quyền Admin: Nút Ẩn bài viết vi phạm
 */

(function () {
  let isAdminView = false;
  let currentEditingMatchId = null;

  function initCommunityModule() {
    renderSportFilterOptions();
    renderMatchesList();
    bindEvents();
  }

  function renderSportFilterOptions() {
    const store = window.tsportStore;
    const sportSelect = document.getElementById("filterMatchSport");
    const formSportSelect = document.getElementById("matchSportId");
    if (!store) return;

    const sports = store.getSports();
    if (sportSelect) {
      sportSelect.innerHTML = `<option value="ALL">Tất cả môn thể thao</option>` +
        sports.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
    if (formSportSelect) {
      formSportSelect.innerHTML = `<option value="">-- Chọn môn thể thao --</option>` +
        sports.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    }
  }

  function renderMatchesList() {
    const grid = document.getElementById("matchesGrid");
    if (!grid) return;

    const store = window.tsportStore;
    if (!store) return;

    const sportId = document.getElementById("filterMatchSport")?.value || "ALL";
    const date = document.getElementById("filterMatchDate")?.value || "";
    const location = document.getElementById("filterMatchLocation")?.value || "";

    const matches = store.getMatches({
      sport_id: sportId,
      date,
      location,
      showHidden: isAdminView // Admin thấy cả bài bị ẩn
    });

    const countBadge = document.getElementById("matchCountBadge");
    if (countBadge) countBadge.textContent = `${matches.length} bài đăng`;

    if (matches.length === 0) {
      grid.innerHTML = `
        <div class="tsport-card" style="grid-column:1/-1; text-align:center; padding:40px 20px;">
          <div style="font-size:40px; margin-bottom:10px;">🏸⚽</div>
          <h3 style="font-size:16px; font-weight:800; color:#1E293B;">Không tìm thấy kèo giao lưu nào</h3>
          <p style="font-size:13px; color:#64748B;">Hãy thử đổi ngày hoặc tạo ngay bài đăng tìm đồng đội của bạn!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = matches.map((m) => {
      const isClosed = m.status === "CLOSED";
      const isHidden = m.status === "HIDDEN";

      return `
        <div class="tsport-match-card ${isHidden ? 'is-hidden' : ''}">
          <div class="tsport-match-top">
            <div>
              <span class="badge badge-sport" style="margin-bottom:6px; display:inline-block;">${escapeHtml(m.sport_name)}</span>
              <h3 class="tsport-match-title">${escapeHtml(m.title)}</h3>
            </div>
            <div>
              ${isHidden ? '<span class="badge badge-inactive">🚫 Đã ẩn (Admin)</span>' : isClosed ? '<span class="badge badge-inactive">Đã đóng kèo</span>' : '<span class="badge badge-active">● Đang tìm người</span>'}
            </div>
          </div>

          <div class="tsport-match-meta">
            <div class="tsport-match-meta-item">
              <span>📅</span>
              <span><strong>${escapeHtml(m.match_date)}</strong> (${escapeHtml(m.match_time)})</span>
            </div>
            <div class="tsport-match-meta-item">
              <span>📍</span>
              <span>${escapeHtml(m.location)}</span>
            </div>
            <div class="tsport-match-meta-item">
              <span>👥</span>
              <span>Cần tìm: <strong>${m.slots_needed} người</strong> • Trình độ: ${escapeHtml(m.level || 'Giao lưu')}</span>
            </div>
            <div class="tsport-match-meta-item">
              <span>💰</span>
              <span>Chi phí: <strong>${escapeHtml(m.price_share || 'Chia đều sân')}</strong></span>
            </div>
            <div class="tsport-match-meta-item">
              <span>📞</span>
              <span>Liên hệ: <strong>${escapeHtml(m.contact_name)}</strong> - <a href="tel:${escapeHtml(m.contact_phone)}" style="color:#D94C26; font-weight:700;">${escapeHtml(m.contact_phone)}</a></span>
            </div>
          </div>

          <p style="font-size:12px; color:#64748B; line-height:1.4; margin-bottom:12px;">
            ${escapeHtml(m.description || '')}
          </p>

          <div class="tsport-match-footer">
            <!-- NÚT CHO TÁC GIẢ BÀI VIẾT -->
            <div style="display:flex; gap:6px;">
              ${!isClosed && !isHidden ? `
                <button type="button" class="btn btn-secondary btn-sm js-close-match" data-id="${m.id}" title="Đóng bài khi đã đủ người">
                  🔒 Đóng bài
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm js-edit-match" data-id="${m.id}" title="Sửa bài viết">
                ✏️ Sửa
              </button>
              <button type="button" class="btn btn-danger btn-sm js-delete-match" data-id="${m.id}" title="Xóa bài viết của mình">
                🗑️ Xóa
              </button>
            </div>

            <!-- NÚT CHO ADMIN ẨN BÀI VI PHẠM -->
            ${isAdminView ? `
              <button type="button" class="btn ${isHidden ? 'btn-secondary' : 'btn-danger'} btn-sm js-admin-hide-match" data-id="${m.id}">
                ${isHidden ? '👁️ Mở lại bài' : '🚫 Admin Ẩn bài'}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  // Mở modal thêm/sửa bài đăng
  function openMatchModal(matchId = null) {
    const store = window.tsportStore;
    if (!store) return;

    currentEditingMatchId = matchId ? Number(matchId) : null;
    const modalTitle = document.getElementById("matchModalTitle");

    if (currentEditingMatchId) {
      const m = store.getMatchById(currentEditingMatchId);
      if (!m) return;
      if (modalTitle) modalTitle.textContent = "Chỉnh sửa bài đăng giao lưu";
      document.getElementById("matchTitle").value = m.title;
      document.getElementById("matchSportId").value = m.sport_id;
      document.getElementById("matchDate").value = m.match_date;
      document.getElementById("matchTime").value = m.match_time;
      document.getElementById("matchLocation").value = m.location;
      document.getElementById("matchSlots").value = m.slots_needed;
      document.getElementById("matchLevel").value = m.level;
      document.getElementById("matchPriceShare").value = m.price_share || "";
      document.getElementById("matchContactName").value = m.contact_name;
      document.getElementById("matchContactPhone").value = m.contact_phone;
      document.getElementById("matchDesc").value = m.description || "";
    } else {
      if (modalTitle) modalTitle.textContent = "Đăng bài tìm bạn chơi thể thao mới";
      document.getElementById("formMatch")?.reset();
      // Gợi ý ngày hôm nay + 2 ngày
      const d = new Date();
      d.setDate(d.getDate() + 2);
      document.getElementById("matchDate").value = d.toISOString().split("T")[0];
    }

const modal = document.getElementById("modalMatchForm");
    if (modal) {
      modal.style.display = "flex";
      modal.style.opacity = "1";
      modal.style.visibility = "visible";
      modal.style.pointerEvents = "auto";
    }

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
      slots_needed: Number(document.getElementById("matchSlots").value) || 1,
      level: document.getElementById("matchLevel").value,
      price_share: document.getElementById("matchPriceShare").value.trim(),
      contact_name: document.getElementById("matchContactName").value.trim(),
      contact_phone: document.getElementById("matchContactPhone").value.trim(),
      description: document.getElementById("matchDesc").value.trim()
    };

    try {
      store.saveMatch(data);
      const modal = document.getElementById("modalMatchForm");
      if (modal) modal.style.display = "none";
      renderMatchesList();
      showToast(currentEditingMatchId ? "Đã cập nhật bài đăng thành công!" : "Đăng bài giao lưu mới thành công!", "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  function bindEvents() {
    // Lọc theo môn / ngày / địa điểm
    document.getElementById("filterMatchSport")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchDate")?.addEventListener("change", renderMatchesList);
    document.getElementById("filterMatchLocation")?.addEventListener("input", renderMatchesList);

    // Nút đăng bài mới
    document.getElementById("btnOpenCreateMatch")?.addEventListener("click", () => openMatchModal(null));

    // Submit form bài đăng
    document.getElementById("formMatch")?.addEventListener("submit", handleMatchSubmit);

    // Đổi quyền xem Admin / Khách
    document.getElementById("toggleAdminCommunityMode")?.addEventListener("change", (e) => {
      isAdminView = e.target.checked;
      renderMatchesList();
      showToast(`Chế độ xem: ${isAdminView ? 'Quản trị viên (Có quyền Ẩn bài vi phạm)' : 'Khách hàng cá nhân'}`, "info");
    });
    // Xử lý nút X và nút Hủy bỏ đóng modal
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById("modalMatchForm");
        if (modal) modal.style.display = "none";
      });
    });
    // Thao tác trên thẻ bài viết
    document.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      // Đóng bài
      const closeBtn = e.target.closest(".js-close-match");
      if (closeBtn) {
        store.closeMatch(closeBtn.dataset.id);
        renderMatchesList();
        showToast("Đã đóng bài viết (Đủ người tham gia)", "info");
      }

      // Sửa bài
      const editBtn = e.target.closest(".js-edit-match");
      if (editBtn) {
        openMatchModal(editBtn.dataset.id);
      }

      // Xóa bài
      const deleteBtn = e.target.closest(".js-delete-match");
      if (deleteBtn) {
        if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
          store.deleteMatch(deleteBtn.dataset.id);
          renderMatchesList();
          showToast("Đã xóa bài viết thành công", "success");
        }
      }

      // Admin ẩn bài vi phạm
      const hideBtn = e.target.closest(".js-admin-hide-match");
      if (hideBtn) {
        const newStatus = store.hideMatch(hideBtn.dataset.id);
        renderMatchesList();
        showToast(`Đã chuyển trạng thái bài viết sang: ${newStatus}`, "info");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initCommunityModule);
})();
