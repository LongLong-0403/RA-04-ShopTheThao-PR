// Các hàm tiện ích dùng chung cho hệ thống Tsport

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatMoney(value) {
  if (value === null || value === undefined || isNaN(value)) return "0 ₫";
  return Number(value).toLocaleString("vi-VN") + " ₫";
}

function vietnamTodayISO(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" }).format(now);
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " +
    d.toLocaleDateString("vi-VN");
}

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function storefrontImageUrl(source, apiBase = window.TSPORT_API_BASE) {
  if (!source) return source;
  // Backend seed data historically used /frontend/assets/... URLs. The
  // frontend static server is rooted at frontend/, so that prefix must be
  // removed when an image is rendered in the browser.
  if (source.startsWith("/frontend/assets/")) return source.slice("/frontend".length);
  return source.startsWith("/api/media/") && apiBase ? apiBase.replace(/\/$/, "") + source.slice(4) : source;
}

const defaultBannerFrame = Object.freeze({ fit: "cover", zoom: 100, x: 50, y: 0 });

function bannerFrameFor(framing, device) {
  return { ...defaultBannerFrame, ...framing?.[device] };
}

function applyBannerFrame(image, frame) {
  image.style.setProperty("--banner-fit", frame.fit);
  image.style.setProperty("--banner-x", frame.x + "%");
  image.style.setProperty("--banner-y", frame.y + "%");
  image.style.setProperty("--banner-scale", frame.zoom / 100);
}

function storefrontImageSource(source) {
  if (!window.TSPORT_API_BASE) return source;
  const prefix = window.TSPORT_API_BASE.replace(/\/$/, "") + "/media/";
  return source.startsWith(prefix) ? "/api/media/" + source.slice(prefix.length) : source;
}

function readStorefrontImage(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    return Promise.reject(new Error("Chọn ảnh JPG, PNG hoặc WebP tối đa 4 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
    reader.readAsDataURL(file);
  });
}

let activeToast;
let toastTimer;

function animateProductToCart(image, originButton, scope = document) {
  if (!image?.complete || !image.naturalWidth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const visibleRect = (element) => {
    if (!element?.getClientRects().length || getComputedStyle(element).visibility === "hidden") return null;
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const width = Math.min(window.innerWidth, rect.right) - left;
    const height = Math.min(window.innerHeight, rect.bottom) - top;
    return width > 0 && height > 0 ? { left, top, width, height } : null;
  };

  const target = [...scope.querySelectorAll("a:has(.js-cart-count)")].map(visibleRect).find(Boolean);
  const photo = visibleRect(image);
  const start = photo || visibleRect(originButton);
  if (!target || !start) return;

  const width = Math.min(photo ? 144 : 64, start.width);
  const height = Math.min(photo ? 144 : 64, start.height);
  const x = start.left + start.width / 2;
  const y = start.top + start.height / 2;
  const dx = target.left + target.width / 2 - x;
  const dy = target.top + target.height / 2 - y;
  const arc = Math.min(72, y * 0.45, Math.abs(dx) * 0.14);

  const flight = document.createElement("img");
  flight.src = image.currentSrc || image.src;
  flight.alt = "";
  flight.className = "tsport-cart-flight";
  Object.assign(flight.style, {
    left: (x - width / 2) + "px",
    top: (y - height / 2) + "px",
    width: width + "px",
    height: height + "px"
  });
  document.body.appendChild(flight);

  const pose = (progress) => ({
    transform: `translate3d(${dx * progress}px, ${dy * progress - Math.sin(Math.PI * progress) * arc}px, 0) scale(${1 - 0.89 * progress})`,
    opacity: Math.min(1, (1 - progress) * 4)
  });
  const removeFlight = () => flight.remove();
  const durationMs = 850;
  if (window.gsap) {
    const motion = { progress: 0 };
    window.gsap.to(motion, {
      progress: 1,
      duration: durationMs / 1000,
      ease: "power2.inOut",
      onUpdate: () => Object.assign(flight.style, pose(motion.progress)),
      onComplete: removeFlight,
      onInterrupt: removeFlight
    });
  } else if (flight.animate) {
    const frames = Array.from({ length: 13 }, (_, index) => pose(index / 12));
    flight.animate(frames, { duration: durationMs, easing: "ease-in-out" }).finished.then(removeFlight, removeFlight);
  } else {
    removeFlight();
  }
}

function showToast(message, type = "success", { emphasis, action } = {}) {
  clearTimeout(toastTimer);
  activeToast?.remove();
  const variant = type === "error" || type === "success" ? type : "info";
  const toast = document.createElement("aside");
  toast.id = "tsportToast";
  toast.className = `tsport-toast is-${variant}`;

  const icon = document.createElement("span");
  icon.className = "tsport-toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = { success: "✓", error: "!", info: "i" }[variant];

  const text = document.createElement("span");
  text.className = "tsport-toast-message";
  text.setAttribute("role", variant === "error" ? "alert" : "status");
  text.setAttribute("aria-atomic", "true");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "tsport-toast-close";
  close.setAttribute("aria-label", "Đóng thông báo");
  close.textContent = "×";

  function dismiss() {
    if (toast !== activeToast) return;
    clearTimeout(toastTimer);
    activeToast = null;
    toast.removeAttribute("id");
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 180);
  }

  close.addEventListener("click", dismiss);
  toast.append(icon, text);
  if (action) {
    const link = document.createElement("a");
    link.className = "tsport-toast-action";
    link.href = action.href;
    link.textContent = action.label;
    toast.append(link);
  }
  toast.append(close);
  document.body.appendChild(toast);
  activeToast = toast;
  requestAnimationFrame(() => {
    if (toast !== activeToast) return;
    const content = String(message ?? "");
    const start = emphasis ? content.indexOf(emphasis) : -1;
    if (start === -1) {
      text.textContent = content;
      return;
    }
    const strong = document.createElement("strong");
    strong.textContent = emphasis;
    text.append(content.slice(0, start), strong, content.slice(start + emphasis.length));
  });
  // Tính cả 180 ms hiệu ứng thoát trong 2 giây hiển thị.
  toastTimer = setTimeout(dismiss, 1820);
}

let invalidFormNoticePending = false;
document.addEventListener("invalid", (event) => {
  if (!event.target.form || invalidFormNoticePending) return;
  invalidFormNoticePending = true;
  showToast(event.target.validationMessage || "Vui lòng kiểm tra thông tin đã nhập.", "error");
  queueMicrotask(() => { invalidFormNoticePending = false; });
}, true);

function confirmAction(message, confirmLabel = "Xác nhận") {
  if (document.getElementById("tsportConfirm")) return Promise.resolve(false);

  const dialog = document.createElement("dialog");
  dialog.id = "tsportConfirm";
  dialog.className = "tsport-confirm";
  dialog.setAttribute("aria-labelledby", "tsportConfirmTitle");
  dialog.setAttribute("aria-describedby", "tsportConfirmMessage");
  dialog.innerHTML = `
    <form method="dialog">
      <h2 id="tsportConfirmTitle">Xác nhận thao tác</h2>
      <p id="tsportConfirmMessage"></p>
      <footer class="tsport-confirm-actions">
        <button type="submit" value="cancel" autofocus>Quay lại</button>
        <button type="submit" value="confirm" class="tsport-confirm-submit"></button>
      </footer>
    </form>
  `;
  dialog.querySelector("#tsportConfirmMessage").textContent = message;
  dialog.querySelector(".tsport-confirm-submit").textContent = confirmLabel;
  document.body.appendChild(dialog);

  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      const confirmed = dialog.returnValue === "confirm";
      dialog.remove();
      resolve(confirmed);
    }, { once: true });
    dialog.showModal();
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
}

// Đồng bộ điều kiện lọc với URL Query Params
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, val] of params.entries()) {
    result[key] = val;
  }
  return result;
}

function updateUrlParams(newParams, replace = false) {
  const current = new URLSearchParams(window.location.search);
  for (const [key, val] of Object.entries(newParams)) {
    if (val === null || val === undefined || val === "" || val === "ALL") {
      current.delete(key);
    } else {
      current.set(key, val);
    }
  }
  const newUrl = `${window.location.pathname}${current.toString() ? '?' + current.toString() : ''}`;
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

function initResponsiveDrawer({ toggle, drawer, close, backdrop, breakpoint }) {
  if (!toggle || !drawer) return () => {};
  const mobile = window.matchMedia(`(max-width: ${breakpoint}px)`);
  let opened = false;
  toggle.setAttribute("aria-controls", drawer.id);

  function setOpen(value, restoreFocus = false) {
    opened = value && mobile.matches;
    toggle.setAttribute("aria-expanded", String(opened));
    drawer.classList.toggle("is-open", opened);
    backdrop?.classList.toggle("is-open", opened);
    drawer.inert = mobile.matches && !opened;
    document.documentElement.classList.toggle("ts-drawer-open", opened);
    if (opened) requestAnimationFrame(() => {
      if (opened) (close || drawer).focus({ preventScroll: true });
    });
    else if (restoreFocus && mobile.matches) toggle.focus();
  }

  toggle.addEventListener("click", () => setOpen(!opened, opened));
  close?.addEventListener("click", () => setOpen(false, true));
  backdrop?.addEventListener("click", () => setOpen(false, true));
  drawer.addEventListener("click", (event) => {
    if (opened && event.target.closest("a[href]")) setOpen(false, true);
  });
  drawer.addEventListener("keydown", (event) => {
    if (!opened) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false, true);
    } else if (event.key === "Tab") {
      const items = Array.from(drawer.querySelectorAll("a[href], button, input, select, textarea, [tabindex='0']"))
        .filter((item) => !item.disabled && item.getClientRects().length);
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }
  });
  mobile.addEventListener("change", () => {
    const focusInDrawer = drawer.contains(document.activeElement);
    setOpen(false, focusInDrawer);
  });
  toggle.setAttribute("aria-expanded", "false");
  drawer.inert = mobile.matches;
  return () => { if (opened) setOpen(false, true); };
}

function initAdminDrawer() {
  const drawer = document.querySelector(".ts-adm-sidebar#adminSidebar");
  const toggle = document.getElementById("btnToggleAdminSidebar");
  if (!drawer || !toggle) return;
  let backdrop = document.getElementById("adminSidebarBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "adminSidebarBackdrop";
    backdrop.className = "ts-adm-sidebar-backdrop";
    document.body.append(backdrop);
  }
  backdrop.setAttribute("aria-hidden", "true");
  const close = document.createElement("button");
  close.type = "button";
  close.className = "ts-adm-sidebar-close";
  close.setAttribute("aria-label", "Đóng menu quản trị");
  close.textContent = "×";
  drawer.prepend(close);
  drawer.querySelector("a.is-active")?.setAttribute("aria-current", "page");
  initResponsiveDrawer({ toggle, drawer, close, backdrop, breakpoint: 820 });
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminDrawer();
  for (const region of document.querySelectorAll(".ts-orders-v2-table-wrap")) {
    const table = region.querySelector("table");
    if (!table) continue;
    const observer = new ResizeObserver(() => {
      if (region.scrollWidth > region.clientWidth + 1) {
        region.tabIndex = 0;
        region.setAttribute("role", "region");
        region.setAttribute("aria-label", "Bảng có thể cuộn ngang");
      } else {
        region.removeAttribute("tabindex");
        region.removeAttribute("role");
        region.removeAttribute("aria-label");
      }
    });
    observer.observe(region);
    observer.observe(table);
  }
});

function renderCompactPagination(container, totalPages, currentPage) {
  if (!container) return;
  if (totalPages <= 1) {
    container.replaceChildren();
    return;
  }
  const pages = new Set([1, totalPages - 1, totalPages]);
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  for (let page = start; page < start + 3; page++) pages.add(page);
  const buttons = [];
  function button(page, label, text, disabled = false) {
    const active = page === currentPage;
    return "<button type=\"button\" class=\"ts-shop-page-btn" + (active ? " is-active" : "") +
      "\" data-page=\"" + page + "\" aria-label=\"" + label + "\"" +
      (active ? " aria-current=\"page\"" : "") + (disabled ? " disabled" : "") + ">" + text + "</button>";
  }
  buttons.push(button(currentPage - 1, "Trang trước", "←", currentPage === 1));
  let previous = 0;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (page - previous === 2) buttons.push(button(previous + 1, "Trang " + (previous + 1), previous + 1));
    if (page - previous > 2) buttons.push("<span class=\"ts-page-gap\" aria-hidden=\"true\">…</span>");
    buttons.push(button(page, "Trang " + page, page));
    previous = page;
  }
  buttons.push(button(currentPage + 1, "Trang sau", "→", currentPage === totalPages));
  container.innerHTML = buttons.join("");
}
