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

function showToast(message, type = "success") {
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
    setTimeout(() => toast.remove(), 220);
  }

  close.addEventListener("click", dismiss);
  toast.append(icon, text, close);
  document.body.appendChild(toast);
  activeToast = toast;
  requestAnimationFrame(() => {
    if (toast === activeToast) text.textContent = message;
  });
  toastTimer = setTimeout(dismiss, 2000);
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
