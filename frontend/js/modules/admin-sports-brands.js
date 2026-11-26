/**
 * TSPORT — MODULE QUẢN LÝ MÔN THỂ THAO & THƯƠNG HIỆU (ADMIN FIGMA)
 * - Chuyển đổi 2 tab: Môn thể thao / Thương hiệu
 * - Thêm / Sửa / Xóa trực tiếp vào tsportStore.data.sports và tsportStore.data.brands
 */

(function () {
  let activeTab = "sports"; // "sports" | "brands"
  let selectedId = null;

  function toSlug(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function initModule() {
    initTopbarControls();
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
    document.getElementById("btnAdminLogout")?.addEventListener("click", logoutAdmin);
  }

  function getCurrentList() {
    const store = window.tsportStore;
    if (!store) return [];
    return activeTab === "sports" ? store.getSports() || [] : store.getBrands() || [];
  }

  function renderAll() {
    renderListTable();
    renderSummary();
    fillFormFromSelection();
  }

  function renderListTable() {
    const tbody = document.getElementById("sbListTbody");
    if (!tbody) return;
    const list = getCurrentList();

    if (selectedId == null && list.length) {
      selectedId = list[0].id;
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding:32px 16px; color:#6B7280;">
            Chưa có dữ liệu. Nhập thông tin bên phải để thêm mới.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map((item) => {
        const isActive = (item.status || "ACTIVE") === "ACTIVE";
        const isSelected = Number(item.id) === Number(selectedId);
        return `
          <tr class="${isSelected ? "is-selected-row" : ""}" data-item-id="${item.id}">
            <td>${escapeHtml(item.name)}</td>
            <td style="color:#6B7280;">${escapeHtml(item.slug || toSlug(item.name))}</td>
            <td>
              <span class="ts-orders-v2-status ${isActive ? "" : "is-cancelled"}">
                ${isActive ? "Hoạt động" : "Tạm ẩn"}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSummary() {
    const store = window.tsportStore;
    if (!store) return;
    const head = document.getElementById("sbSummaryHeading");
    const itemsEl = document.getElementById("sbSummaryItems");

    if (activeTab === "sports") {
      const brands = (store.getBrands() || []).slice(0, 6).map((b) => b.name).join(" • ");
      if (head) head.textContent = "Tab Thương hiệu";
      if (itemsEl) itemsEl.textContent = brands || "Yonex • Lining • Nike • Wilson • Joola";
    } else {
      const sports = (store.getSports() || []).slice(0, 6).map((s) => s.name).join(" • ");
      if (head) head.textContent = "Tab Môn thể thao";
      if (itemsEl) itemsEl.textContent = sports || "Cầu lông • Bóng đá • Tennis • Pickleball";
    }
  }

  function fillFormFromSelection() {
    const list = getCurrentList();
    const item = list.find((x) => Number(x.id) === Number(selectedId));

    const nameEl = document.getElementById("sbNameInput");
    const slugEl = document.getElementById("sbSlugInput");
    const descEl = document.getElementById("sbDescInput");
    const statusEl = document.getElementById("sbStatusSelect");
    const delBtn = document.getElementById("btnDeleteSbItem");

    if (item) {
      if (nameEl) nameEl.value = item.name || "";
      if (slugEl) slugEl.value = item.slug || toSlug(item.name);
      if (descEl) descEl.value = activeTab === "sports" ? item.description || "" : item.logo_url || "";
      if (statusEl) statusEl.value = item.status || "ACTIVE";
      if (delBtn) delBtn.disabled = false;
    } else {
      if (nameEl) nameEl.value = "";
      if (slugEl) slugEl.value = "";
      if (descEl) descEl.value = "";
      if (statusEl) statusEl.value = "ACTIVE";
      if (delBtn) delBtn.disabled = true;
    }
  }

  function bindEvents() {
    // Chuyển tab Môn thể thao / Thương hiệu
    document.getElementById("sbTabsBar")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-adm-tab-pill");
      if (!btn) return;
      activeTab = btn.dataset.tab === "brands" ? "brands" : "sports";
      selectedId = null;
      document.querySelectorAll(".ts-adm-tab-pill").forEach((t) => {
        t.classList.toggle("is-active", t === btn);
      });
      renderAll();
    });

    // Chọn dòng trong bảng
    document.getElementById("sbListTbody")?.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-item-id]");
      if (!row) return;
      selectedId = Number(row.dataset.itemId);
      renderListTable();
      fillFormFromSelection();
    });

    // Nút "+ Thêm mới"
    document.getElementById("btnNewSbItem")?.addEventListener("click", () => {
      selectedId = -1;
      renderListTable();
      fillFormFromSelection();
      document.getElementById("sbNameInput")?.focus();
    });

    // Tự sinh slug khi nhập tên mới
    document.getElementById("sbNameInput")?.addEventListener("input", (e) => {
      if (selectedId === -1) {
        const slugEl = document.getElementById("sbSlugInput");
        if (slugEl) slugEl.value = toSlug(e.target.value);
      }
    });

    // Lưu thông tin (Thêm mới hoặc Cập nhật)
    document.getElementById("formSportsBrands")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const name = document.getElementById("sbNameInput")?.value.trim();
      const slug = document.getElementById("sbSlugInput")?.value.trim() || toSlug(name);
      const desc = document.getElementById("sbDescInput")?.value.trim() || "";
      const status = document.getElementById("sbStatusSelect")?.value || "ACTIVE";

      if (!name) {
        showToast("Vui lòng nhập tên mục.", "error");
        return;
      }

      const arr = activeTab === "sports" ? store.data.sports : store.data.brands;
      const existing = arr.find((x) => Number(x.id) === Number(selectedId));

      if (existing) {
        existing.name = name;
        existing.slug = slug;
        existing.status = status;
        if (activeTab === "sports") existing.description = desc;
        else existing.logo_url = desc;
        store.save();
        showToast(`Đã cập nhật "${name}" thành công!`, "success");
      } else {
        const newId = arr.length ? Math.max(...arr.map((x) => Number(x.id) || 0)) + 1 : 1;
        const record =
          activeTab === "sports"
            ? { id: newId, name, slug, description: desc, status }
            : { id: newId, name, slug, logo_url: desc, status };
        arr.push(record);
        selectedId = newId;
        store.save();
        showToast(`Đã thêm mới "${name}" thành công!`, "success");
      }

      renderAll();
    });

    // Xóa mục đang chọn
    document.getElementById("btnDeleteSbItem")?.addEventListener("click", async () => {
      const store = window.tsportStore;
      if (!store || selectedId == null || selectedId < 0) return;

      const arr = activeTab === "sports" ? store.data.sports : store.data.brands;
      const idx = arr.findIndex((x) => Number(x.id) === Number(selectedId));
      if (idx === -1) return;

      const targetName = arr[idx].name;
      if (!(await confirmAction(`Bạn có chắc muốn xóa "${targetName}" không?`, "Xóa"))) return;

      arr.splice(idx, 1);
      store.save();
      selectedId = arr[0] ? arr[0].id : -1;
      renderAll();
      showToast(`Đã xóa "${targetName}".`, "success");
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initModule));
})();
