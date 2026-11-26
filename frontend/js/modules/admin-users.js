/**
 * TSPORT — MODULE QUẢN LÝ NGƯỜI DÙNG (ADMIN USERS FIGMA)
 * - Tìm kiếm theo email / SĐT / tên và lọc theo vai trò (ALL / CUSTOMER / ADMIN)
 * - Khóa / Mở khóa nhanh hoặc chọn tài khoản để cập nhật Vai trò & Trạng thái (ACTIVE / INACTIVE / LOCKED)
 */

(function () {
  let users = [];
  let selectedUserId = null;
  let loading = false;
  let saving = false;
  let loadError = "";

  function initAdminUsers() {
    initTopbarControls();
    bindEvents();
    loadUsers();
  }

  async function loadUsers() {
    if (loading || saving) return;
    loading = true;
    loadError = "";
    renderUsersTable();
    try {
      users = await api.get("/users");
      if (!users.some((user) => user.id === selectedUserId)) {
        selectedUserId = users[0]?.id ?? null;
      }
    } catch (error) {
      if (error.status === 401) {
        clearLocalSession();
        location.replace("auth.html");
        return;
      }
      users = [];
      selectedUserId = null;
      loadError = error.message || "Không tải được danh sách người dùng. Hãy thử lại.";
    } finally {
      loading = false;
      renderUsersTable();
      renderEditPanel();
    }
  }

  async function updateUser(id, changes, message) {
    if (loading || saving) return;
    saving = true;
    const saveButton = document.getElementById("btnSaveUserUpdate");
    saveButton.disabled = true;
    renderUsersTable();
    try {
      const updated = await api.put(`/users/${id}`, changes);
      users = users.map((user) => user.id === updated.id ? updated : user);
      selectedUserId = updated.id;
      renderEditPanel();
      showToast(`${message} ${updated.full_name}.`, "success");
    } catch (error) {
      if (error.status === 401) {
        clearLocalSession();
        location.replace("auth.html");
        return;
      }
      showToast(error.message, "error");
    } finally {
      saving = false;
      saveButton.disabled = false;
      renderUsersTable();
    }
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

    if (loading || loadError || filtered.length === 0) {
      const message = loading ? "Đang tải danh sách người dùng…"
        : loadError || "Không tìm thấy người dùng phù hợp.";
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:36px 16px; color:#6B7280;">
            ${escapeHtml(message)}
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
        const disabled = saving ? "disabled" : "";

        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-user-id="${u.id}">
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(u.full_name)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(u.email)}</div>
            </td>
            <td>${escapeHtml(u.phone?.trim() || "Chưa cập nhật")}</td>
            <td>${escapeHtml(u.role)}</td>
            <td><span class="ts-orders-v2-status ${st.cls}">${st.label}</span></td>
            <td>
              ${
                isLocked
                  ? `<button type="button" class="ts-orders-v2-detail-btn js-unlock-user" data-id="${u.id}" ${disabled}>Mở khóa</button>`
                  : `<span style="display:inline-flex; align-items:center; gap:6px;">
                      <button type="button" class="ts-orders-v2-detail-btn js-edit-user" data-id="${u.id}" ${disabled}>Sửa tài khoản</button>
                      <span style="color:#9CA3AF;">/</span>
                      <button type="button" class="ts-orders-v2-detail-btn js-lock-user" data-id="${u.id}" ${disabled}>Khóa</button>
                    </span>`
              }
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function renderEditPanel() {
    const u = users.find((user) => user.id === selectedUserId);
    document.getElementById("userEditPanel").hidden = !u;
    if (!u) return;
    selectedUserId = u.id;

    const heading = document.getElementById("editUserHeading");
    const roleSelect = document.getElementById("editUserRole");
    const statusSelect = document.getElementById("editUserStatus");

    if (heading) heading.textContent = `Cập nhật tài khoản: ${u.full_name}`;
    if (roleSelect) roleSelect.value = u.role;
    if (statusSelect) statusSelect.value = u.status;
    document.getElementById("editUserPhone").value = u.phone || "";
  }

  function bindEvents() {
    document.getElementById("btnSearchUsers")?.addEventListener("click", loadUsers);
    window.addEventListener("pageshow", (event) => { if (event.persisted) loadUsers(); });
    document.getElementById("userSearchInput")?.addEventListener("input", renderUsersTable);
    document.getElementById("userRoleFilter")?.addEventListener("change", renderUsersTable);

    document.getElementById("adminUsersTbody")?.addEventListener("click", (e) => {
      if (saving) return;
      const lockBtn = e.target.closest(".js-lock-user");
      if (lockBtn) {
        updateUser(Number(lockBtn.dataset.id), { status: "LOCKED" }, "Đã khóa tài khoản");
        return;
      }

      const unlockBtn = e.target.closest(".js-unlock-user");
      if (unlockBtn) {
        updateUser(Number(unlockBtn.dataset.id), { status: "ACTIVE" }, "Đã mở khóa tài khoản");
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

      const phone = document.getElementById("editUserPhone").value.trim();
      const changes = {
        role: document.getElementById("editUserRole").value,
        status: document.getElementById("editUserStatus").value,
      };
      if (phone !== (u.phone || "").trim()) changes.phone = phone;
      updateUser(u.id, changes, "Đã cập nhật tài khoản");
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
