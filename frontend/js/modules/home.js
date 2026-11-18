/**
 * TSPORT / VNB — MODULE TRANG CHỦ (HOME STOREFRONT CHUẨN 5 ẢNH MẪU)
 * Quản lý:
 * - Header VNB (Logo, Hotline, Hệ thống cửa hàng, Ô tìm kiếm Debounce, 3 Icon tròn)
 * - Khối "Sản phẩm mới" có 6 Tab lọc danh mục & Khung Cam Vàng (#FCAF17) 5 cột + Nút trượt < >
 * - Khối "Có thể bạn sẽ thích" 6 cột kèm badge giảm giá đỏ (-38%, -22%, -35%, -16%)
 * - Khu hàng cũ minh bạch, Lối vào dịch vụ & Sản phẩm đã xem gần đây (localStorage).
 */

(function () {
  let searchDebounceTimer = null;
  let currentNewTab = "ALL";
  let currentNewOffset = 0;
  let currentHero3DIndex = 0;
  let hero3DTimer = null;

  // Danh sách ảnh sản phẩm luân chuyển 3D trên Banner chính
  const VNB_HERO_3D_PRODUCTS = [
    {
      id: 1,
      tag: "SIÊU PHẨM VNB 2026",
      name: "Vợt Cầu Lông VNB V200 Xanh Chính Hãng",
      image: "assets/home/racket-v200-xanh.jpg",
      price_text: "529.000 ₫",
      old_price_text: "650.000 ₫",
      link: "pages/product-detail.html?id=1"
    },
    {
      id: 2,
      tag: "HOT TRAINING 150G",
      name: "Vợt Cầu Lông VNB Carbon Training 150g Chính Hãng",
      image: "assets/home/racket-carbon-training.jpg",
      price_text: "590.000 ₫",
      old_price_text: "690.000 ₫",
      link: "pages/product-detail.html?id=2"
    },
    {
      id: 3,
      tag: "BEST SELLER",
      name: "Vợt Cầu Lông VNB V200i Hồng Chính Hãng",
      image: "assets/home/racket-v200i-hong.jpg",
      price_text: "529.000 ₫",
      old_price_text: "650.000 ₫",
      link: "pages/product-detail.html?id=3"
    },
    {
      id: 1,
      tag: "GIẢM SÂU -38%",
      name: "Vợt Cầu Lông VNB V88 Xanh Chính Hãng",
      image: "assets/home/racket-v88-xanh.jpg",
      price_text: "395.000 ₫",
      old_price_text: "638.000 ₫",
      link: "pages/product-detail.html?id=1"
    },
    {
      id: 2,
      tag: "CHÍNH HÃNG 100%",
      name: "Vợt Cầu Lông VNB V200 Đỏ Chính Hãng",
      image: "assets/home/racket-v200-do.jpg",
      price_text: "529.000 ₫",
      old_price_text: "650.000 ₫",
      link: "pages/product-detail.html?id=2"
    },
    {
      id: 3,
      tag: "SALE OFF -35%",
      name: "Vợt Cầu Lông Kumpoo Power Control K520 Pro",
      image: "assets/home/racket-kumpoo-k520.jpg",
      price_text: "400.000 ₫",
      old_price_text: "619.000 ₫",
      link: "pages/product-detail.html?id=3"
    },
    {
      id: 1,
      tag: "LIMITED COLLECTION",
      name: "Bộ Sưu Tập Venson × One Piece New Collection",
      image: "assets/home/hero-banner-1.jpg",
      price_text: "579.000 ₫",
      old_price_text: "690.000 ₫",
      link: "pages/shop.html?sport=1"
    }
  ];

  // Danh sách sản phẩm chuẩn Ảnh 2 ("Sản phẩm mới")
  const VNB_NEW_SHOWCASE = [
    {
      id: 1,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB V200 Xanh Chính Hãng",
      image: "assets/home/racket-v200-xanh.jpg",
      price_text: "529.000 ₫",
      old_price_text: ""
    },
    {
      id: 2,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB Carbon Training 150g Chính Hãng",
      image: "assets/home/racket-carbon-training.jpg",
      price_text: "590.000 - 698.000 ₫",
      old_price_text: "690.000 ₫"
    },
    {
      id: 3,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB V200i Hồng Chính Hãng",
      image: "assets/home/racket-v200i-hong.jpg",
      price_text: "529.000 ₫",
      old_price_text: ""
    },
    {
      id: 1,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB V88 Xanh Chính Hãng",
      image: "assets/home/racket-v88-xanh.jpg",
      price_text: "395.000 - 638.000 ₫",
      old_price_text: "638.000 ₫"
    },
    {
      id: 2,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB V200 Đỏ Chính Hãng",
      image: "assets/home/racket-v200-do.jpg",
      price_text: "529.000 ₫",
      old_price_text: ""
    },
    {
      id: 3,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông VNB V88 Cam Chính Hãng",
      image: "assets/home/racket-v88-cam.jpg",
      price_text: "499.000 - 638.000 ₫",
      old_price_text: "638.000 ₫"
    },
    {
      id: 1,
      tab: "VOT_CAULONG",
      name: "Vợt Cầu Lông Kumpoo Power Control K520 Pro",
      image: "assets/home/racket-kumpoo-k520.jpg",
      price_text: "400.000 - 690.000 ₫",
      old_price_text: "619.000 ₫"
    }
  ];

  // Danh sách sản phẩm chuẩn Ảnh 3 ("Có thể bạn sẽ thích")
  const VNB_MAY_LIKE_SHOWCASE = [
    {
      id: 1,
      discount_badge: "- 38%",
      name: "Vợt Cầu Lông VNB V88 Xanh Chính Hãng",
      image: "assets/home/racket-v88-xanh.jpg",
      price_text: "395.000 - 638.000 ₫",
      old_price_text: "638.000 ₫"
    },
    {
      id: 2,
      discount_badge: "- 22%",
      name: "Vợt Cầu Lông VNB V88 Cam Chính Hãng",
      image: "assets/home/racket-v88-cam.jpg",
      price_text: "499.000 - 638.000 ₫",
      old_price_text: "638.000 ₫"
    },
    {
      id: 3,
      discount_badge: "",
      name: "Vợt Cầu Lông VNB V200 Xanh Chính Hãng",
      image: "assets/home/racket-v200-xanh.jpg",
      price_text: "529.000 ₫",
      old_price_text: ""
    },
    {
      id: 1,
      discount_badge: "",
      name: "Vợt Cầu Lông VNB TC88C Chính Hãng",
      image: "assets/home/racket-tc88c.jpg",
      price_text: "799.000 ₫",
      old_price_text: ""
    },
    {
      id: 2,
      discount_badge: "- 35%",
      name: "Vợt Cầu Lông Kumpoo Power Control K520 Pro",
      image: "assets/home/racket-kumpoo-k520.jpg",
      price_text: "400.000 - 690.000 ₫",
      old_price_text: "619.000 ₫"
    },
    {
      id: 3,
      discount_badge: "- 16%",
      name: "Vợt Cầu Lông Kumpoo Veluriyam",
      image: "assets/home/racket-kumpoo-veluriyam.jpg",
      price_text: "579.000 - 690.000 ₫",
      old_price_text: "690.000 ₫"
    }
  ];

  function initHome() {
    updateHeaderUser();
    updateCartBadge();
    initHero3DCarousel();
    renderNewProductsSection();
    renderMayLikeSection();
    renderUsedProducts();
    renderRecentlyViewed();
    bindHomeEvents();
    initSearchDebounce();
  }

  // 0. KHỞI TẠO & TỰ ĐỘNG LUÂN CHUYỂN BANNER SẢN PHẨM 3D TỪNG ẢNH MỘT
  function initHero3DCarousel() {
    const stage = document.getElementById("hero3DStage");
    const dotsWrap = document.getElementById("hero3DDots");
    const viewport = document.getElementById("hero3DViewport");
    if (!stage || !dotsWrap) return;

    const total = VNB_HERO_3D_PRODUCTS.length;

    // Tạo sẵn các thẻ DOM để CSS 3D transition mượt mà khi đổi data-pos
    stage.innerHTML = VNB_HERO_3D_PRODUCTS.map((item, idx) => `
      <div class="vnb-3d-slide" data-index="${idx}" data-pos="hidden">
        <div class="vnb-3d-slide-media">
          <span class="vnb-3d-slide-tag">${escapeHtml(item.tag)}</span>
          <span class="vnb-3d-slide-step">${idx + 1} / ${total}</span>
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />
        </div>
        <div class="vnb-3d-slide-info">
          <div style="min-width:0; flex:1;">
            <h3 class="vnb-3d-slide-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
            <div class="vnb-3d-slide-price-wrap">
              <span class="vnb-3d-slide-price">${escapeHtml(item.price_text)}</span>
              ${item.old_price_text ? `<span class="vnb-3d-slide-oldprice">${escapeHtml(item.old_price_text)}</span>` : ''}
            </div>
          </div>
          <a href="${escapeHtml(item.link)}" class="vnb-3d-slide-cta js-3d-cta-link">Mua ngay →</a>
        </div>
      </div>
    `).join("");

    dotsWrap.innerHTML = VNB_HERO_3D_PRODUCTS.map((_, idx) => `
      <button type="button" class="vnb-hero-3d-dot ${idx === 0 ? 'is-active' : ''}" data-index="${idx}" title="Ảnh sản phẩm ${idx + 1}"></button>
    `).join("");

    function updateHero3DPositions() {
      const slides = stage.querySelectorAll(".vnb-3d-slide");
      slides.forEach((slide, idx) => {
        let diff = idx - currentHero3DIndex;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        let pos = "hidden";
        if (diff === 0) pos = "0";
        else if (diff === 1) pos = "1";
        else if (diff === -1) pos = "-1";
        else if (diff === 2) pos = "2";
        else if (diff === -2) pos = "-2";

        slide.setAttribute("data-pos", pos);
      });

      dotsWrap.querySelectorAll(".vnb-hero-3d-dot").forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === currentHero3DIndex);
      });
    }

    function stepHero3D(delta) {
      currentHero3DIndex = (currentHero3DIndex + delta + total) % total;
      updateHero3DPositions();
    }

    function startAutoRotate() {
      stopAutoRotate();
      hero3DTimer = setInterval(() => {
        stepHero3D(1);
      }, 2600);
    }

    function stopAutoRotate() {
      if (hero3DTimer) {
        clearInterval(hero3DTimer);
        hero3DTimer = null;
      }
    }

    updateHero3DPositions();
    startAutoRotate();

    document.getElementById("btnHero3DPrev")?.addEventListener("click", () => {
      stepHero3D(-1);
      startAutoRotate();
    });

    document.getElementById("btnHero3DNext")?.addEventListener("click", () => {
      stepHero3D(1);
      startAutoRotate();
    });

    dotsWrap.addEventListener("click", (e) => {
      const dot = e.target.closest(".vnb-hero-3d-dot");
      if (!dot) return;
      currentHero3DIndex = Number(dot.dataset.index) || 0;
      updateHero3DPositions();
      startAutoRotate();
    });

    stage.addEventListener("click", (e) => {
      if (e.target.closest(".js-3d-cta-link")) return;
      const slide = e.target.closest(".vnb-3d-slide");
      if (!slide) return;
      const clickedIdx = Number(slide.dataset.index);
      if (clickedIdx === currentHero3DIndex) {
        const item = VNB_HERO_3D_PRODUCTS[clickedIdx];
        if (item && item.link) window.location.href = item.link;
      } else {
        currentHero3DIndex = clickedIdx;
        updateHero3DPositions();
        startAutoRotate();
      }
    });

    viewport?.addEventListener("mouseenter", stopAutoRotate);
    viewport?.addEventListener("mouseleave", startAutoRotate);
  }

  // 1. CẬP NHẬT ICON TÀI KHOẢN & GIỎ HÀNG TRÊN HEADER CHUẨN ẢNH 1
  function updateHeaderUser() {
    const userRaw = localStorage.getItem("tsport_current_user");
    const userWrap = document.getElementById("headerUserWrap");
    if (!userWrap) return;

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const isAdmin = user.role === "ADMIN" || (user.email && user.email.toLowerCase().includes("admin"));
        const shortName = (user.full_name || user.email || "Tài khoản").split(" ").slice(-2).join(" ");
        userWrap.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <a href="pages/${isAdmin ? 'admin-dashboard.html' : 'account.html'}" class="vnb-icon-action" title="${escapeHtml(user.full_name || user.email)}">
              <div class="vnb-icon-circle">${isAdmin ? '🛡️' : '👤'}</div>
              <span class="vnb-icon-label">${escapeHtml(isAdmin ? 'ADMIN' : shortName)}</span>
            </a>
            <button type="button" id="btnHomeLogout" title="Đăng xuất" style="border:none; background:#FEE2E2; color:#DC2626; border-radius:50%; width:22px; height:22px; font-size:11px; font-weight:800; cursor:pointer;">✕</button>
          </div>
        `;
        document.getElementById("btnHomeLogout")?.addEventListener("click", () => {
          localStorage.removeItem("tsport_current_user");
          localStorage.removeItem("token");
          localStorage.removeItem("tsport_token");
          if (typeof showToast === "function") showToast("Đã đăng xuất tài khoản!", "info");
          updateHeaderUser();
        });
        return;
      } catch (_) {}
    }

    userWrap.innerHTML = `
      <a href="pages/auth.html" class="vnb-icon-action">
        <div class="vnb-icon-circle">👤</div>
        <span class="vnb-icon-label">TÀI KHOẢN</span>
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

  // 2. RENDER KHỐI "SẢN PHẨM MỚI" TRONG KHUNG CAM VÀNG (ẢNH 2)
  function getItemsForNewTab(tabKey) {
    const store = window.tsportStore;
    if (tabKey === "ALL" || tabKey === "VOT_CAULONG") {
      return VNB_NEW_SHOWCASE;
    }

    if (!store) return VNB_NEW_SHOWCASE;
    const allProds = (store.getProducts() || []).filter(p => p.status !== "INACTIVE" && p.condition_type !== "CU");

    let filtered = [];
    if (tabKey === "GIAY_CAULONG") {
      filtered = allProds.filter(p => p.category_id === 6 || p.category_id === 5 || p.name.toLowerCase().includes("giày"));
    } else if (tabKey === "AO_CAULONG" || tabKey === "VAY_CAULONG" || tabKey === "QUAN_CAULONG") {
      filtered = allProds.filter(p => p.category_id === 15 || p.category_id === 14 || p.category_id === 16);
    }

    const mapped = filtered.map(p => {
      const img = (p.images && p.images[0]) ? p.images[0].image_url : "assets/home/racket-v200-xanh.jpg";
      const skus = p.skus || [];
      const hasSale = skus.some(s => s.sale_price && s.sale_price < s.price);
      const minEff = skus.length ? Math.min(...skus.map(s => (s.sale_price && s.sale_price < s.price) ? s.sale_price : s.price)) : 0;
      const minOrig = skus.length ? Math.min(...skus.map(s => s.price)) : 0;
      return {
        id: p.id,
        name: p.name,
        image: img,
        price_text: formatMoney(minEff),
        old_price_text: hasSale ? formatMoney(minOrig) : ""
      };
    });

    while (mapped.length < 5) {
      mapped.push(VNB_NEW_SHOWCASE[mapped.length % VNB_NEW_SHOWCASE.length]);
    }
    return mapped;
  }

  function renderNewProductsSection() {
    const grid = document.getElementById("homeNewProductsGrid");
    if (!grid) return;

    const list = getItemsForNewTab(currentNewTab);
    const visible = [];
    for (let i = 0; i < 5; i++) {
      visible.push(list[(currentNewOffset + i) % list.length]);
    }

    grid.innerHTML = visible.map(item => `
      <a href="pages/product-detail.html?id=${item.id}" class="vnb-new-card">
        <div class="vnb-new-card-img-wrap">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='assets/home/racket-v200-xanh.jpg'" />
        </div>
        <h3 class="vnb-new-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
        <div class="vnb-new-card-price-row">
          <span class="vnb-price-red">${escapeHtml(item.price_text)}</span>
          ${item.old_price_text ? `<span class="vnb-price-old">${escapeHtml(item.old_price_text)}</span>` : ''}
        </div>
      </a>
    `).join("");
  }

  // 3. RENDER KHỐI "CÓ THỂ BẠN SẼ THÍCH" 6 CỘT (ẢNH 3)
  function renderMayLikeSection() {
    const grid = document.getElementById("homeMayLikeGrid");
    if (!grid) return;

    grid.innerHTML = VNB_MAY_LIKE_SHOWCASE.map(item => `
      <a href="pages/product-detail.html?id=${item.id}" class="vnb-like-card">
        ${item.discount_badge ? `<span class="vnb-discount-pill">${escapeHtml(item.discount_badge)}</span>` : ''}
        <div class="vnb-like-img-wrap">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='assets/home/racket-v88-xanh.jpg'" />
        </div>
        <h3 class="vnb-like-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
        <div style="margin-top:auto;">
          <div class="vnb-price-red">${escapeHtml(item.price_text)}</div>
          ${item.old_price_text ? `<div class="vnb-price-old" style="margin-top:2px;">${escapeHtml(item.old_price_text)}</div>` : ''}
        </div>
      </a>
    `).join("");
  }

  // 4. RENDER KHU HÀNG ĐÃ QUA SỬ DỤNG MINH BẠCH (USED PRODUCTS)
  function renderUsedProducts() {
    const store = window.tsportStore;
    const grid = document.getElementById("homeUsedGrid");
    if (!grid || !store) return;

    const products = (store.getProducts() || []).filter(p => p.status !== "INACTIVE");
    const usedProducts = products.filter(p => p.condition_type === "CU").slice(0, 4);

    if (usedProducts.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748B;">Hiện đang cập nhật thêm hàng cũ minh bạch...</div>`;
      return;
    }

    grid.innerHTML = usedProducts.map((p) => {
      const primaryImg = (p.images && p.images[0]) || { image_url: "assets/home/racket-v200-xanh.jpg" };
      const skus = p.skus || [];
      const minEff = skus.length ? Math.min(...skus.map(s => (s.sale_price && s.sale_price < s.price) ? s.sale_price : s.price)) : 0;
      const wearGrade = p.specifications?.condition_grade || "90%";

      return `
        <a href="pages/product-detail.html?id=${p.id}" class="vnb-like-card" style="border:1px solid #FED7AA; background:#FFFBF8;">
          <span class="vnb-discount-pill" style="background:#D94C26;">ĐỒ CŨ ~${escapeHtml(wearGrade)}</span>
          <div class="vnb-like-img-wrap" style="background:transparent;">
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='assets/home/racket-v200-xanh.jpg'" />
          </div>
          <h3 class="vnb-like-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          ${p.wear_description ? `<div style="font-size:11px; color:#9A3412; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🔍 ${escapeHtml(p.wear_description)}</div>` : ''}
          <div style="margin-top:auto;">
            <div class="vnb-price-red">${formatMoney(minEff)}</div>
          </div>
        </a>
      `;
    }).join("");
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
        const primaryImg = (p.images && p.images[0]) || { image_url: "assets/home/racket-v200-xanh.jpg" };
        const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.sale_price && s.sale_price < s.price ? s.sale_price : s.price)) : 0;
        return `
          <a href="pages/product-detail.html?id=${p.id}" class="tsport-recent-card">
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" class="tsport-recent-img" onerror="this.src='assets/home/racket-v200-xanh.jpg'" />
            <div style="font-size:12px; font-weight:700; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.name)}">
              ${escapeHtml(p.name)}
            </div>
            <div style="font-size:12px; font-weight:800; color:#E11D48; margin-top:4px;">
              ${formatMoney(minPrice)}
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (wrap) wrap.style.display = "none";
    }
  }

  // 6. GẮN SỰ KIỆN TAB & NÚT TRƯỢT < > KHỐI "SẢN PHẨM MỚI"
  function bindHomeEvents() {
    const tabsWrap = document.getElementById("vnbNewProductTabs");
    tabsWrap?.addEventListener("click", (e) => {
      const btn = e.target.closest(".vnb-new-tab-btn");
      if (!btn) return;
      tabsWrap.querySelectorAll(".vnb-new-tab-btn").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentNewTab = btn.dataset.tab || "ALL";
      currentNewOffset = 0;
      renderNewProductsSection();
    });

    document.getElementById("btnNewPrev")?.addEventListener("click", () => {
      const list = getItemsForNewTab(currentNewTab);
      currentNewOffset = (currentNewOffset - 1 + list.length) % list.length;
      renderNewProductsSection();
    });

    document.getElementById("btnNewNext")?.addEventListener("click", () => {
      const list = getItemsForNewTab(currentNewTab);
      currentNewOffset = (currentNewOffset + 1) % list.length;
      renderNewProductsSection();
    });
  }

  // 7. TÌM KIẾM GỢI Ý THÔNG MINH (DEBOUNCE 250MS)
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
            const img = (p.images && p.images[0]) || { image_url: "assets/home/racket-v200-xanh.jpg" };
            const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.sale_price && s.sale_price < s.price ? s.sale_price : s.price)) : 0;
            return `
              <a href="pages/product-detail.html?id=${p.id}" class="tsport-search-dropdown-item">
                <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(p.name)}" class="tsport-search-dropdown-thumb" onerror="this.src='assets/home/racket-v200-xanh.jpg'" />
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
          <a href="pages/shop.html?q=${encodeURIComponent(query)}" style="display:block; text-align:center; padding:10px; font-size:12px; font-weight:700; color:#E95211; background:#FFF1EB; text-decoration:none;">
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
