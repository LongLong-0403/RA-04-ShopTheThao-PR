/**
 * TSPORT — MODULE TRANG CHỦ (HOME STOREFRONT)
 * Quản lý: Banner, Các môn thể thao, Sản phẩm mới & Bán chạy,
 * Khu hàng đã qua sử dụng, Lối vào dịch vụ (đặt sân, tìm bạn, thu mua),
 * Gợi ý tìm kiếm Debounce, Sản phẩm đã xem gần đây (localStorage).
 */

(function () {
  let searchDebounceTimer = null;

  function initHome() {
    updateHeaderUser();
    updateCartBadge();
    renderSportsList();
    renderFeaturedProducts();
    renderUsedProducts();
    renderRecentlyViewed();
    initSearchDebounce();
  }

  // 1. CẬP NHẬT THÔNG TIN NGƯỜI DÙNG & GIỎ HÀNG TRÊN HEADER
  function updateHeaderUser() {
    const userRaw = localStorage.getItem("tsport_current_user");
    const userWrap = document.getElementById("headerUserWrap");
    if (!userWrap) return;

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const isAdmin = user.role === "ADMIN" || (user.email && user.email.toLowerCase().includes("admin"));
        userWrap.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <a href="pages/${isAdmin ? 'admin-dashboard.html' : 'account.html'}" class="btn btn-secondary btn-sm" style="font-weight:700;">
              <span>${isAdmin ? '🛡️' : '👤'}</span>
              <span>${escapeHtml(user.full_name || user.email)}</span>
              ${isAdmin ? '<span class="badge" style="background:#D94C26; color:#fff; font-size:10px;">ADMIN</span>' : ''}
            </a>
            <button type="button" class="btn btn-secondary btn-sm" id="btnHomeLogout" title="Đăng xuất" style="padding:6px 10px; color:#DC2626;">✕</button>
          </div>
        `;
        document.getElementById("btnHomeLogout")?.addEventListener("click", () => {
          localStorage.removeItem("tsport_current_user");
          localStorage.removeItem("token");
          localStorage.removeItem("tsport_token");
          showToast("Đã đăng xuất tài khoản!", "info");
          updateHeaderUser();
        });
        return;
      } catch (_) {}
    }

    userWrap.innerHTML = `
      <a href="pages/auth.html" class="btn btn-secondary btn-sm" style="font-weight:700;">
        <span>👤</span>
        <span>Đăng nhập / Đăng ký</span>
      </a>
    `;
  }

  function updateCartBadge() {
    const store = window.tsportStore;
    if (!store) return;
    const totals = store.getCartTotals();
    document.querySelectorAll(".js-cart-count").forEach((el) => {
      el.textContent = totals.totalItems;
    });
  }

  // 2. RENDER DANH SÁCH MÔN THỂ THAO
  function renderSportsList() {
    const store = window.tsportStore;
    const container = document.getElementById("homeSportsGrid");
    if (!container || !store) return;

    const sports = store.getSports() || [];
    const products = store.getProducts() || [];

    const sportIcons = {
      1: "🏸", // Cầu lông
      2: "⚽", // Bóng đá
      3: "🎾", // Tennis
      4: "🏓", // Pickleball
      5: "🏀", // Bóng rổ
      6: "🏓"  // Bóng bàn
    };

    container.innerHTML = sports.map((s) => {
      const count = products.filter((p) => p.sport_id === s.id).length;
      return `
        <a href="pages/shop.html?sport=${s.id}" class="tsport-sport-pill">
          <div class="tsport-sport-icon">${sportIcons[s.id] || "🏅"}</div>
          <div class="tsport-sport-name">${escapeHtml(s.name)}</div>
          <div class="tsport-sport-count">${count} sản phẩm</div>
        </a>
      `;
    }).join("");
  }

  // 3. RENDER SẢN PHẨM MỚI VỀ & BÁN CHẠY (BEST SELLERS)
  function renderFeaturedProducts() {
    const store = window.tsportStore;
    const grid = document.getElementById("homeFeaturedGrid");
    if (!grid || !store) return;

    const products = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    // Lấy 8 sản phẩm hàng mới tiêu biểu
    const newProducts = products.filter(p => p.condition_type !== "CU").slice(0, 8);

    grid.innerHTML = newProducts.map((p) => renderProductCardHtml(p)).join("");
  }

  // 4. RENDER KHU HÀNG ĐÃ QUA SỬ DỤNG MINH BẠCH (USED PRODUCTS)
  function renderUsedProducts() {
    const store = window.tsportStore;
    const grid = document.getElementById("homeUsedGrid");
    if (!grid || !store) return;

    const products = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    const usedProducts = products.filter(p => p.condition_type === "CU").slice(0, 4);

    if (usedProducts.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748B;">Hiện đang cập nhật thêm hàng cũ minh bạch từ chương trình Thu Mua...</div>`;
      return;
    }

    grid.innerHTML = usedProducts.map((p) => renderProductCardHtml(p, true)).join("");
  }

  // HÀM TẠO HTML CARD SẢN PHẨM DÙNG CHUNG
  function renderProductCardHtml(p, isUsedSection = false) {
    const store = window.tsportStore;
    const primaryImg = (p.images && p.images.find(i => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
    const brand = store ? store.getBrandById(p.brand_id) : null;
    const ratingInfo = store ? store.getProductRating(p.id) : { avgRating: 5.0, count: 0 };

    const skus = p.skus || [];
    const hasSale = skus.some(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
    const effectivePrices = skus.map(s => (s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price)) ? Number(s.sale_price) : Number(s.price));
    const minEffectivePrice = effectivePrices.length ? Math.min(...effectivePrices) : 0;
    const minOriginalPrice = skus.length ? Math.min(...skus.map(s => Number(s.price))) : 0;
    const maxDiscountPct = hasSale
      ? Math.max(...skus.filter(s => s.sale_price && s.sale_price < s.price).map(s => Math.round((1 - s.sale_price / s.price) * 100)))
      : 0;

    const isUsed = p.condition_type === "CU";
    const wearGrade = p.specifications?.condition_grade || "90%";

    return `
      <div class="tsport-product-card">
        <a href="pages/product-detail.html?id=${p.id}" class="tsport-product-thumb">
          <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
          <div class="tsport-card-badges">
            <span class="tsport-badge-condition ${isUsed ? 'cu' : 'moi'}">
              ${isUsed ? `ĐỒ CŨ (~${wearGrade})` : 'HÀNG MỚI 100%'}
            </span>
            ${hasSale ? `<span class="tsport-badge-condition" style="background:#EF4444; color:#fff; font-weight:800;">-${maxDiscountPct}% SALE</span>` : ''}
          </div>
        </a>

        <div class="tsport-product-info">
          <div class="tsport-product-brand">${escapeHtml(brand ? brand.name : 'Tsport')}</div>
          <h3 class="tsport-product-name" title="${escapeHtml(p.name)}">
            <a href="pages/product-detail.html?id=${p.id}" style="color:inherit; text-decoration:none;">${escapeHtml(p.name)}</a>
          </h3>

          <div style="display:flex; align-items:center; gap:6px; font-size:12px; margin:4px 0;">
            <span style="color:#F59E0B; font-weight:800;">★ ${ratingInfo.avgRating}</span>
            <span style="color:#64748B; font-size:11px;">(${ratingInfo.count} đánh giá)</span>
          </div>

          ${isUsed && p.wear_description ? `
            <div style="font-size:11px; color:#9A3412; background:#FFEDD5; padding:4px 8px; border-radius:4px; margin:4px 0; line-height:1.3;" title="${escapeHtml(p.wear_description)}">
              🔍 <strong>Mô tả hao mòn:</strong> ${escapeHtml(p.wear_description.length > 55 ? p.wear_description.slice(0, 52) + '...' : p.wear_description)}
            </div>
          ` : ''}

          <div class="tsport-product-bottom" style="margin-top:auto; padding-top:8px;">
            <div class="tsport-product-price">
              ${hasSale 
                ? `<span>${formatMoney(minEffectivePrice)}</span> <del style="font-size:12px; color:#94A3B8; font-weight:normal; margin-left:4px;">${formatMoney(minOriginalPrice)}</del>`
                : formatMoney(minEffectivePrice)
              }
            </div>
            <a href="pages/product-detail.html?id=${p.id}" class="btn btn-secondary btn-sm" style="font-weight:700; padding:4px 10px; font-size:12px; color:#D94C26;">
              Xem →
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 5. RENDER SẢN PHẨM ĐÃ XEM GẦN ĐÂY (LOCALSTORAGE)
  function renderRecentlyViewed() {
    const store = window.tsportStore;
    const wrap = document.getElementById("homeRecentWrap");
    const container = document.getElementById("homeRecentScroll");
    if (!container || !store) return;

    try {
      const recentIds = JSON.parse(localStorage.getItem("tsport_recent_views") || "[]");
      if (!Array.isArray(recentIds) || recentIds.length === 0) {
        if (wrap) wrap.style.display = "none";
        return;
      }

      const products = recentIds
        .map(id => store.getProductById(id))
        .filter(p => p && p.status !== "INACTIVE");

      if (products.length === 0) {
        if (wrap) wrap.style.display = "none";
        return;
      }

      if (wrap) wrap.style.display = "block";
      container.innerHTML = products.map((p) => {
        const primaryImg = (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300" };
        const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.sale_price && s.sale_price < s.price ? s.sale_price : s.price)) : 0;
        return `
          <a href="pages/product-detail.html?id=${p.id}" class="tsport-recent-card">
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" class="tsport-recent-img" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
            <div style="font-size:12px; font-weight:700; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.name)}">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size:12px; font-weight:800; color:#D94C26; margin-top:4px;">
              ${formatMoney(minPrice)}
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (wrap) wrap.style.display = "none";
    }
  }

  // 6. TÌM KIẾM GỢI Ý THÔNG MINH (DEBOUNCE 250MS)
  function initSearchDebounce() {
    const input = document.getElementById("homeSearchInput");
    const dropdown = document.getElementById("homeSearchDropdown");
    const form = document.getElementById("homeSearchForm");
    const store = window.tsportStore;
    if (!input || !dropdown || !store) return;

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) {
        window.location.href = `pages/shop.html?search=${encodeURIComponent(q)}`;
      }
    });

    input.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      const query = input.value.trim().toLowerCase();

      if (!query || query.length < 2) {
        dropdown.classList.remove("is-open");
        dropdown.innerHTML = "";
        return;
      }

      searchDebounceTimer = setTimeout(() => {
        const allProducts = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
        const brands = store.getBrands() || [];
        const sports = store.getSports() || [];

        const matches = allProducts.filter((p) => {
          const brand = brands.find(b => b.id === p.brand_id);
          const sport = sports.find(s => s.id === p.sport_id);
          const searchCorpus = `${p.name} ${brand ? brand.name : ''} ${sport ? sport.name : ''} ${p.description || ''}`.toLowerCase();
          return searchCorpus.includes(query);
        }).slice(0, 5);

        if (matches.length === 0) {
          dropdown.innerHTML = `
            <div style="padding:16px; text-align:center; color:#64748B; font-size:13px;">
              Không tìm thấy sản phẩm nào khớp với "<strong>${escapeHtml(query)}</strong>"
            </div>
          `;
          dropdown.classList.add("is-open");
          return;
        }

        dropdown.innerHTML = `
          <div style="padding:8px 14px; background:#F8FAFC; border-bottom:1px solid #E2E8F0; font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">
            Gợi ý sản phẩm phù hợp (${matches.length})
          </div>
          ${matches.map((p) => {
            const img = (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100" };
            const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.sale_price && s.sale_price < s.price ? s.sale_price : s.price)) : 0;
            return `
              <a href="pages/product-detail.html?id=${p.id}" class="tsport-search-dropdown-item">
                <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(p.name)}" class="tsport-search-dropdown-thumb" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100'" />
                <div class="tsport-search-dropdown-info">
                  <div class="tsport-search-dropdown-name">${escapeHtml(p.name)}</div>
                  <div class="tsport-search-dropdown-price">${formatMoney(minPrice)}</div>
                </div>
                <span class="badge ${p.condition_type === 'CU' ? 'badge-cu' : 'badge-moi'}" style="font-size:10px;">
                  ${p.condition_type === 'CU' ? 'Đồ cũ' : 'Mới'}
                </span>
              </a>
            `;
          }).join("")}
          <a href="pages/shop.html?search=${encodeURIComponent(query)}" style="display:block; text-align:center; padding:10px; font-size:12px; font-weight:700; color:#D94C26; background:#FFF1EB; text-decoration:none;">
            Xem tất cả kết quả cho "${escapeHtml(query)}" →
          </a>
        `;
        dropdown.classList.add("is-open");
      }, 250);
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("is-open");
      }
    });
  }

  function formatMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + " ₫";
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

  document.addEventListener("DOMContentLoaded", initHome);
})();
