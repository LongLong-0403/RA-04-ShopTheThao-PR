/**
 * TSPORT — MODULE QUẢN LÝ NGƯỜI DÙNG (ADMIN USERS FIGMA)
 * - Tìm kiếm theo email / SĐT / tên và lọc theo vai trò (ALL / CUSTOMER / ADMIN)
 * - Khóa / Mở khóa nhanh hoặc chọn tài khoản để cập nhật Vai trò & Trạng thái (ACTIVE / INACTIVE / LOCKED)
 */

(function () {
  const USERS_KEY = "tsport_admin_users_v1";
  let users = [];
  let selectedUserId = null;

  const SEED_USERS = [
    { id: 1, full_name: "Nguyễn Minh Anh", email: "minhanh@example.com", phone: "0901234567", role: "CUSTOMER", status: "ACTIVE" },
    { id: 2, full_name: "Quản trị viên", email: "admin@example.com", phone: "0900000000", role: "ADMIN", status: "ACTIVE" },
    { id: 3, full_name: "Trần Hoàng", email: "hoang@example.com", phone: "0902222222", role: "CUSTOMER", status: "LOCKED" },
    { id: 4, full_name: "Nguyễn Văn An", email: "nguyenvanan@sportstore.vn", phone: "0912345601", role: "CUSTOMER", status: "ACTIVE" }
  ];

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (_) {}
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return [...SEED_USERS];
  }

  function saveUsers() {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (_) {}
  }

  function initAdminUsers() {
    users = loadUsers();
    selectedUserId = users[0] ? users[0].id : null;
    initTopbarControls();
    renderUsersTable();
    renderEditPanel();
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
    document.getElementById("btnToggleAdminSidebar")?.addEventListener("click", () => {
      document.getElementById("adminSidebar")?.classList.toggle("is-open");
    });
  }

  function getStatusMeta(status) {
    if (status === "LOCKED") return { label: "Bị khóa", cls: "is-pending" };
    if (status === "INACTIVE") return { label: "Tạm ngưng", cls: "" };
    return { label: "Hoạt động", cls: "" };
  }

  function renderUsersTable() {
    const tbody = document.getElementById("adminUsersTbody");
    if (!tbody) return;

    const q = (document.getElementById("userSearchInput")?.value || "").trim().toLowerCase();
    const roleFilter = document.getElementById("userRoleFilter")?.value || "ALL";

    const filtered = users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (q) {
        const hay = `${u.full_name} ${u.email} ${u.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:36px 16px; color:#6B7280;">
            Không tìm thấy người dùng phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((u) => {
        const st = getStatusMeta(u.status);
        const isLocked = u.status === "LOCKED";
        const isSelected = Number(u.id) === Number(selectedUserId);

        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-user-id="${u.id}">
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(u.full_name)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(u.email)}</div>
            </td>
            <td>${escapeHtml(u.phone)}</td>
            <td>${escapeHtml(u.role)}</td>
            <td><span class="ts-orders-v2-status ${st.cls}">${st.label}</span></td>
            <td>
              ${
                isLocked
                  ? `<button type="button" class="ts-orders-v2-detail-btn js-unlock-user" data-id="${u.id}">Mở khóa</button>`
                  : `<span style="display:inline-flex; align-items:center; gap:6px;">
                      <button type="button" class="ts-orders-v2-detail-btn js-edit-user" data-id="${u.id}">Sửa quyền</button>
                      <span style="color:#9CA3AF;">/</span>
                      <button type="button" class="ts-orders-v2-detail-btn js-lock-user" data-id="${u.id}">Khóa</button>
                    </span>`
              }
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function renderEditPanel() {
    const u = users.find((x) => Number(x.id) === Number(selectedUserId)) || users[0];
    if (!u) return;
    selectedUserId = u.id;

    const heading = document.getElementById("editUserHeading");
    const roleSelect = document.getElementById("editUserRole");
    const statusSelect = document.getElementById("editUserStatus");

    if (heading) heading.textContent = `Cập nhật tài khoản: ${u.full_name}`;
    if (roleSelect) roleSelect.value = u.role;
    if (statusSelect) statusSelect.value = u.status;
  }

  function bindEvents() {
    document.getElementById("btnSearchUsers")?.addEventListener("click", renderUsersTable);
    document.getElementById("userSearchInput")?.addEventListener("input", renderUsersTable);
    document.getElementById("userRoleFilter")?.addEventListener("change", renderUsersTable);

    document.getElementById("adminUsersTbody")?.addEventListener("click", (e) => {
      const lockBtn = e.target.closest(".js-lock-user");
      if (lockBtn) {
        const u = users.find((x) => Number(x.id) === Number(lockBtn.dataset.id));
        if (u) {
          u.status = "LOCKED";
          saveUsers();
          selectedUserId = u.id;
          renderUsersTable();
          renderEditPanel();
          showToast(`Đã khóa tài khoản ${u.full_name}.`, "success");
        }
        return;
      }

      const unlockBtn = e.target.closest(".js-unlock-user");
      if (unlockBtn) {
        const u = users.find((x) => Number(x.id) === Number(unlockBtn.dataset.id));
        if (u) {
          u.status = "ACTIVE";
          saveUsers();
          selectedUserId = u.id;
          renderUsersTable();
          renderEditPanel();
          showToast(`Đã mở khóa tài khoản ${u.full_name}.`, "success");
        }
        return;
      }

      const row = e.target.closest("tr[data-user-id]");
      if (row) {
        selectedUserId = Number(row.dataset.userId);
        renderUsersTable();
        renderEditPanel();
      }
    });

    document.getElementById("btnSaveUserUpdate")?.addEventListener("click", () => {
      const u = users.find((x) => Number(x.id) === Number(selectedUserId));
      if (!u) return;

      u.role = document.getElementById("editUserRole")?.value || u.role;
      u.status = document.getElementById("editUserStatus")?.value || u.status;
      saveUsers();
      renderUsersTable();
      showToast(`Đã lưu cập nhật cho tài khoản ${u.full_name}!`, "success");
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminUsers));
})();
