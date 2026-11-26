/**
 * TSPORT — MODULE TỔNG QUAN QUẢN TRỊ (ADMIN DASHBOARD V2 FIGMA)
 * - Hiển thị số liệu vận hành từ backend
 * - Tổng hợp bảng "Công việc cần xử lý" từ Đặt sân, Đơn hàng và Thu mua đồ cũ
 */

(function () {
  function pad2(n) {
    return String(Number(n) || 0).padStart(2, "0");
  }

  function formatShortDate(str) {
    if (!str) return "";
    const parts = String(str).slice(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return str;
  }

  function initAdminDashboard() {
    initTopbarControls();
    loadDashboard();
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
    const original = (index) => `/assets/banner/banner-${index}.jpg${index === "1" ? "?v=2" : ""}`;
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

  }

  async function loadDashboard() {
    const message = document.getElementById("adminDashboardStatus");
    try {
      const [orders, bookings, buybacks, matches, catalog] = await Promise.all([
        api.get("/orders"), api.get("/bookings"), api.get("/buyback-requests"),
        api.get("/admin/match-posts"), api.get("/catalog/bootstrap")
      ]);
      renderKpisAndTasks(orders.map(orderView), bookings, buybacks, catalog.products);
      renderChart([orders, bookings, buybacks, matches]);
      renderMatches(matches);
      message.hidden = true;
    } catch (error) {
      message.textContent = error.message;
    }
  }

  function renderKpisAndTasks(orders, bookings, buybacks, products) {
    const pendingOrders = orders.filter(row => row.status === "PENDING");
    const pendingBookings = bookings.filter(row => row.status === "CHO_XAC_NHAN");
    const pendingBuybacks = buybacks.filter(row => row.status === "PENDING");
    products = products.filter(row => row.status === "ACTIVE");

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
        href: "admin-bookings.html"
      });
    });

    pendingOrders.slice(0, 3).forEach((o) => {
      tasks.push({
        type: "Đơn hàng",
        customer: o.customer_name || "Khách hàng",
        content: o.order_code,
        statusLabel: "Chờ xác nhận",
        statusCls: "is-pending",
        href: "admin-orders.html?code=" + encodeURIComponent(o.order_code)
      });
    });

    pendingBuybacks.slice(0, 3).forEach((bb) => {
      tasks.push({
        type: "Thu mua",
        customer: bb.customer_name || "Khách hàng",
        content: bb.brand_model,
        statusLabel: "Chờ thẩm định",
        statusCls: "",
        href: "admin-buyback.html?id=" + bb.id
      });
    });

    const tbody = document.getElementById("adminPendingTasksTbody");
    if (!tbody) return;

    if (!tasks.length) {
      tbody.innerHTML = '<tr><td colspan="4">Không có công việc đang chờ xử lý.</td></tr>';
      return;
    }
    tbody.innerHTML = tasks
      .map(
        (t) => `
        <tr>
          <td>${escapeHtml(t.type)}</td>
          <td>${escapeHtml(t.customer)}</td>
          <td><a href="${escapeHtml(t.href)}">${escapeHtml(t.content)}</a></td>
          <td><span class="ts-orders-v2-status ${t.statusCls}">${escapeHtml(t.statusLabel)}</span></td>
        </tr>
      `
      )
      .join("");
  }

  function renderChart(series) {
    const labels = ["Đơn hàng", "Đặt sân", "Thu mua", "Bài ghép kèo"];
    const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric", month: "2-digit", day: "2-digit" });
    const latest = Date.parse(isoDate.format(new Date()) + "T00:00:00Z");
    const days = Array.from({ length: 7 }, (_, index) =>
      new Date(latest - (6 - index) * 86400000).toISOString().slice(0, 10));
    const totals = series.map(rows => {
      const counts = new Map();
      for (const row of rows) {
        const day = row.created_at?.slice(0, 10);
        if (day) counts.set(day, (counts.get(day) || 0) + 1);
      }
      return days.map(day => counts.get(day) || 0);
    });
    const max = Math.max(1, ...totals.flat());
    document.getElementById("adminChartLegend").innerHTML = labels.map((label, index) =>
      `<li class="ts-chart-series-${index}"><i aria-hidden="true"></i>${label}</li>`).join("");
    document.getElementById("adminActivityChart").innerHTML = days.map((day, index) => {
      const shortDate = formatShortDate(day).slice(0, 5);
      const summary = labels.map((label, type) => `${label} ${totals[type][index]}`).join(", ");
      return `<li aria-label="${shortDate}, ${summary}" title="${summary}">
        <div class="ts-chart-bars" aria-hidden="true">${totals.map((values, type) =>
          `<span class="ts-chart-series-${type}" style="--bar-height:${values[index] / max * 100}%">${values[index] ? "<b>" + values[index] + "</b>" : ""}</span>`).join("")}</div>
        <time datetime="${day}">${shortDate}</time></li>`;
    }).join("");
  }

  function renderMatches(matches) {
    const statuses = { OPEN: "Đang tuyển", FULL: "Đã đủ người", CLOSED: "Đã đóng",
      CANCELLED: "Đã hủy", EXPIRED: "Đã qua giờ" };
    const tbody = document.getElementById("adminMatchesTbody");
    const pagination = document.getElementById("adminMatchesPagination");
    const pageSize = 10;
    function renderPage(page) {
      tbody.innerHTML = matches.slice((page - 1) * pageSize, page * pageSize).map(row =>
        `<tr><td>${escapeHtml(row.customer_name)}</td><td>${escapeHtml(row.location)}</td>
         <td>${escapeHtml(formatShortDate(row.match_time))} ${escapeHtml(row.match_time.slice(11, 16))}</td>
         <td>${escapeHtml(statuses[row.registration_status])}</td>
         <td>${row.participants.length ? escapeHtml(row.participants.join(", ")) : "—"}</td></tr>`
      ).join("") || '<tr><td colspan="5">Chưa có bài ghép kèo.</td></tr>';
      renderCompactPagination(pagination, Math.ceil(matches.length / pageSize), page);
    }
    pagination.addEventListener("click", event => {
      const button = event.target.closest("button[data-page]");
      if (button && !button.disabled) renderPage(Number(button.dataset.page));
    });
    renderPage(1);
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
