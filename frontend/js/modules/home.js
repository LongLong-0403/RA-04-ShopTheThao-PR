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

  async function initHome() {
    initHeaderUser();
    updateCartBadge();
    initNavProductsMegaMenu();
    initHeroBannerSlider();
    initSmoothScroll();
    initResponsiveDrawer({
      toggle: document.getElementById("btnMobMenuOpen"),
      drawer: document.getElementById("mobDrawer"),
      close: document.getElementById("btnMobMenuClose"),
      backdrop: document.getElementById("mobDrawerBackdrop"),
      breakpoint: 768
    });
    await window.tsportCatalogReady;
    renderFeaturedProducts();
    initTabbedShowcase();
    initHomeCourtsShowcase();
    initHomeMatchesShowcase();
    initHomeUsedShowcase();
    initHomeFlashSaleShowcase();
    renderRecentlyViewed();
    initSearchDebounce();
    initMobileHome();
    initGsapAnimations();
  }

  // 0a. MEGA MENU TÌM KIẾM SẢN PHẨM KHI DI CHUỘT VÀO "SẢN PHẨM"
  function initNavProductsMegaMenu() {
    const trigger = document.getElementById("navProductsTrigger");
    const menu = document.getElementById("homeProductsMegaMenu");
    if (!trigger || !menu) return;

    let closeTimer = null;

    function openMenu() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      menu.classList.add("is-open");
      trigger.classList.add("is-mega-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function scheduleClose() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        menu.classList.remove("is-open");
        trigger.classList.remove("is-mega-open");
        trigger.setAttribute("aria-expanded", "false");
        closeTimer = null;
      }, 140);
    }

    function closeNow() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      menu.classList.remove("is-open");
      trigger.classList.remove("is-mega-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("mouseenter", openMenu);
    trigger.addEventListener("mouseleave", scheduleClose);
    menu.addEventListener("mouseenter", openMenu);
    menu.addEventListener("mouseleave", scheduleClose);

    trigger.addEventListener("focus", openMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeNow();
      }
    });
    document.addEventListener("click", (e) => {
      if (
        menu.classList.contains("is-open") &&
        !menu.contains(e.target) &&
        !trigger.contains(e.target)
      ) {
        closeNow();
      }
    });
  }

  // 0. SLIDER BANNER CHÍNH FULL ẢNH — CHUYỂN ĐỔI MƯỢT MÀ SAU MỖI 2 GIÂY (GSAP 3)
  function initHeroBannerSlider() {
    const slider = document.getElementById("heroBannerSlider");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll(".ts-hero-slide"));
    const banner = slider.closest(".ts-hero-full-wrap");
    const mobilePlaceholder = document.querySelector("#tsMobileHome .ts-mob-hero-card");
    const desktopPosition = document.createComment("Vị trí banner trên máy tính");
    banner.before(desktopPosition);
    const mobileViewport = window.matchMedia("(max-width: 768px)");
    let published = {};

    function updateBannerFrames() {
      const device = mobileViewport.matches ? "mobile" : "desktop";
      slides.forEach((slide, index) => {
        const image = slide.querySelector("img");
        if (image) applyBannerFrame(image, bannerFrameFor(published[index + 1]?.framing, device));
      });
    }

    function positionBanner() {
      if (mobileViewport.matches && mobilePlaceholder) {
        mobilePlaceholder.before(banner);
        mobilePlaceholder.hidden = true;
      } else {
        desktopPosition.after(banner);
        if (mobilePlaceholder) mobilePlaceholder.hidden = false;
      }
      updateBannerFrames();
    }
    positionBanner();
    mobileViewport.addEventListener("change", () => {
      positionBanner();
      window.ScrollTrigger?.refresh();
    });

    window.api?.get("/home-banners", { include_framing: true }).then((banners) => {
      published = banners;
      slides.forEach((slide, index) => {
        const source = published[index + 1]?.image_url;
        const image = slide.querySelector("img");
        if (!source || !image) return;
        const original = image.getAttribute("src");
        image.addEventListener("error", () => {
          delete published[index + 1];
          image.src = original;
          updateBannerFrames();
        }, { once: true });
        image.src = storefrontImageUrl(source);
      });
      updateBannerFrames();
    }).catch(() => {});
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
  function initHeaderUser() {
    const userWrap = document.getElementById("headerUserWrap");
    if (!userWrap || typeof watchHeaderSession !== "function") return;

    watchHeaderSession((user) => {
      if (!user) {
        userWrap.innerHTML = `<a href="pages/auth.html" class="ts-min-header-link">Tài khoản</a>`;
        return;
      }
      const isAdmin = user.role === "ADMIN";
      const displayName = user.full_name || user.email || "Tài khoản";
      userWrap.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <a href="pages/${isAdmin ? 'admin-dashboard.html' : 'account.html'}" class="ts-min-header-link" style="font-weight:700; color:#111827;">
            ${escapeHtml(displayName)}${isAdmin ? ' (Admin)' : ''}
          </a>
          <button type="button" id="btnHomeLogout" style="border:none; background:none; color:#9CA3AF; font-size:12px; cursor:pointer; padding:0;" title="Đăng xuất">Thoát</button>
        </div>
      `;
      document.getElementById("btnHomeLogout")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const token = getSessionToken();
        button.disabled = true;
        try {
          await api.post("/auth/logout");
        } catch (error) {
          if (error.status !== 401) {
            button.disabled = false;
            if (typeof showToast === "function") showToast(error.message, "error");
            return;
          }
        }
        if (token !== getSessionToken()) return;
        clearLocalSession();
        if (typeof showToast === "function") showToast("Đã đăng xuất tài khoản.", "success");
        location.reload();
      });
    });
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
            <img src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy" draggable="false" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
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
    initFeaturedAutoLeftToRight();
  }

  // TỰ ĐỘNG CHUYỂN ĐỘNG TỪ TRÁI QUA PHẢI (1S) CHO MỤC SẢN PHẨM MỚI BẰNG GSAP 3
  function initFeaturedAutoLeftToRight() {
    const viewport = document.getElementById("homeFeaturedViewport");
    const track = document.getElementById("homeFeaturedGrid");
    if (!viewport || !track || track.dataset.autoLtrBound === "true") return;
    track.dataset.autoLtrBound = "true";

    let isHovered = false;
    let isAnimating = false;
    let timer = null;
    const GAP_PX = 16;

    function stopAuto() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleNext() {
      stopAuto();
      if (isHovered || track.children.length <= 1) return;
      timer = setTimeout(() => {
        slideLeftToRight();
      }, 1000);
    }

    function slideLeftToRight() {
      if (isAnimating || isHovered || track.children.length <= 1) return;
      const firstCard = track.firstElementChild;
      if (!firstCard) return;
      const stepPx = firstCard.getBoundingClientRect().width + GAP_PX;
      if (stepPx <= 0) return;

      isAnimating = true;
      if (typeof window.gsap !== "undefined") {
        // Nếu người dùng đã kéo scrollLeft trước đó thì đưa nhẹ về 0 để vòng trượt mượt
        if (viewport.scrollLeft > 0) {
          viewport.scrollLeft = 0;
        }
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        window.gsap.set(track, { x: -stepPx });
        window.gsap.to(track, {
          x: 0,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => {
            isAnimating = false;
            scheduleNext();
          }
        });
      } else {
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        isAnimating = false;
        scheduleNext();
      }
    }

    viewport.addEventListener("mouseenter", () => {
      isHovered = true;
      stopAuto();
    });

    viewport.addEventListener("mouseleave", () => {
      isHovered = false;
      scheduleNext();
    });

    viewport.addEventListener("mousedown", () => {
      isHovered = true;
      stopAuto();
      if (typeof window.gsap !== "undefined") {
        window.gsap.killTweensOf(track);
        window.gsap.set(track, { x: 0 });
      }
      isAnimating = false;
    });

    scheduleNext();
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
    const viewport = document.querySelector("#homeTabBoxStage .ts-tabbox-viewport");
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
            <img src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
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

    function rotateTrackForDrag(delta) {
      const stepPx = getStepPx();
      if (stepPx <= 0 || track.children.length <= 1) return;

      const steps = Math.floor(Math.abs(delta) / stepPx);
      const remainderPx = Math.abs(delta) % stepPx;
      const remainder = delta < 0 ? -remainderPx : (remainderPx ? -stepPx + remainderPx : 0);
      for (let index = 0; index < steps; index += 1) {
        if (delta < 0) track.appendChild(track.firstElementChild);
        else track.insertBefore(track.lastElementChild, track.firstElementChild);
      }

      if (typeof window.gsap !== "undefined") {
        window.gsap.set(track, { x: remainder });
        window.gsap.to(track, {
          x: 0,
          duration: 0.22,
          ease: "power2.out",
          onComplete: scheduleNextSlide
        });
      } else {
        track.style.transform = "translateX(0)";
        scheduleNextSlide();
      }
    }

    function bindFeaturedDrag() {
      if (!viewport || viewport.dataset.dragBound === "true") return;
      viewport.dataset.dragBound = "true";

      let pointerId = null;
      let startX = 0;
      let lastX = 0;
      let moved = false;
      let suppressClick = false;

      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerId = event.pointerId;
        startX = lastX = event.clientX;
        moved = false;
        suppressClick = false;
        event.preventDefault();
        isHovered = true;
        stopAutoSlide();
        isAnimating = false;
        if (typeof window.gsap !== "undefined") {
          window.gsap.killTweensOf(track);
          window.gsap.set(track, { x: 0 });
        }
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture?.(pointerId);
      });

      viewport.addEventListener("pointermove", (event) => {
        if (event.pointerId !== pointerId) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 6) moved = true;
        lastX = event.clientX;
        if (!moved) return;
        event.preventDefault();
        if (typeof window.gsap !== "undefined") window.gsap.set(track, { x: delta });
        else track.style.transform = `translateX(${delta}px)`;
      });

      const finishDrag = (event) => {
        if (event.pointerId !== pointerId) return;
        const delta = lastX - startX;
        pointerId = null;
        viewport.classList.remove("is-dragging");
        viewport.releasePointerCapture?.(event.pointerId);

        if (moved) {
          suppressClick = true;
          rotateTrackForDrag(delta);
        } else {
          scheduleNextSlide();
        }
        isHovered = false;
      };

      viewport.addEventListener("pointerup", finishDrag);
      viewport.addEventListener("pointercancel", finishDrag);
      viewport.addEventListener("click", (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }, true);
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
    bindFeaturedDrag();
  }

  // 2C. MỤC 03 / RA SÂN — DANH SÁCH ẢNH CỤM SÂN CỤ THỂ LƯỚT BẰNG CHUỘT
  function initHomeCourtsShowcase() {
    const viewport = document.getElementById("homeCourtsViewport");
    const track = document.getElementById("homeCourtsTrack");
    const filtersWrap = document.getElementById("homeCourtSportFilters");
    const store = window.tsportStore;
    if (!viewport || !track || !store) return;

    let currentSport = "ALL";
    let courtsFromApi = null;
    let courtsLoading = null;

    async function getBookingCourts() {
      if (Array.isArray(courtsFromApi)) return courtsFromApi;
      if (!courtsLoading && window.api) {
        courtsLoading = Promise.all([api.get("/courts/"), api.get("/slots/")]).then(([courts, slots]) => {
          const slotsByCourt = new Map();
          (Array.isArray(slots) ? slots : []).forEach((slot) => {
            const list = slotsByCourt.get(Number(slot.court_id)) || [];
            list.push(slot);
            slotsByCourt.set(Number(slot.court_id), list);
          });
          courtsFromApi = (Array.isArray(courts) ? courts : []).map((court) => ({
            ...court,
            slots: (slotsByCourt.get(Number(court.id)) || []).sort((a, b) =>
              String(a.start_time).localeCompare(String(b.start_time))
            )
          }));
          return courtsFromApi;
        }).catch(() => {
          courtsFromApi = [];
          return courtsFromApi;
        });
      }
      return courtsLoading || [];
    }

    async function renderCourts(animate = false) {
      let courts = await getBookingCourts();
      if (currentSport !== "ALL") {
        courts = courts.filter(c => Number(c.sport_id) === Number(currentSport));
      }

      if (courts.length === 0) {
        track.innerHTML = `<div style="width:100%; padding:28px; text-align:center; color:#6B7280; font-size:13.5px; border:1px dashed #E5E7EB; border-radius:10px;">Chưa có cụm sân thuộc môn này.</div>`;
        return;
      }

      track.innerHTML = courts.map((c) => {
        const rating = c.rating ? Number(c.rating).toFixed(1) : "5.0";
        const distance = c.distance || "150m";
        const slotSummary = (c.slots || []).slice(0, 3).map((slot) =>
          `${String(slot.start_time).slice(0, 5)} - ${String(slot.end_time).slice(0, 5)}`
        ).join(" • ");
        const hours = slotSummary || "Chưa có ca hoạt động";
        const img = c.image_url || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800";
        const logo = c.logo_url || "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=120";
        const detailUrl = `pages/court-detail.html?id=${c.id}`;

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
                <a href="${detailUrl}" class="tsport-court-btn-round" title="Xem sân" style="text-decoration:none;">↗</a>
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
                <a href="${detailUrl}" class="tsport-btn-book-court" style="text-decoration:none;">ĐẶT LỊCH</a>
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

  // 2D. GHÉP KÈO GIAO LƯU — KHUNG TAB + LƯỚT CHUỘT TRÁI / PHẢI
  function initHomeMatchesShowcase() {
    const viewport = document.getElementById("homeMatchesViewport");
    const track = document.getElementById("homeMatchesTrack");
    const filtersWrap = document.getElementById("homeMatchSportFilters");
    const store = window.tsportStore;
    if (!viewport || !track || !store) return;

    let currentSport = "ALL";
    let publicMatches = null;
    let matchesLoading = null;

    async function getPublicMatches() {
      if (Array.isArray(publicMatches)) return publicMatches;
      if (!matchesLoading && window.api) {
        matchesLoading = api.get("/match-posts").then((rows) => {
          const sports = store.getSports() || [];
          publicMatches = (Array.isArray(rows) ? rows : []).map((row) => {
            const view = typeof matchView === "function" ? matchView(row) : row;
            const sport = sports.find((item) => Number(item.id) === Number(row.sport_id));
            return {
              ...view,
              sport_name: sport?.name || "Thể thao",
              match_format: row.match_format || (Number(row.sport_id) === 2 ? "Sân 7" : "Đơn"),
              title: view.title || row.location || "Tìm người chơi cùng",
              contact_name: row.contact_info || "Thành viên",
              slots_needed: 1,
              price_share: "Chia đều sân"
            };
          });
          return publicMatches;
        }).catch(() => {
          return publicMatches || [];
        }).finally(() => {
          matchesLoading = null;
        });
      }
      return matchesLoading || [];
    }

    async function renderMatches(animate = false) {
      let list = await getPublicMatches();
      if (currentSport !== "ALL") {
        list = list.filter((match) => Number(match.sport_id) === Number(currentSport));
      }

      if (list.length === 0) {
        delete track.dataset.markup;
        track.innerHTML = `<div style="width:100%; background:#fff; border-radius:8px; padding:28px; text-align:center; color:#6B7280; font-size:13.5px;">Hiện chưa có bài ghép kèo cho môn này.</div>`;
        return;
      }

      const markup = list.map((m) => {
        const isClosed = m.registration_status !== "OPEN";
        return `
        <div class="ts-home-match-card" draggable="false">
          <div>
            <div class="ts-home-match-top">
              <span class="ts-home-match-sport">${escapeHtml(m.sport_name || 'Thể thao')}</span>
              <span class="ts-home-match-slots">${matchAvailability(m)}</span>
            </div>
            <h3 class="ts-home-match-title" style="margin-top:10px;" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</h3>
          </div>

          <div class="ts-home-match-meta">
            <div class="ts-home-match-meta-row"><strong>Thời gian:</strong> ${escapeHtml(m.match_time || '')} • ${escapeHtml(m.match_date || '')}</div>
            <div class="ts-home-match-meta-row" title="${escapeHtml(m.location || '')}"><strong>Địa điểm:</strong> ${escapeHtml(m.location || '')}</div>
            <div class="ts-home-match-meta-row"><strong>Hình thức:</strong> ${escapeHtml(m.match_format || 'Đơn')} • <strong>Trình độ:</strong> ${escapeHtml(m.level || 'Phong trào')}</div>
          </div>

          <div class="ts-home-match-footer">
            <div>
              <div class="ts-home-match-price">${escapeHtml(m.price_share || 'Chia đều sân')}</div>
              <div class="ts-home-match-author">Chủ kèo: ${escapeHtml(m.contact_name || 'Thành viên')}</div>
            </div>
            <a href="pages/community.html?match=${encodeURIComponent(m.id)}" class="tsport-btn-book-court" style="text-decoration:none;">${isClosed ? "XEM CHI TIẾT" : "THAM GIA"}</a>
          </div>
        </div>
      `;
      }).join("");
      if (track.dataset.markup === markup) return;
      track.innerHTML = markup;
      track.dataset.markup = markup;

      if (animate) viewport.scrollLeft = 0;

      if (animate && typeof window.gsap !== "undefined") {
        window.gsap.from(track.querySelectorAll(".ts-home-match-card"), {
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
      renderMatches(true);
    });

    bindMouseDragScroll(viewport);
    renderMatches(false);
    window.setInterval(() => {
      if (document.hidden || matchesLoading) return;
      publicMatches = null;
      renderMatches(false);
    }, 15000);
  }

  // 2E. ĐỒ CŨ MINH BẠCH — KHUNG TAB CHUẨN + LƯỚT CHUỘT TRÁI / PHẢI
  function initHomeUsedShowcase() {
    const viewport = document.getElementById("homeUsedViewport");
    const track = document.getElementById("homeUsedTrack");
    const filtersWrap = document.getElementById("homeUsedFilters");
    const store = window.tsportStore;
    if (!viewport || !track || !store) return;

    let currentFilter = "ALL";

    function getFilteredUsed(filterKey) {
      const allUsed = (store.getProducts() || []).filter(p => p.status !== "INACTIVE" && p.condition_type === "CU");
      switch (filterKey) {
        case "VOT_CU":
          return allUsed.filter(p => [2, 3, 4, 17].includes(p.category_id));
        case "SPORT_1":
          return allUsed.filter(p => p.sport_id === 1);
        case "SPORT_4":
          return allUsed.filter(p => p.sport_id === 4);
        case "SPORT_6":
          return allUsed.filter(p => p.sport_id === 6);
        case "GIAY_BONG":
          return allUsed.filter(p => [6, 7, 8, 10, 13, 19, 20].includes(p.category_id));
        case "ALL":
        default:
          return allUsed;
      }
    }

    function renderUsed(animate = false) {
      const list = getFilteredUsed(currentFilter);
      if (list.length === 0) {
        track.innerHTML = `<div style="width:100%; background:#fff; border-radius:4px; padding:28px; text-align:center; color:#6B7280; font-size:13.5px;">Hiện chưa có sản phẩm đồ cũ trong mục này.</div>`;
        return;
      }

      track.innerHTML = list.map((p) => {
        const primaryImg = (p.images && p.images.find(i => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
        const skus = p.skus || [];
        const hasSale = skus.some(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
        const effectivePrices = skus.map(s => (s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price)) ? Number(s.sale_price) : Number(s.price));
        const minEff = effectivePrices.length ? Math.min(...effectivePrices) : 0;
        const minOrig = skus.length ? Math.min(...skus.map(s => Number(s.price))) : 0;
        const wearGrade = p.specifications?.condition_grade || "90%";

        return `
          <a href="pages/product-detail.html?id=${p.id}" class="ts-tabbox-card" draggable="false">
            <div class="ts-tabbox-img-wrap">
              <span class="ts-min-product-badge">Đồ cũ ~${escapeHtml(wearGrade)}</span>
              <img src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy" draggable="false" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
            </div>
            <h3 class="ts-tabbox-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
            ${p.wear_description ? `<div style="font-size:11px; color:#6B7280; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.wear_description)}">${escapeHtml(p.wear_description)}</div>` : ''}
            <div class="ts-tabbox-price-row">
              <span class="ts-tabbox-price">${formatMoney(minEff)}</span>
              ${hasSale ? `<span class="ts-tabbox-oldprice">${formatMoney(minOrig)}</span>` : ""}
            </div>
          </a>
        `;
      }).join("");

      viewport.scrollLeft = 0;

      if (animate && typeof window.gsap !== "undefined") {
        window.gsap.from(track.querySelectorAll(".ts-tabbox-card"), {
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
      currentFilter = btn.dataset.filter || "ALL";
      renderUsed(true);
    });

    bindMouseDragScroll(viewport);
    renderUsed(false);
  }

  // 2F. SẢN PHẨM SALE THEO THỜI HẠN (ĐẾM NGƯỢC THỜI GIAN THỰC + LƯỚT CHUỘT)
  function initHomeFlashSaleShowcase() {
    const viewport = document.getElementById("homeSaleViewport");
    const track = document.getElementById("homeSaleTrack");
    const store = window.tsportStore;
    if (!viewport || !track || !store) return;

    // 1. Bộ đếm ngược thời hạn chương trình Sale (tự cập nhật từng giây)
    const saleEndTime = Date.now() + (2 * 24 * 60 * 60 + 11 * 60 * 60 + 45 * 60) * 1000;
    const elDays = document.getElementById("saleTimerDays");
    const elHours = document.getElementById("saleTimerHours");
    const elMins = document.getElementById("saleTimerMins");
    const elSecs = document.getElementById("saleTimerSecs");

    function tickCountdown() {
      const diff = Math.max(0, saleEndTime - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (elDays) elDays.textContent = String(days).padStart(2, "0");
      if (elHours) elHours.textContent = String(hours).padStart(2, "0");
      if (elMins) elMins.textContent = String(mins).padStart(2, "0");
      if (elSecs) elSecs.textContent = String(secs).padStart(2, "0");
    }
    tickCountdown();
    setInterval(tickCountdown, 1000);

    // 2. Lấy toàn bộ sản phẩm đang có giá Sale từ store.js + bổ sung sản phẩm sale tạm thời để lấp đầy khung
    const allProds = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    const realSaleItems = allProds
      .filter(p => (p.skus || []).some(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price)))
      .map(p => {
        const primaryImg = (p.images && p.images.find(i => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
        const skus = p.skus || [];
        const saleSkus = skus.filter(s => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
        const minSale = Math.min(...saleSkus.map(s => Number(s.sale_price)));
        const minOrig = Math.min(...saleSkus.map(s => Number(s.price)));
        const maxPct = Math.max(...saleSkus.map(s => Math.round((1 - Number(s.sale_price) / Number(s.price)) * 100)));
        const totalStock = skus.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
        return {
          id: p.id,
          name: p.name,
          image: primaryImg.image_url,
          salePrice: minSale,
          origPrice: minOrig,
          pct: maxPct,
          stock: totalStock
        };
      });

    // Danh sách sản phẩm sale tạm thời bổ sung (không trùng tên với sản phẩm đã có sale thật)
    const tempSaleItems = [
      {
        id: 2,
        name: "Vợt cầu lông Yonex Nanoflare 1000Z",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        salePrice: 3590000,
        origPrice: 4100000,
        pct: 12,
        stock: 18
      },
      {
        id: 3,
        name: "Vợt cầu lông Lining Axforce 90 Max Tiger",
        image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600",
        salePrice: 3250000,
        origPrice: 3950000,
        pct: 18,
        stock: 14
      },
      {
        id: 4,
        name: "Giày cầu lông Yonex Power Cushion 65Z3",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        salePrice: 2250000,
        origPrice: 2650000,
        pct: 15,
        stock: 22
      },
      {
        id: 5,
        name: "Giày đá bóng Nike Mercurial Vapor 15 Pro TF",
        image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600",
        salePrice: 2390000,
        origPrice: 2850000,
        pct: 16,
        stock: 15
      },
      {
        id: 18,
        name: "Túi đựng vợt cầu lông Yonex Pro 92429",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        salePrice: 1290000,
        origPrice: 1650000,
        pct: 22,
        stock: 11
      },
      {
        id: 7,
        name: "Ống 12 quả cầu lông Yonex Aerosensa 50",
        image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600",
        salePrice: 640000,
        origPrice: 750000,
        pct: 15,
        stock: 30
      }
    ];

    const existingIds = new Set(realSaleItems.map(i => i.id));
    const saleItems = [...realSaleItems];
    tempSaleItems.forEach(item => {
      if (!existingIds.has(item.id)) {
        saleItems.push(item);
      }
    });

    const endDateObj = new Date(saleEndTime);
    const deadlineStr = `${String(endDateObj.getDate()).padStart(2, "0")}/${String(endDateObj.getMonth() + 1).padStart(2, "0")}/${endDateObj.getFullYear()}`;

    track.innerHTML = saleItems.map((item, idx) => {
      const soldPercent = Math.min(92, Math.max(35, 86 - idx * 6));

      return `
        <a href="pages/product-detail.html?id=${item.id}" class="ts-tabbox-card" draggable="false">
          <div class="ts-tabbox-img-wrap">
            <span class="ts-sale-discount-badge">-${item.pct}%</span>
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" draggable="false" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
          </div>
          <h3 class="ts-tabbox-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
          <div class="ts-sale-deadline-meta">Hạn ưu đãi: ${deadlineStr}</div>
          <div class="ts-tabbox-price-row">
            <span class="ts-tabbox-price">${formatMoney(item.salePrice)}</span>
            <span class="ts-tabbox-oldprice">${formatMoney(item.origPrice)}</span>
          </div>
          <div class="ts-sale-progress-track">
            <div class="ts-sale-progress-fill" style="width:${soldPercent}%;"></div>
          </div>
          <div class="ts-sale-stock-label">Còn lại ${item.stock} sản phẩm giá sale</div>
        </a>
      `;
    }).join("");

    bindMouseDragScroll(viewport);
  }

  // 3. SẢN PHẨM ĐÃ XEM GẦN ĐÂY (LOCALSTORAGE)
  function renderRecentlyViewed() {
    const store = window.tsportStore;
    const wrap = document.getElementById("homeRecentWrap");
    const container = document.getElementById("homeRecentScroll");
    if (!container || !store) return;

    try {
      const recentIds = window.tsportStore.data.recentViews;
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
            <img src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}" alt="${escapeHtml(p.name)}" class="tsport-recent-img" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
            <div style="font-size:12.5px; font-weight:700; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.name)}">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size:13px; font-weight:800; color:#111827; margin-top:4px;">
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
              <img src="${escapeHtml(storefrontImageUrl(img.image_url))}" alt="${escapeHtml(p.name)}" class="tsport-search-dropdown-thumb" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100'" />
              <div class="tsport-search-dropdown-info">
                <div class="tsport-search-dropdown-name">${escapeHtml(p.name)}</div>
                <div class="tsport-search-dropdown-price">${formatMoney(minPrice)}</div>
              </div>
            </a>
          `;
        }).join("") + `
          <a href="pages/shop.html?q=${encodeURIComponent(query)}" style="display:block; text-align:center; padding:10px; font-size:12px; font-weight:700; color:#111827; background:#F3F4F6; text-decoration:none;">
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

  function initSmoothScroll() {
    const { Lenis, gsap, ScrollTrigger } = window;
    if (!Lenis || !gsap) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        lerp: 0.115,
        syncTouch: false,
        anchors: true,
        stopInertiaOnNavigate: true,
        virtualScroll: ({ event, deltaX, deltaY }) =>
          !event.shiftKey && Math.abs(deltaY) >= Math.abs(deltaX)
      });
      if (ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
      const tick = (seconds) => lenis.raf(seconds * 1000);
      gsap.ticker.add(tick);

      // Dừng quán tính của trang nền khi mở chi tiết hoặc menu.
      const overlays = [document.getElementById("bg3dDetailOverlay"), document.getElementById("mobDrawer")].filter(Boolean);
      const onOverlayChange = () => {
        const blocked = overlays.some((overlay) => overlay.classList.contains("is-open"));
        if (blocked && !lenis.isStopped) lenis.stop();
        else if (!blocked && lenis.isStopped) lenis.start();
      };
      const observer = new MutationObserver(onOverlayChange);
      overlays.forEach((overlay) => observer.observe(overlay, { attributes: true, attributeFilter: ["class"] }));
      onOverlayChange();

      return () => {
        observer.disconnect();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });
  }

  // 5. CHUYỂN ĐỘNG GSAP 3 + SCROLLTRIGGER (THEO SKILL GREENSOCK/GSAP-SKILLS)
  function initGsapAnimations() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap) return;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 768px)" }, (context) => {
      if (!context.conditions.motion) return;
      gsap.from(".js-gsap-hero", {
        y: 16,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        clearProps: "transform,opacity"
      });

      if (!ScrollTrigger) return;
      const focusListeners = new AbortController();
      const sections = [
        ...Array.from(document.querySelectorAll(".js-gsap-section, #homeRecentWrap"), (section) => ({
          trigger: section,
          targets: Array.from(section.children)
        })),
        {
          trigger: document.querySelector("#tsMobileHome .ts-mob-sec-head"),
          targets: document.querySelectorAll("#tsMobileHome .ts-mob-sec-head, #mobNewProductsGrid")
        },
        {
          trigger: document.querySelector("#tsMobileHome .ts-mob-service-card"),
          targets: document.querySelectorAll("#tsMobileHome .ts-mob-service-card")
        }
      ];

      for (const { trigger, targets } of sections) {
        if (!trigger?.getClientRects().length || trigger.getBoundingClientRect().top < window.innerHeight) continue;
        const reveal = gsap.fromTo(targets, { y: 18, opacity: 0.18 }, {
          y: 0,
          opacity: 1,
          duration: 0.82,
          stagger: 0.11,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger,
            start: "top 98%",
            once: true
          }
        });
        for (const target of targets) {
          target.addEventListener("focusin", () => reveal.progress(1), { signal: focusListeners.signal });
        }
      }
      return () => focusListeners.abort();
    });
  }

  // ==========================================
  // MOBILE HOMEPAGE (<= 768px)
  // ==========================================
  function initMobileHome() {
    const searchForm = document.getElementById("mobHomeSearchForm");
    const searchInput = document.getElementById("mobHomeSearchInput");
    searchForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (searchInput?.value || "").trim();
      window.location.href = q ? `pages/shop.html?q=${encodeURIComponent(q)}` : "pages/shop.html";
    });

    const grid = document.getElementById("mobNewProductsGrid");
    const pillsWrap = document.getElementById("mobSportPills");
    if (!grid) return;

    const sportSlugToId = {
      "cau-long": 1,
      "bong-da": 2,
      "tennis": 3,
      "pickleball": 4
    };

    function renderMobProducts(sportKey) {
      const store = window.tsportStore;
      if (!store) return;

      const all = (store.getProducts({ only_active: true }) || []).filter(
        (p) => (p.condition_type || "MOI") !== "CU"
      );

      let list = all;
      if (sportKey && sportKey !== "all") {
        const targetId = sportSlugToId[sportKey];
        const filtered = all.filter((p) => Number(p.sport_id) === Number(targetId));
        if (filtered.length) list = filtered;
      }

      const items = list.slice(0, 4);
      const fallbackImg = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400";

      grid.innerHTML = items
        .map((p) => {
          const skus = Array.isArray(p.skus) ? p.skus : [];
          const minPrice = skus.length
            ? Math.min(...skus.map((s) => Number(s.price) || 0))
            : Number(p.price) || 0;
          const img = p.images?.[0]?.image_url || p.image_url || fallbackImg;
          const condLabel = p.condition_type === "CU" ? "Cũ" : "Mới";
          const firstSku = skus[0];
          const metaText = firstSku
            ? [firstSku.color, firstSku.size, firstSku.unit === "LO" ? "Lô" : "Chiếc"]
                .filter(Boolean)
                .join(" / ")
            : "Màu / Size / Đơn vị";

          return `
            <a href="pages/product-detail.html?id=${p.id}" class="ts-mob-prod-card">
              <div class="ts-mob-prod-thumb">
                <span class="ts-mob-prod-badge">${condLabel}</span>
                <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='${fallbackImg}'" />
              </div>
              <h3 class="ts-mob-prod-name">${escapeHtml(p.name)}</h3>
              <div class="ts-mob-prod-meta">${escapeHtml(metaText)}</div>
              <div class="ts-mob-prod-price">${formatMoney(minPrice)}</div>
            </a>
          `;
        })
        .join("");
    }

    renderMobProducts("all");

    pillsWrap?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-mob-sport-pill");
      if (!btn) return;
      pillsWrap.querySelectorAll(".ts-mob-sport-pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const key = btn.dataset.sport === "all" ? "cau-long" : btn.dataset.sport;
      renderMobProducts(key);
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
