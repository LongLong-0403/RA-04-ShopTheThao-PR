/**
 * TSPORT — MODULE ADMIN LAYOUT & SIDEBAR NAVIGATION
 * Hỗ trợ responsive đa màn hình: 390px / 768px / 1366px
 */

(function () {
  function initAdminNav() {
    const sidebar = document.getElementById("adminSidebar");
    if (!sidebar) return;
    sidebar.innerHTML = `
      <div class="tsport-admin-sidebar-header">
        <a href="../index.html" class="tsport-admin-brand">
          <span class="tsport-admin-brand-logo">Tsport</span>
          <span class="tsport-admin-brand-badge">ADMIN</span>
        </a>
        <button type="button" class="tsport-admin-sidebar-close" id="btnCloseAdminSidebar" aria-label="Đóng menu">✕</button>
      </div>

      <nav class="tsport-admin-nav" aria-label="Điều hướng quản trị">
        <div class="tsport-admin-nav-group-title">Tổng quan &amp; Báo cáo</div>
        <a href="admin-dashboard.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">📊</span>
          <span>Bảng điều khiển (Chart.js)</span>
        </a>

        <div class="tsport-admin-nav-group-title">Quản lý Cửa hàng</div>
        <a href="products.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">📦</span>
          <span>Sản phẩm &amp; Bảng SKU</span>
        </a>
        <a href="categories.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">📁</span>
          <span>Môn / Danh mục / Thương hiệu</span>
        </a>
                <a href="admin-discounts.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">🏷️</span>
          <span>Mã giảm giá (Coupons)</span>
        </a>
        <a href="admin-orders.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">📑</span>
          <span>Đơn hàng &amp; In hóa đơn</span>
        </a>

        <div class="tsport-admin-nav-group-title">Dịch vụ &amp; Cộng đồng</div>
        <a href="admin-buyback.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">♻️</span>
          <span>Thu mua đồ cũ (Tạo SKU)</span>
        </a>
        <a href="admin-courts.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">🏸</span>
          <span>Quản lý Đặt sân &amp; Ca</span>
        </a>
        <a href="admin-community.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">👥</span>
          <span>Quản lý Kèo giao lưu</span>
        </a>

        <div class="tsport-admin-nav-group-title">Hệ thống &amp; Tài liệu</div>
        <a href="admin-guide.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">📖</span>
          <span>Hướng dẫn &amp; Liên kết Dịch vụ</span>
        </a>
        <a href="../index.html" class="tsport-admin-nav-item">
          <span class="tsport-admin-nav-icon">🏠</span>
          <span>Về trang chủ Storefront</span>
        </a>
      </nav>

      <div class="tsport-admin-sidebar-footer">
        <div class="tsport-admin-user-info">
          <div class="tsport-admin-avatar">AD</div>
          <div>
            <div style="font-weight:700; font-size:13px; color:#F8FAFC;" id="adminLoggedName">Quản Trị Viên</div>
            <div style="font-size:11px; color:#94A3B8;" id="adminLoggedEmail">admin@tsport.vn</div>
          </div>
        </div>
      </div>
    `;
    const backdrop = document.getElementById("adminSidebarBackdrop");
    const openBtn = document.getElementById("btnToggleAdminSidebar");
    const closeBtn = document.getElementById("btnCloseAdminSidebar");

    const mobile = window.matchMedia("(max-width: 1024px)");
    const main = document.querySelector(".tsport-admin-main");
    let previousOverflow = "";
    let isOpen = false;
    openBtn?.setAttribute("aria-controls", "adminSidebar");
    openBtn?.setAttribute("aria-expanded", "false");

    function syncVisibility() {
      sidebar.inert = mobile.matches && !isOpen;
      if (main) main.inert = mobile.matches && isOpen;
    }
    function openSidebar() {
      if (!mobile.matches || isOpen) return;
      isOpen = true;
      previousOverflow = document.body.style.overflow;
      sidebar.classList.add("is-open");
      backdrop?.classList.add("is-open");
      document.body.style.overflow = "hidden";
      openBtn?.setAttribute("aria-expanded", "true");
      syncVisibility();
      closeBtn?.focus();
    }
    function closeSidebar(restoreFocus = true) {
      if (isOpen) document.body.style.overflow = previousOverflow;
      isOpen = false;
      sidebar.classList.remove("is-open");
      backdrop?.classList.remove("is-open");
      openBtn?.setAttribute("aria-expanded", "false");
      syncVisibility();
      if (restoreFocus && mobile.matches) openBtn?.focus();
    }
    openBtn?.addEventListener("click", openSidebar);
    closeBtn?.addEventListener("click", () => closeSidebar());
    backdrop?.addEventListener("click", () => closeSidebar());
    sidebar.addEventListener("click", event => {
      if (event.target.closest("a") && mobile.matches) closeSidebar(false);
    });
    document.addEventListener("keydown", event => {
      if (!isOpen) return;
      if (event.key === "Escape") closeSidebar();
      if (event.key === "Tab") {
        const items = [...sidebar.querySelectorAll("a[href], button")];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
    mobile.addEventListener("change", () => closeSidebar(false));
    syncVisibility();

    // Tự động highlight mục menu đang mở
    const currentPath = window.location.pathname.toLowerCase();
    sidebar.querySelectorAll(".tsport-admin-nav-item").forEach((item) => {
      const href = item.getAttribute("href")?.toLowerCase();
      if (href && currentPath.endsWith(href)) {
        item.classList.add("is-active");
        item.setAttribute("aria-current", "page");
      }
    });

    // Cập nhật thông tin Admin từ localStorage
    let user = null;
    try { user = JSON.parse(localStorage.getItem("tsport_current_user") || "null"); } catch { /* Keep the default profile when storage is unavailable. */ }
    const adminName = document.getElementById("adminLoggedName");
    const adminEmail = document.getElementById("adminLoggedEmail");
    if (adminName && user) adminName.textContent = user.full_name || user.email;
    if (adminEmail && user) adminEmail.textContent = user.email;
  }

  document.addEventListener("DOMContentLoaded", initAdminNav);
})();
