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
    initTabbedShowcase();
    initHomeCourtsShowcase();
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

  // 2. RENDER SẢN PHẨM MỚI (KÉO CHUỘT TRÁI / PHẢI MƯỢT MÀ VỚI QUÁN TÍNH GSAP)
  function renderFeaturedProducts() {
    const store = window.tsportStore;
    const grid = document.getElementById("homeFeaturedGrid");
    if (!grid || !store) return;

    const products = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    const newProducts = products.filter(p => p.condition_type !== "CU");

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
        <a href="pages/product-detail.html?id=${p.id}" class="ts-min-product-card js-gsap-card" draggable="false">
          <div class="ts-min-product-media">
            <span class="ts-min-product-badge">Mới</span>
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" draggable="false" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
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

    bindMouseDragScroll(document.getElementById("homeFeaturedViewport"));
  }

  // HELPER DÙNG CHUNG: KÉO CHUỘT TRÁI/PHẢI CÓ QUÁN TÍNH GSAP 3
  function bindMouseDragScroll(viewport) {
    if (!viewport || viewport.dataset.dragBound === "true") return;
    viewport.dataset.dragBound = "true";

    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let lastPageX = 0;
    let velocity = 0;

    viewport.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      lastPageX = e.pageX;
      startScrollLeft = viewport.scrollLeft;
      velocity = 0;
      if (typeof window.gsap !== "undefined") {
        window.gsap.killTweensOf(viewport);
      }
      viewport.classList.add("is-dragging");
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 5) {
        hasDragged = true;
      }
      velocity = e.pageX - lastPageX;
      lastPageX = e.pageX;
      viewport.scrollLeft = startScrollLeft - dx * 1.15;
    });

    function endDrag() {
      if (!isDown) return;
      isDown = false;
      viewport.classList.remove("is-dragging");

      if (Math.abs(velocity) > 1.5 && typeof window.gsap !== "undefined") {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        const target = Math.max(0, Math.min(maxScroll, viewport.scrollLeft - velocity * 14));
        window.gsap.to(viewport, {
          scrollLeft: target,
          duration: 0.65,
          ease: "power3.out"
        });
      }
    }

    window.addEventListener("mouseup", endDrag);
    viewport.addEventListener("mouseleave", endDrag);

    viewport.addEventListener("click", (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    viewport.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.shiftKey) {
        e.preventDefault();
        viewport.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // 2B. KHỐI LỌC SẢN PHẨM THEO DANH MỤC (CHUYỂN ĐỘNG MƯỢT TỪ PHẢI QUA TRÁI 1S BẰNG GSAP 3)
  function initTabbedShowcase() {
    const tabsWrap = document.getElementById("homeCategoryTabs");
    const stage = document.getElementById("homeTabBoxStage");
    const track = document.getElementById("homeTabBoxGrid");
    const btnPrev = document.getElementById("btnTabBoxPrev");
    const btnNext = document.getElementById("btnTabBoxNext");
    const store = window.tsportStore;
    if (!tabsWrap || !track || !store) return;

    let activeFilter = "ALL";
    let isAnimating = false;
    let isHovered = false;
    let autoTimer = null;
    const GAP_PX = 12;

    function getFilteredProducts(filterKey) {
      const all = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
      switch (filterKey) {
        case "VOT_CAULONG":
          return all.filter(p => p.category_id === 2);
        case "VOT_PICKLEBALL":
          return all.filter(p => p.category_id === 4);
        case "GIAY":
          return all.filter(p => [6, 7, 8, 19].includes(p.category_id));
        case "AO_BALO":
          return all.filter(p => [15, 16].includes(p.category_id));
        case "DO_CU":
          return all.filter(p => p.condition_type === "CU");
        case "ALL":
        default:
          return all;
      }
    }

    function buildCardHtml(p) {
      const primaryImg = (p.images && p.images.find(i => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
      const skus = p.skus || [];
      const hasSale = skus.some(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
      const effectivePrices = skus.map(s => (s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price)) ? Number(s.sale_price) : Number(s.price));
      const minEff = effectivePrices.length ? Math.min(...effectivePrices) : 0;
      const maxEff = effectivePrices.length ? Math.max(...effectivePrices) : 0;
      const minOrig = skus.length ? Math.min(...skus.map(s => Number(s.price))) : 0;

      const priceLabel = (minEff !== maxEff)
        ? `${minEff.toLocaleString("vi-VN")} - ${formatMoney(maxEff)}`
        : formatMoney(minEff);

      return `
        <a href="pages/product-detail.html?id=${p.id}" class="ts-tabbox-card">
          <div class="ts-tabbox-img-wrap">
            ${p.condition_type === "CU" ? `<span class="ts-min-product-badge">Đồ cũ</span>` : ""}
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
          </div>
          <h3 class="ts-tabbox-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="ts-tabbox-price-row">
            <span class="ts-tabbox-price">${priceLabel}</span>
            ${hasSale ? `<span class="ts-tabbox-oldprice">${formatMoney(minOrig)}</span>` : ""}
          </div>
        </a>
      `;
    }

    function getStepPx() {
      const firstCard = track.firstElementChild;
      if (!firstCard) return 0;
      return firstCard.getBoundingClientRect().width + GAP_PX;
    }

    function stopAutoSlide() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function scheduleNextSlide() {
      stopAutoSlide();
      if (isHovered || track.children.length <= 1) return;
      autoTimer = setTimeout(() => {
        slideRightToLeft();
      }, 1000);
    }

    // Trượt mượt từ phải qua trái (duration: 1s)
    function slideRightToLeft() {
      if (isAnimating || track.children.length <= 1) return;
      const stepPx = getStepPx();
      if (stepPx <= 0) return;

      isAnimating = true;
      if (typeof window.gsap !== "undefined") {
        window.gsap.to(track, {
          x: -stepPx,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => {
            track.appendChild(track.firstElementChild);
            window.gsap.set(track, { x: 0 });
            isAnimating = false;
            scheduleNextSlide();
          }
        });
      } else {
        track.appendChild(track.firstElementChild);
        isAnimating = false;
        scheduleNextSlide();
      }
    }

    // Trượt ngược từ trái qua phải khi bấm mũi tên trái (duration: 1s)
    function slideLeftToRight() {
      if (isAnimating || track.children.length <= 1) return;
      const stepPx = getStepPx();
      if (stepPx <= 0) return;

      isAnimating = true;
      if (typeof window.gsap !== "undefined") {
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        window.gsap.set(track, { x: -stepPx });
        window.gsap.to(track, {
          x: 0,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => {
            isAnimating = false;
            scheduleNextSlide();
          }
        });
      } else {
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        isAnimating = false;
        scheduleNextSlide();
      }
    }

    function renderTrack(animateEntrance = false) {
      stopAutoSlide();
      isAnimating = false;
      if (typeof window.gsap !== "undefined") {
        window.gsap.killTweensOf(track);
        window.gsap.set(track, { x: 0 });
      }

      const list = getFilteredProducts(activeFilter);
      if (list.length === 0) {
        btnPrev?.classList.add("is-hidden");
        btnNext?.classList.add("is-hidden");
        track.innerHTML = `<div style="width:100%; background:#fff; border-radius:4px; padding:32px; text-align:center; color:#6B7280; font-size:13.5px;">Chưa có sản phẩm trong mục này.</div>`;
        return;
      }

      // Nhân bản mượt nếu danh sách lọc có ít hơn 6 sản phẩm để vòng trượt phải -> trái luôn kín khung
      let trackItems = [...list];
      if (list.length > 1) {
        while (trackItems.length < 7) {
          trackItems = trackItems.concat(list);
        }
      }

      const canSlide = trackItems.length > 1;
      btnPrev?.classList.toggle("is-hidden", !canSlide);
      btnNext?.classList.toggle("is-hidden", !canSlide);

      track.innerHTML = trackItems.map(buildCardHtml).join("");

      if (animateEntrance && typeof window.gsap !== "undefined") {
        window.gsap.from(track.querySelectorAll(".ts-tabbox-card"), {
          x: 56,
          opacity: 0,
          duration: 1,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform,opacity",
          onComplete: scheduleNextSlide
        });
      } else {
        scheduleNextSlide();
      }
    }

    tabsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-tabbox-tab");
      if (!btn) return;
      tabsWrap.querySelectorAll(".ts-tabbox-tab").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      activeFilter = btn.dataset.filter || "ALL";
      renderTrack(true);
    });

    btnNext?.addEventListener("click", () => {
      stopAutoSlide();
      slideRightToLeft();
    });

    btnPrev?.addEventListener("click", () => {
      stopAutoSlide();
      slideLeftToRight();
    });

    stage?.addEventListener("mouseenter", () => {
      isHovered = true;
      stopAutoSlide();
    });

    stage?.addEventListener("mouseleave", () => {
      isHovered = false;
      scheduleNextSlide();
    });

    renderTrack(false);
  }

  // 2C. MỤC 03 / RA SÂN — DANH SÁCH ẢNH CỤM SÂN CỤ THỂ LƯỚT BẰNG CHUỘT
  function initHomeCourtsShowcase() {
    const viewport = document.getElementById("homeCourtsViewport");
    const track = document.getElementById("homeCourtsTrack");
    const filtersWrap = document.getElementById("homeCourtSportFilters");
    const store = window.tsportStore;
    if (!viewport || !track || !store) return;

    let currentSport = "ALL";

    function renderCourts(animate = false) {
      let courts = store.getCourts() || [];
      if (currentSport !== "ALL") {
        courts = courts.filter(c => c.sport_id === Number(currentSport));
      }

      if (courts.length === 0) {
        track.innerHTML = `<div style="width:100%; padding:28px; text-align:center; color:#6B7280; font-size:13.5px; border:1px dashed #E5E7EB; border-radius:10px;">Chưa có cụm sân thuộc môn này.</div>`;
        return;
      }

      track.innerHTML = courts.map((c) => {
        const rating = c.rating ? Number(c.rating).toFixed(1) : "5.0";
        const distance = c.distance || "150m";
        const hours = c.opening_hours || "06:00 - 23:00";
        const img = c.image_url || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800";
        const logo = c.logo_url || "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120";

        return `
          <div class="tsport-court-card" draggable="false">
            <div class="tsport-court-media">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(c.name)}" loading="lazy" draggable="false" />
              <div class="tsport-court-overlay-top-left">
                <span class="tsport-court-badge-rating">★ ${rating}</span>
                <span class="tsport-court-badge-type">Đơn ngày</span>
                <span class="tsport-court-badge-event">Sự kiện</span>
              </div>
              <div class="tsport-court-overlay-top-right">
                <button type="button" class="tsport-court-btn-round js-home-court-fav" title="Yêu thích">♡</button>
                <a href="pages/courts.html?sport=${c.sport_id}" class="tsport-court-btn-round" title="Xem sân" style="text-decoration:none;">↗</a>
              </div>
            </div>
            <div class="tsport-court-body">
              <img class="tsport-court-avatar" src="${escapeHtml(logo)}" alt="Logo" draggable="false" onerror="this.src='https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120'" />
              <div class="tsport-court-info">
                <h3 class="tsport-court-title" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</h3>
                <div class="tsport-court-meta" title="${escapeHtml(c.address || '')}">
                  <span class="tsport-court-distance">[${escapeHtml(distance)}]</span>
                  <span>${escapeHtml(c.address || '')}</span>
                </div>
                <div class="tsport-court-hours">
                  <span>${escapeHtml(hours)}</span>
                </div>
              </div>
              <div class="tsport-court-action">
                ${c.has_discount ? `<span class="tsport-court-promo-badge">${escapeHtml(c.discount_label || 'Ưu đãi')}</span>` : ''}
                <a href="pages/courts.html?sport=${c.sport_id}" class="tsport-btn-book-court" style="text-decoration:none;">ĐẶT LỊCH</a>
              </div>
            </div>
          </div>
        `;
      }).join("");

      viewport.scrollLeft = 0;

      if (animate && typeof window.gsap !== "undefined") {
        window.gsap.from(track.querySelectorAll(".tsport-court-card"), {
          x: 32,
          opacity: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          clearProps: "transform,opacity"
        });
      }
    }

    filtersWrap?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-tabbox-tab");
      if (!btn) return;
      filtersWrap.querySelectorAll(".ts-tabbox-tab").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      currentSport = btn.dataset.sport || "ALL";
      renderCourts(true);
    });

    track.addEventListener("click", (e) => {
      const favBtn = e.target.closest(".js-home-court-fav");
      if (!favBtn) return;
      e.preventDefault();
      if (favBtn.textContent === "♡") {
        favBtn.textContent = "♥";
        favBtn.style.color = "#E11D48";
      } else {
        favBtn.textContent = "♡";
        favBtn.style.color = "#0F172A";
      }
    });

    bindMouseDragScroll(viewport);
    renderCourts(false);
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
