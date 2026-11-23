/**
 * TSPORT — MODULE HEADER & MEGA MENU
 */

(function () {
  function initHeader() {
    // Render Mega Menu
    const megaGrid = document.getElementById("desktopMegaGrid");
    if (megaGrid && window.tsportStore) {
      const categories = window.tsportStore.getCategoryTree();
      const brands = window.tsportStore.getBrands();
      const products = window.tsportStore.getProducts({ only_active: true });

      let html = "";
      categories.forEach((cat) => {
        const catProds = products.filter((p) => p.category_id === cat.id || (cat.children && cat.children.some(c => c.id === p.category_id)));
        html += `
          <div class="tsport-mega-col">
            <div class="tsport-mega-col-title">
              <span>🏷️</span>
              <span>${escapeHtml(cat.name)}</span>
            </div>
            <div class="tsport-mega-items">
              ${(cat.children || []).map((sub) => {
                const subCount = products.filter((p) => p.category_id === sub.id).length;
                return `
                  <a href="products.html?category_id=${sub.id}" class="tsport-mega-item">
                    <span>${escapeHtml(sub.name)}</span>
                    <span class="tsport-mega-item-count">(${subCount})</span>
                  </a>
                `;
              }).join("")}
              ${brands.slice(0, 3).map((b) => `
                <a href="products.html?brand_id=${b.id}" class="tsport-mega-item" style="color: #64748B;">
                  <span>• Hãng ${escapeHtml(b.name)}</span>
                </a>
              `).join("")}
            </div>
            <a href="products.html?category_id=${cat.id}" class="tsport-mega-more">
              Xem tất cả ${escapeHtml(cat.name)} →
            </a>
          </div>
        `;
      });
      megaGrid.innerHTML = html;
    }

    // Toggle Mega Menu
    const megaToggleBtns = document.querySelectorAll(".js-toggle-mega");
    const megaMenu = document.getElementById("desktopMegaMenu");
    megaToggleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (megaMenu) megaMenu.classList.toggle("is-open");
      });
    });

    document.addEventListener("click", (e) => {
      if (megaMenu && !megaMenu.contains(e.target) && !e.target.closest(".js-toggle-mega")) {
        megaMenu.classList.remove("is-open");
      }
    });

    // Cập nhật thông tin tài khoản đăng nhập trên Header
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    const userLabel = document.querySelector(".js-header-user-label");
    if (userLabel && user) {
      userLabel.textContent = user.full_name || user.email;
    }

    // Cập nhật số lượng giỏ hàng trên Header
    function updateCartBadge() {
      const cartBadges = document.querySelectorAll(".js-cart-count, .tsport-cart-badge");
      if (window.tsportStore) {
        const count = window.tsportStore.getCartTotals().totalItems;
        cartBadges.forEach((b) => {
          b.textContent = count;
        });
      }
    }
    updateCartBadge();
    window.updateHeaderCartBadge = updateCartBadge;
    initMobileSubpageShell();
  }

  function initMobileSubpageShell() {
    if (document.body.classList.contains("ts-adm-body")) return;
    if (document.querySelector(".ts-mob-header")) return;

    const root = document.body.dataset.root || "../";
    const pageName = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const cartCount = window.tsportStore ? window.tsportStore.getCartTotals().totalItems : 0;

    const isShopTab = ["shop.html", "product-detail.html", "cart.html", "checkout.html"].includes(pageName);
    const isCourtsTab = ["courts.html", "court-detail.html", "community.html", "buyback.html"].includes(pageName);
    const isAccountTab = ["account.html", "orders.html", "my-bookings.html", "my-matches.html", "my-buybacks.html", "auth.html"].includes(pageName);

    const headerEl = document.createElement("header");
    headerEl.className = "ts-mob-header";
    headerEl.setAttribute("aria-label", "Điều hướng di động");
    headerEl.innerHTML = `
      <div class="ts-mob-header-left">
        <button type="button" class="ts-mob-menu-btn" id="btnMobSubMenuOpen" aria-label="Mở menu">
          <span></span><span></span><span></span>
        </button>
        <a href="${root}index.html" class="ts-mob-logo">Tsport</a>
      </div>
      <a href="${root}pages/cart.html" class="ts-mob-cart-link">
        Giỏ (<span class="js-cart-count">${cartCount}</span>)
      </a>
    `;

    const backdropEl = document.createElement("div");
    backdropEl.className = "ts-mob-drawer-backdrop";
    backdropEl.id = "mobSubDrawerBackdrop";

    const drawerEl = document.createElement("aside");
    drawerEl.className = "ts-mob-drawer";
    drawerEl.id = "mobSubDrawer";
    drawerEl.setAttribute("aria-label", "Menu di động");
    drawerEl.innerHTML = `
      <div class="ts-mob-drawer-head">
        <a href="${root}index.html" class="ts-mob-logo">Tsport</a>
        <button type="button" class="ts-mob-drawer-close" id="btnMobSubMenuClose" aria-label="Đóng menu">✕</button>
      </div>
      <nav class="ts-mob-drawer-nav">
        <a href="${root}index.html" class="ts-mob-drawer-link">Trang chủ</a>
        <a href="${root}pages/shop.html" class="ts-mob-drawer-link ${pageName === "shop.html" ? "is-active" : ""}">Sản phẩm</a>
        <a href="${root}pages/shop.html?condition=CU" class="ts-mob-drawer-link">Đồ cũ</a>
        <a href="${root}pages/courts.html" class="ts-mob-drawer-link ${pageName === "courts.html" || pageName === "court-detail.html" ? "is-active" : ""}">Đặt sân</a>
        <a href="${root}pages/community.html" class="ts-mob-drawer-link ${pageName === "community.html" ? "is-active" : ""}">Ghép kèo</a>
        <a href="${root}pages/buyback.html" class="ts-mob-drawer-link ${pageName === "buyback.html" ? "is-active" : ""}">Thu mua đồ cũ</a>
        <a href="${root}pages/guide.html" class="ts-mob-drawer-link">Hướng dẫn</a>
        <hr class="ts-mob-drawer-divider" />
        <a href="${root}pages/orders.html" class="ts-mob-drawer-link ${pageName === "orders.html" ? "is-active" : ""}">Đơn hàng của tôi</a>
        <a href="${root}pages/my-bookings.html" class="ts-mob-drawer-link ${pageName === "my-bookings.html" ? "is-active" : ""}">Lịch đặt sân của tôi</a>
        <a href="${root}pages/account.html" class="ts-mob-drawer-link ${pageName === "account.html" ? "is-active" : ""}">Tài khoản</a>
        <a href="${root}pages/admin-dashboard.html" class="ts-mob-drawer-link">Quản trị hệ thống</a>
      </nav>
    `;

    const bottomNavEl = document.createElement("nav");
    bottomNavEl.className = "ts-mob-bottom-nav";
    bottomNavEl.setAttribute("aria-label", "Điều hướng nhanh");
    bottomNavEl.innerHTML = `
      <a href="${root}index.html" class="ts-mob-tab-item">
        <span class="ts-mob-tab-dot"></span>
        <span>Trang chủ</span>
      </a>
      <a href="${root}pages/shop.html" class="ts-mob-tab-item ${isShopTab ? "is-active" : ""}">
        <span class="ts-mob-tab-dot"></span>
        <span>Sản phẩm</span>
      </a>
      <a href="${root}pages/courts.html" class="ts-mob-tab-item ${isCourtsTab ? "is-active" : ""}">
        <span class="ts-mob-tab-dot"></span>
        <span>Đặt sân</span>
      </a>
      <a href="${root}pages/guide.html" class="ts-mob-tab-item"><span class="ts-mob-tab-dot"></span><span>Hướng dẫn</span></a>
      <a href="${root}pages/account.html" class="ts-mob-tab-item ${isAccountTab ? "is-active" : ""}">
        <span class="ts-mob-tab-dot"></span>
        <span>Tài khoản</span>
      </a>
    `;

    document.body.prepend(headerEl);
    document.body.appendChild(backdropEl);
    document.body.appendChild(drawerEl);
    document.body.appendChild(bottomNavEl);

    const openBtn = document.getElementById("btnMobSubMenuOpen");
    const closeBtn = document.getElementById("btnMobSubMenuClose");
    function closeDrawer() {
      drawerEl.classList.remove("is-open");
      backdropEl.classList.remove("is-open");
    }
    openBtn?.addEventListener("click", () => {
      drawerEl.classList.add("is-open");
      backdropEl.classList.add("is-open");
    });
    closeBtn?.addEventListener("click", closeDrawer);
    backdropEl.addEventListener("click", closeDrawer);
  }

  document.addEventListener("DOMContentLoaded", initHeader);
})();
