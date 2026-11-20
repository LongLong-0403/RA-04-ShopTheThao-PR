/**
 * TSPORT — MODULE TRANG CHỦ TỐI GIẢN (HOME STOREFRONT + GSAP 3)
 * - Header tối giản không icon thừa
 * - Lưới 5 sản phẩm mới từ store.js
 * - Gợi ý tìm kiếm Debounce 250ms
 * - Sản phẩm đã xem gần đây (localStorage)
 * - Chuyển động GSAP 3 + ScrollTrigger (tôn trọng prefers-reduced-motion)
 */

(function () {
  let searchDebounceTimer = null;

  function initHome() {
    updateHeaderUser();
    updateCartBadge();
    initHeroBannerSlider();
    renderFeaturedProducts();
    renderRecentlyViewed();
    initSearchDebounce();
    initGsapAnimations();
  }

  // 0. SLIDER BANNER CHÍNH FULL ẢNH — CHUYỂN ĐỔI MƯỢT MÀ SAU MỖI 2 GIÂY (GSAP 3)
  function initHeroBannerSlider() {
    const slider = document.getElementById("heroBannerSlider");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll(".ts-hero-slide"));
    const dots = Array.from(slider.querySelectorAll(".ts-hero-dot"));
    if (slides.length <= 1) return;

    let currentIdx = 0;
    let timer = null;
    const hasGsap = typeof window.gsap !== "undefined";

    function goToSlide(nextIdx) {
      if (nextIdx === currentIdx) return;
      const prevSlide = slides[currentIdx];
      const nextSlide = slides[nextIdx];

      dots.forEach((d, i) => d.classList.toggle("is-active", i === nextIdx));

      if (hasGsap) {
        window.gsap.killTweensOf([prevSlide, nextSlide]);
        window.gsap.set(prevSlide, { zIndex: 1, pointerEvents: "none" });
        window.gsap.set(nextSlide, { zIndex: 2, pointerEvents: "auto", opacity: 0, scale: 1.04 });

        window.gsap.to(nextSlide, {
          opacity: 1,
          scale: 1,
          duration: 0.75,
          ease: "power2.inOut",
          onComplete: () => {
            prevSlide.classList.remove("is-active");
            window.gsap.set(prevSlide, { opacity: 0, scale: 1 });
          }
        });
        window.gsap.to(prevSlide, {
          opacity: 0,
          duration: 0.75,
          ease: "power2.inOut"
        });
        nextSlide.classList.add("is-active");
      } else {
        prevSlide.classList.remove("is-active");
        nextSlide.classList.add("is-active");
      }

      currentIdx = nextIdx;
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(() => {
        goToSlide((currentIdx + 1) % slides.length);
      }, 2000);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = Number(dot.dataset.index) || 0;
        goToSlide(idx);
        startTimer();
      });
    });

    slider.addEventListener("mouseenter", stopTimer);
    slider.addEventListener("mouseleave", startTimer);

    startTimer();
  }

  // 1. CẬP NHẬT LIÊN KẾT TÀI KHOẢN (KHÔNG ICON THỪA)
  function updateHeaderUser() {
    const userRaw = localStorage.getItem("tsport_current_user");
    const userWrap = document.getElementById("headerUserWrap");
    if (!userWrap) return;

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const isAdmin = user.role === "ADMIN" || (user.email && user.email.toLowerCase().includes("admin"));
        const displayName = user.full_name || user.email || "Tài khoản";
        userWrap.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <a href="pages/${isAdmin ? 'admin-dashboard.html' : 'account.html'}" class="ts-min-header-link" style="font-weight:700; color:#111827;">
              ${escapeHtml(displayName)}${isAdmin ? ' (Admin)' : ''}
            </a>
            <button type="button" id="btnHomeLogout" style="border:none; background:none; color:#9CA3AF; font-size:12px; cursor:pointer; padding:0;" title="Đăng xuất">Thoát</button>
          </div>
        `;
        document.getElementById("btnHomeLogout")?.addEventListener("click", () => {
          localStorage.removeItem("tsport_current_user");
          localStorage.removeItem("token");
          localStorage.removeItem("tsport_token");
          if (typeof showToast === "function") showToast("Đã đăng xuất tài khoản.", "info");
          updateHeaderUser();
        });
        return;
      } catch (_) {}
    }

    userWrap.innerHTML = `<a href="pages/auth.html" class="ts-min-header-link">Tài khoản</a>`;
  }

  function updateCartBadge() {
    const store = window.tsportStore;
    if (!store) return;
    const totals = store.getCartTotals();
    document.querySelectorAll(".js-cart-count").forEach((el) => {
      el.textContent = totals.totalItems;
    });
  }

  // 2. RENDER 5 SẢN PHẨM MỚI (LƯỚI 5 CỘT CHUẨN ẢNH)
  function renderFeaturedProducts() {
    const store = window.tsportStore;
    const grid = document.getElementById("homeFeaturedGrid");
    if (!grid || !store) return;

    const products = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    const newProducts = products.filter(p => p.condition_type !== "CU").slice(0, 5);

    grid.innerHTML = newProducts.map((p) => {
      const primaryImg = (p.images && p.images.find(i => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
      const skus = p.skus || [];
      const hasSale = skus.some(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
      const effectivePrices = skus.map(s => (s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price)) ? Number(s.sale_price) : Number(s.price));
      const minEffectivePrice = effectivePrices.length ? Math.min(...effectivePrices) : 0;
      const minOriginalPrice = skus.length ? Math.min(...skus.map(s => Number(s.price))) : 0;

      const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))].slice(0, 2).join(", ");
      const metaText = sizes ? `Màu / Size ${sizes} / Chiếc` : "Màu / Size / Đơn vị";

      return `
        <a href="pages/product-detail.html?id=${p.id}" class="ts-min-product-card js-gsap-card">
          <div class="ts-min-product-media">
            <span class="ts-min-product-badge">Mới</span>
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
          </div>
          <h3 class="ts-min-product-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="ts-min-product-meta">${escapeHtml(metaText)}</div>
          <div class="ts-min-product-price">
            <span>${formatMoney(minEffectivePrice)}</span>
            ${hasSale ? `<span class="ts-min-product-oldprice">${formatMoney(minOriginalPrice)}</span>` : ''}
          </div>
        </a>
      `;
    }).join("");
  }

  // 3. SẢN PHẨM ĐÃ XEM GẦN ĐÂY (LOCALSTORAGE)
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
            <div style="font-size:12.5px; font-weight:700; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.name)}">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size:13px; font-weight:800; color:#D94C26; margin-top:4px;">
              ${formatMoney(minPrice)}
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (wrap) wrap.style.display = "none";
    }
  }

  // 4. TÌM KIẾM GỢI Ý THÔNG MINH (DEBOUNCE 250MS)
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
        window.location.href = `pages/shop.html?q=${encodeURIComponent(q)}`;
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
            <div style="padding:14px; text-align:center; color:#6B7280; font-size:13px;">
              Không tìm thấy sản phẩm phù hợp với "<strong>${escapeHtml(query)}</strong>"
            </div>
          `;
          dropdown.classList.add("is-open");
          return;
        }

        dropdown.innerHTML = matches.map((p) => {
          const img = (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100" };
          const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.sale_price && s.sale_price < s.price ? s.sale_price : s.price)) : 0;
          return `
            <a href="pages/product-detail.html?id=${p.id}" class="tsport-search-dropdown-item">
              <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(p.name)}" class="tsport-search-dropdown-thumb" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100'" />
              <div class="tsport-search-dropdown-info">
                <div class="tsport-search-dropdown-name">${escapeHtml(p.name)}</div>
                <div class="tsport-search-dropdown-price">${formatMoney(minPrice)}</div>
              </div>
            </a>
          `;
        }).join("") + `
          <a href="pages/shop.html?q=${encodeURIComponent(query)}" style="display:block; text-align:center; padding:10px; font-size:12px; font-weight:700; color:#D94C26; background:#FFF7ED; text-decoration:none;">
            Xem tất cả kết quả cho "${escapeHtml(query)}" →
          </a>
        `;
        dropdown.classList.add("is-open");
      }, 250);
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("is-open");
      }
    });
  }

  // 5. CHUYỂN ĐỘNG GSAP 3 + SCROLLTRIGGER (THEO SKILL GREENSOCK/GSAP-SKILLS)
  function initGsapAnimations() {
    if (typeof window.gsap === "undefined") return;
    if (typeof window.ScrollTrigger !== "undefined") {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    const mm = window.gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      window.gsap.from(".js-gsap-hero", {
        y: 16,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        clearProps: "transform,opacity"
      });

      window.gsap.from(".js-gsap-usp", {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        delay: 0.12,
        ease: "power2.out",
        clearProps: "transform,opacity"
      });

      if (typeof window.ScrollTrigger !== "undefined") {
        document.querySelectorAll(".js-gsap-section").forEach((sec) => {
          window.gsap.from(sec, {
            y: 18,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: sec,
              start: "top 88%",
              once: true
            }
          });
        });
      }
    });
  }

  function formatMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
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
