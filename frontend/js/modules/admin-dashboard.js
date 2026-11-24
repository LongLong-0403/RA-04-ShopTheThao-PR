/**
 * TSPORT — MODULE TỔNG QUAN QUẢN TRỊ (ADMIN DASHBOARD V2 FIGMA)
 * - Nạp 4 chỉ số KPI live từ tsportStore (Đơn cần xử lý, Lịch sân chờ duyệt, Yêu cầu thu mua, SKU hết hàng)
 * - Tổng hợp bảng "Công việc cần xử lý" từ Đặt sân, Đơn hàng và Thu mua đồ cũ
 */

(function () {
  function pad2(n) {
    return String(Number(n) || 0).padStart(2, "0");
  }

  function formatShortDate(str) {
    if (!str) return "";
    const parts = String(str).split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return str;
  }

  function initAdminDashboard() {
    initTopbarControls();
    renderKpisAndTasks();
    initBannerEditors();
  }

  async function initBannerEditors() {
    const workspace = document.getElementById("adminBannerEditors");
    if (!workspace) return;
    const form = workspace.querySelector("form");
    const slot = form.elements.namedItem("slot");
    const file = form.elements.namedItem("file");
    const url = form.elements.namedItem("url");
    const save = form.querySelector('[type="submit"]');
    const discard = form.querySelector('[data-banner-action="discard"]');
    const status = form.querySelector('[role="status"]');
    const frame = workspace.querySelector(".ts-adm-banner-frame");
    const preview = frame.querySelector("img");
    const previewState = frame.querySelector("p");
    const layoutInputs = ["fit", "zoom", "x", "y"].map((name) => form.elements.namedItem(name));
    const deviceLabel = document.getElementById("adminBannerDeviceLabel");
    const drafts = new Map();
    const original = (index) => `/frontend/assets/banner/banner-${index}.jpg${index === "1" ? "?v=2" : ""}`;
    let published;
    let previewVersion = 0;
    let reading = false;
    let saving = false;

    form.inert = true;
    try { published = await api.get("/home-banners", { include_framing: true }); }
    catch (error) {
      status.textContent = "Không tải được banner. Tải lại trang để thử lại.";
      showToast(error.message, "error");
      return;
    }
    form.inert = false;

    function savedBanner(index) {
      const data = published[index];
      return {
        image: data?.image_url || original(index),
        framing: { desktop: bannerFrameFor(data?.framing, "desktop"), mobile: bannerFrameFor(data?.framing, "mobile") }
      };
    }

    function currentBanner() {
      return drafts.get(slot.value) || savedBanner(slot.value);
    }

    function updateFramingControls() {
      const device = frame.dataset.device;
      const settings = currentBanner().framing[device];
      deviceLabel.textContent = device === "mobile" ? "Điện thoại" : "Máy tính";
      for (const input of layoutInputs) {
        input.value = settings[input.name];
        const value = form.querySelector(`[data-banner-value="${input.name}"]`);
        if (value) value.textContent = settings[input.name] + "%";
      }
      applyBannerFrame(preview, settings);
    }

    function updateDraftState() {
      const draft = drafts.has(slot.value);
      for (const option of slot.options) {
        option.textContent = `Banner ${option.value}${drafts.has(option.value) ? " · Chưa lưu" : ""}`;
      }
      save.disabled = !draft || preview.hidden || reading || saving;
      discard.disabled = !draft;
      status.textContent = saving ? "Đang lưu…" : reading ? "Đang đọc tệp…" :
        draft ? "Có thay đổi chưa lưu." : "Đang dùng ảnh đã lưu.";
      updateFramingControls();
    }

    async function renderPreview() {
      const version = ++previewVersion;
      const source = storefrontImageUrl(currentBanner().image);
      preview.hidden = true;
      updateDraftState();
      previewState.hidden = false;
      previewState.textContent = "Đang tải ảnh…";
      const image = new Image();
      image.src = source;
      try {
        await image.decode();
      } catch {
        if (version !== previewVersion) return;
        previewState.textContent = "Không tải được ảnh. Kiểm tra lại tệp hoặc URL.";
        return;
      }
      if (version !== previewVersion) return;
      preview.src = source;
      preview.hidden = false;
      previewState.hidden = true;
      updateDraftState();
    }

    function setDraft(banner) {
      if (JSON.stringify(banner) === JSON.stringify(savedBanner(slot.value))) drafts.delete(slot.value);
      else drafts.set(slot.value, banner);
    }

    function changeFraming(settings) {
      const current = currentBanner();
      setDraft({ ...current, framing: { ...current.framing, [frame.dataset.device]: settings } });
      updateDraftState();
    }

    function resetInputs() {
      file.value = "";
      const image = drafts.get(slot.value)?.image;
      url.value = /^https?:\/\//i.test(image || "") ? image : "";
    }

    slot.addEventListener("change", () => {
      resetInputs();
      renderPreview();
    });
    file.addEventListener("change", async () => {
      const selected = file.files[0];
      if (!selected) return;
      reading = true;
      form.inert = true;
      renderPreview();
      try {
        const source = await readStorefrontImage(selected);
        setDraft({ ...currentBanner(), image: source });
        url.value = "";
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        reading = false;
        form.inert = false;
        file.value = "";
        renderPreview();
      }
    });

    form.querySelector('[data-banner-action="url"]').addEventListener("click", () => {
      const source = url.value.trim();
      if (!/^https?:\/\//i.test(source) || !url.checkValidity()) {
        showToast("Nhập URL ảnh hợp lệ bắt đầu bằng http:// hoặc https://.", "error");
        return;
      }
      setDraft({ ...currentBanner(), image: source });
      renderPreview();
    });
    for (const input of layoutInputs) {
      input.addEventListener("input", () => {
        const frameSettings = currentBanner().framing[frame.dataset.device];
        const value = input.name === "fit" ? input.value : Number(input.value);
        changeFraming({ ...frameSettings, [input.name]: value });
      });
    }
    form.querySelector('[data-banner-action="reset-frame"]').addEventListener("click", () => {
      changeFraming(defaultBannerFrame);
    });
    discard.addEventListener("click", () => {
      drafts.delete(slot.value);
      resetInputs();
      renderPreview();
    });
    form.querySelector('[data-banner-action="restore"]').addEventListener("click", () => {
      url.value = "";
      setDraft({ image: original(slot.value), framing: { desktop: defaultBannerFrame, mobile: defaultBannerFrame } });
      renderPreview();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const index = slot.value;
      const draft = drafts.get(index);
      if (!draft || save.disabled || saving) return;
      if (url.value.trim() && url.value.trim() !== draft.image) {
        showToast("Bấm “Xem ảnh từ URL” để kiểm tra URL mới trước khi lưu.", "error");
        return;
      }
      form.inert = true;
      saving = true;
      status.textContent = "Đang lưu…";
      try {
        const result = await api.put(`/home-banners/${index}`, draft);
        published[index] = result;
        drafts.delete(index);
        resetInputs();
        showToast(`Đã lưu banner ${index}.`, "success");
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        saving = false;
        form.inert = false;
        renderPreview();
      }
    });
    const devices = workspace.querySelectorAll("[data-banner-device]");
    devices.forEach((button) => button.addEventListener("click", () => {
      frame.dataset.device = button.dataset.bannerDevice;
      devices.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      if (published) updateFramingControls();
    }));
    renderPreview();
  }

  function initTopbarControls() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    const nameEl = document.getElementById("adminTopName");
    if (nameEl && user && user.role === "ADMIN" && user.full_name) {
      nameEl.textContent = "Admin";
    }

    const userBtn = document.getElementById("btnAdminUserMenu");
    const dropdown = document.getElementById("adminUserDropdown");
    userBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("is-open");
    });

    document.addEventListener("click", () => {
      dropdown?.classList.remove("is-open");
    });

    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });

    const sidebar = document.getElementById("adminSidebar");
    document.getElementById("btnToggleAdminSidebar")?.addEventListener("click", () => {
      sidebar?.classList.toggle("is-open");
    });
  }

  function renderKpisAndTasks() {
    const store = window.tsportStore;
    if (!store) return;

    const orders = store.getOrders() || [];
    const bookings = store.getBookings() || [];
    const buybacks = store.getBuybacks() || [];
    const products = store.getProducts({ status: "ACTIVE" }) || [];

    const pendingOrders = orders.filter((o) => o.status === "PENDING");
    const pendingBookings = bookings.filter((b) => b.status === "PENDING");
    const pendingBuybacks = buybacks.filter((b) => b.status === "PENDING" || b.status === "CHO_DUYET");

    let outOfStockSkus = 0;
    products.forEach((p) => {
      (p.skus || []).forEach((s) => {
        if (Number(s.stock) <= 0) outOfStockSkus++;
      });
    });

    const elOrders = document.getElementById("kpiPendingOrders");
    const elBookings = document.getElementById("kpiPendingBookings");
    const elBuybacks = document.getElementById("kpiPendingBuybacks");
    const elSkus = document.getElementById("kpiOutOfStockSkus");

    if (elOrders) elOrders.textContent = pad2(pendingOrders.length);
    if (elBookings) elBookings.textContent = pad2(pendingBookings.length);
    if (elBuybacks) elBuybacks.textContent = pad2(pendingBuybacks.length);
    if (elSkus) elSkus.textContent = pad2(outOfStockSkus);

    // Tổng hợp danh sách "Công việc cần xử lý"
    const tasks = [];

    pendingBookings.slice(0, 3).forEach((b) => {
      tasks.push({
        type: "Đặt sân",
        customer: b.customer_name || "Khách hàng",
        content: `${b.court_name} • ${formatShortDate(b.booking_date)}`,
        statusLabel: "Chờ xác nhận",
        statusCls: "is-pending",
        href: "admin-courts.html"
      });
    });

    pendingOrders.slice(0, 3).forEach((o) => {
      tasks.push({
        type: "Đơn hàng",
        customer: o.customer_name || "Khách hàng",
        content: o.order_code,
        statusLabel: "Chờ xác nhận",
        statusCls: "is-pending",
        href: "admin-orders.html"
      });
    });

    pendingBuybacks.slice(0, 3).forEach((bb) => {
      tasks.push({
        type: "Thu mua",
        customer: bb.customer_name || "Khách hàng",
        content: bb.product_name,
        statusLabel: "Chờ thẩm định",
        statusCls: "",
        href: "admin-buyback.html"
      });
    });

    // Nếu chưa có công việc chờ nào, hiển thị các mục gần nhất
    if (tasks.length === 0) {
      if (bookings[0]) {
        tasks.push({
          type: "Đặt sân",
          customer: bookings[0].customer_name || "Nguyễn Minh Anh",
          content: `${bookings[0].court_name} • ${formatShortDate(bookings[0].booking_date)}`,
          statusLabel: "Chờ xác nhận",
          statusCls: "is-pending",
          href: "admin-courts.html"
        });
      }
      if (orders[0]) {
        tasks.push({
          type: "Đơn hàng",
          customer: orders[0].customer_name || "Trần Hoàng",
          content: orders[0].order_code,
          statusLabel: "Chờ xác nhận",
          statusCls: "is-pending",
          href: "admin-orders.html"
        });
      }
      if (buybacks[0]) {
        tasks.push({
          type: "Thu mua",
          customer: buybacks[0].customer_name || "Lê Linh",
          content: buybacks[0].product_name,
          statusLabel: "Chờ thẩm định",
          statusCls: "",
          href: "admin-buyback.html"
        });
      }
    }

    const tbody = document.getElementById("adminPendingTasksTbody");
    if (!tbody) return;

    tbody.innerHTML = tasks
      .map(
        (t) => `
        <tr onclick="window.location.href='${t.href}'">
          <td>${escapeHtml(t.type)}</td>
          <td>${escapeHtml(t.customer)}</td>
          <td>${escapeHtml(t.content)}</td>
          <td><span class="ts-orders-v2-status ${t.statusCls}">${escapeHtml(t.statusLabel)}</span></td>
        </tr>
      `
      )
      .join("");
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminDashboard));
})();
