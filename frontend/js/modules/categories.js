/**
 * TSPORT — MODULE QUẢN LÝ DANH MỤC CHA / CON (ADMIN CATEGORIES FIGMA)
 * - Hiển thị cây danh mục cha - con trực quan bên trái
 * - Chọn từng danh mục để xem/sửa/xóa hoặc thêm mới danh mục gốc / danh mục con bên phải
 */

(function () {
  let selectedCatId = null;

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

  function initCategoriesModule() {
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
    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function renderAll() {
    renderTree();
    populateParentOptions();
    fillForm();
  }

  function renderTree() {
    const wrap = document.getElementById("categoryTreeWrap");
    const store = window.tsportStore;
    if (!wrap || !store) return;

    const cats = store.getCategories() || [];
    const parents = cats.filter((c) => !c.parent_id);

    if (selectedCatId == null && cats.length) {
      const firstChild = cats.find((c) => c.parent_id);
      selectedCatId = firstChild ? firstChild.id : cats[0].id;
    }

    if (parents.length === 0) {
      wrap.innerHTML = '<div style="color:#6B7280; font-size:13px;">Chưa có danh mục nào.</div>';
      return;
    }

    wrap.innerHTML = parents
      .map((parent) => {
        const children = cats.filter((c) => Number(c.parent_id) === Number(parent.id));
        const isParentSelected = Number(parent.id) === Number(selectedCatId);

        return `
          <div class="ts-adm-cat-branch">
            <button
              type="button"
              class="ts-adm-cat-node is-parent ${isParentSelected ? "is-active" : ""}"
              data-cat-id="${parent.id}"
            >
              <span>• ${escapeHtml(parent.name)}</span>
            </button>

            ${
              children.length
                ? `
              <div class="ts-adm-cat-children">
                ${children
                  .map((ch, idx) => {
                    const isLast = idx === children.length - 1;
                    const isChildSelected = Number(ch.id) === Number(selectedCatId);
                    return `
                      <button
                        type="button"
                        class="ts-adm-cat-node is-child ${isChildSelected ? "is-active" : ""}"
                        data-cat-id="${ch.id}"
                      >
                        <span>${isLast ? "└ " : ""}${escapeHtml(ch.name)}</span>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

  function populateParentOptions() {
    const select = document.getElementById("catParentSelect");
    const store = window.tsportStore;
    if (!select || !store) return;

    const parents = (store.getCategories() || []).filter(
      (c) => !c.parent_id && Number(c.id) !== Number(selectedCatId)
    );

    select.innerHTML =
      `<option value="">Không có</option>` +
      parents.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  }

  function fillForm() {
    const store = window.tsportStore;
    if (!store) return;

    const cat = (store.getCategories() || []).find((c) => Number(c.id) === Number(selectedCatId));
    const nameEl = document.getElementById("catNameInput");
    const slugEl = document.getElementById("catSlugInput");
    const parentEl = document.getElementById("catParentSelect");
    const statusEl = document.getElementById("catStatusSelect");
    const delBtn = document.getElementById("btnDeleteCategory");

    if (cat) {
      if (nameEl) nameEl.value = cat.name || "";
      if (slugEl) slugEl.value = cat.slug || toSlug(cat.name);
      if (parentEl) parentEl.value = cat.parent_id ? String(cat.parent_id) : "";
      if (statusEl) statusEl.value = cat.status || "ACTIVE";
      if (delBtn) delBtn.disabled = false;
    } else {
      if (nameEl) nameEl.value = "";
      if (slugEl) slugEl.value = "";
      if (parentEl) parentEl.value = "";
      if (statusEl) statusEl.value = "ACTIVE";
      if (delBtn) delBtn.disabled = true;
    }
  }

  function bindEvents() {
    document.getElementById("categoryTreeWrap")?.addEventListener("click", (e) => {
      const node = e.target.closest(".ts-adm-cat-node");
      if (!node) return;
      selectedCatId = Number(node.dataset.catId);
      renderAll();
    });

    document.getElementById("btnNewCategory")?.addEventListener("click", () => {
      selectedCatId = -1;
      renderAll();
      document.getElementById("catNameInput")?.focus();
    });

    document.getElementById("catNameInput")?.addEventListener("input", (e) => {
      if (selectedCatId === -1) {
        const slugEl = document.getElementById("catSlugInput");
        if (slugEl) slugEl.value = toSlug(e.target.value);
      }
    });

    document.getElementById("formCategoryEditor")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const store = window.tsportStore;
      if (!store) return;

      const name = document.getElementById("catNameInput")?.value.trim();
      const slug = document.getElementById("catSlugInput")?.value.trim() || toSlug(name);
      const parentVal = document.getElementById("catParentSelect")?.value;
      const parent_id = parentVal ? Number(parentVal) : null;
      const status = document.getElementById("catStatusSelect")?.value || "ACTIVE";

      if (!name) {
        showToast("Vui lòng nhập tên danh mục.", "error");
        return;
      }

      const arr = store.data.categories || [];
      const existing = arr.find((c) => Number(c.id) === Number(selectedCatId));

      if (existing) {
        existing.name = name;
        existing.slug = slug;
        existing.parent_id = parent_id;
        existing.status = status;
        store.save();
        showToast(`Đã cập nhật danh mục "${name}"!`, "success");
      } else {
        const newId = arr.length ? Math.max(...arr.map((c) => Number(c.id) || 0)) + 1 : 1;
        arr.push({ id: newId, name, slug, parent_id, status });
        selectedCatId = newId;
        store.save();
        showToast(`Đã tạo danh mục "${name}" thành công!`, "success");
      }

      renderAll();
    });

    document.getElementById("btnDeleteCategory")?.addEventListener("click", async () => {
      const store = window.tsportStore;
      if (!store || selectedCatId == null || selectedCatId < 0) return;

      const arr = store.data.categories || [];
      const idx = arr.findIndex((c) => Number(c.id) === Number(selectedCatId));
      if (idx === -1) return;

      const target = arr[idx];
      const hasChildren = arr.some((c) => Number(c.parent_id) === Number(target.id));
      if (hasChildren) {
        showToast("Không thể xóa danh mục cha đang có danh mục con.", "error");
        return;
      }

      if (!(await confirmAction(`Bạn có chắc muốn xóa danh mục "${target.name}"?`, "Xóa danh mục"))) return;
      arr.splice(idx, 1);
      store.save();
      selectedCatId = arr[0] ? arr[0].id : -1;
      renderAll();
      showToast(`Đã xóa danh mục "${target.name}".`, "success");
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initCategoriesModule));
})();
