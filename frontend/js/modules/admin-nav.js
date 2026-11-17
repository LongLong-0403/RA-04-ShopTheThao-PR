/**
 * TSPORT — MODULE ADMIN LAYOUT & SIDEBAR NAVIGATION
 * Hỗ trợ responsive đa màn hình: 390px / 768px / 1366px
 */

(function () {
  function initAdminNav() {
    const sidebar = document.getElementById("adminSidebar");
    const backdrop = document.getElementById("adminSidebarBackdrop");
    const openBtn = document.getElementById("btnToggleAdminSidebar");
    const closeBtn = document.getElementById("btnCloseAdminSidebar");

    function openSidebar() {
      if (sidebar) sidebar.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    openBtn?.addEventListener("click", openSidebar);
    closeBtn?.addEventListener("click", closeSidebar);
    backdrop?.addEventListener("click", closeSidebar);

    // Tự động highlight mục menu đang mở
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll(".tsport-admin-nav-item").forEach((item) => {
      const href = item.getAttribute("href")?.toLowerCase();
      if (href && currentPath.endsWith(href)) {
        item.classList.add("is-active");
      }
    });

    // Cập nhật thông tin Admin từ localStorage
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    const adminName = document.getElementById("adminLoggedName");
    const adminEmail = document.getElementById("adminLoggedEmail");
    if (adminName && user) adminName.textContent = user.full_name || user.email;
    if (adminEmail && user) adminEmail.textContent = user.email;
  }

  document.addEventListener("DOMContentLoaded", initAdminNav);
})();
