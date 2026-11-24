/**
 * TSPORT — MODULE BÀI GHÉP KÈO CỦA TÔI (MY MATCHES FIGMA)
 * - Hiển thị bảng 4 cột: Môn / Thời gian, Địa điểm / Trình độ, Trạng thái, Thao tác
 * - Hỗ trợ Đóng bài, Hủy (xóa bài) hoặc Xem bài trên trang Ghép kèo
 */

(function () {
  function initMyMatchesPage() {
    initSidebarUser();
    initHeaderSearch();
    renderMatchesTable();
    bindEvents();
  }

  function getInitials(name) {
    const parts = String(name || "TS").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function initSidebarUser() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || {
      full_name: "Nguyễn Minh Anh",
      role: "CUSTOMER"
    };
    const nameEl = document.getElementById("sbMatchesName");
    const roleEl = document.getElementById("sbMatchesRole");
    const avatarEl = document.getElementById("sbMatchesAvatar");
    if (nameEl) nameEl.textContent = user.full_name || user.email || "Khách hàng";
    if (roleEl) roleEl.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    if (avatarEl) avatarEl.textContent = getInitials(user.full_name || user.email);

    document.getElementById("btnMatchesLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function initHeaderSearch() {
    const form = document.getElementById("myMatchesSearchForm");
    const input = document.getElementById("myMatchesSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function formatDMY(iso) {
    const parts = String(iso || "").split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso || "";
  }

  async function renderMatchesTable() {
    const tbody = document.getElementById("myMatchesTableBody");
    const store = window.tsportStore;
    if (!tbody || !store) return;

    let matches;
    try { matches = (await api.get("/match-posts/mine")).map(matchView); }
    catch (err) { showToast(err.message, "error"); return; }

    if (matches.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:44px 16px; color:#6B7280;">
            Bạn chưa có bài ghép kèo nào. Bấm "+ Đăng bài mới" để tìm đồng đội ngay.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = matches
      .map((m) => {
        const isClosed = m.status !== "OPEN";
        const dateTime = `${formatDMY(m.match_date)} ${m.match_time || "18:00"}`;

        return `
          <tr>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(m.sport_name || "Cầu lông")}</div>
              <div class="ts-orders-v2-date">${escapeHtml(dateTime)}</div>
            </td>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(m.location || "Hà Nội")}</div>
              <div class="ts-orders-v2-date">${escapeHtml(m.level || "Trung bình")}</div>
            </td>
            <td>
              <span class="ts-orders-v2-status ${isClosed ? "" : "is-pending"}">
                ${isClosed ? "Đã đóng" : "Đang mở"}
              </span>
            </td>
            <td>
              ${
                isClosed
                  ? `<a href="community.html" class="ts-orders-v2-detail-btn" style="text-decoration:none;">Xem bài</a>`
                  : `<span style="display:inline-flex; align-items:center; gap:6px;">
                      <button type="button" class="ts-orders-v2-detail-btn js-close-my-match" data-id="${m.id}">Đóng bài</button>
                      <span style="color:#9CA3AF;">/</span>
                      <button type="button" class="ts-orders-v2-detail-btn js-delete-my-match" data-id="${m.id}">Hủy</button>
                    </span>`
              }
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function bindEvents() {
    document.getElementById("myMatchesTableBody")?.addEventListener("click", async (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const closeBtn = e.target.closest(".js-close-my-match");
      if (closeBtn) {
        try { await api.patch(`/match-posts/${closeBtn.dataset.id}/status`, {status: "CLOSED"}); }
        catch (err) { showToast(err.message, "error"); return; }
        renderMatchesTable();
        showToast("Đã đóng bài ghép kèo (Đã đủ người).", "success");
        return;
      }

      const delBtn = e.target.closest(".js-delete-my-match");
      if (delBtn) {
        if (await confirmAction("Bạn có chắc muốn hủy bài ghép kèo này không?", "Hủy bài")) {
          try { await api.patch(`/match-posts/${delBtn.dataset.id}/status`, {status: "CANCELLED"}); }
        catch (err) { showToast(err.message, "error"); return; }
          renderMatchesTable();
          showToast("Đã hủy bài ghép kèo.", "success");
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

  document.addEventListener("DOMContentLoaded", () => initCustomerPage(initMyMatchesPage));
})();
