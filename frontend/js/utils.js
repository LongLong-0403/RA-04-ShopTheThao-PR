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

function showToast(message, type = "success") {
  let toastContainer = document.getElementById("tsportToast");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "tsportToast";
    toastContainer.className = "tsport-toast";
    document.body.appendChild(toastContainer);
  }
  toastContainer.textContent = message;
  toastContainer.className = `tsport-toast is-visible is-${type}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toastContainer.className = "tsport-toast";
  }, 3500);
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
