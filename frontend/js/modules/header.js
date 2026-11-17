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
  }

  document.addEventListener("DOMContentLoaded", initHeader);
})();
