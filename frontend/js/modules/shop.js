/**
 * TSPORT — MODULE SẢN PHẨM THỂ THAO (SHOP CATALOG V2 — TỐI GIẢN CHUẨN FIGMA)
 * - Lưới 3 cột (desktop) / 2 cột (mobile), 9 sản phẩm/trang
 * - Bộ lọc bên trái: Môn thể thao, Danh mục (cây cha-con), Thương hiệu, Tình trạng, Khoảng giá (slider)
 * - Nút "Áp dụng bộ lọc" & "Xóa lọc", Drawer trên Mobile
 * - Sắp xếp giá, Phân trang vuông căn giữa, giữ trạng thái qua URLSearchParams
 */

(function () {
  const ITEMS_PER_PAGE = 9;
  const DEFAULT_MAX_PRICE = 7000000;
  let currentPage = 1;
  let closeMobileFilters = () => {};

  function initShopModule() {
    initShopBrandSlider();
    positionShopSearch();
    renderFiltersSidebar();
    bindEvents();
    loadProductsFromUrl();
  }

  function positionShopSearch() {
    const search = document.getElementById("shopSearchForm");
    const mobileHeading = document.querySelector(".ts-mob-shop-head");
    if (!search || !mobileHeading) return;
    const desktopContainer = search.parentElement;
    const mobile = window.matchMedia("(max-width: 768px)");
    const updatePosition = () => (mobile.matches ? mobileHeading : desktopContainer).append(search);
    mobile.addEventListener("change", updatePosition);
    updatePosition();
  }

  // BANNER THƯƠNG HIỆU VỢT: CHỈ ẢNH, TRƯỢT TỪ TRÁI SANG PHẢI TRONG 1S
  function initShopBrandSlider() {
    const slider = document.getElementById("shopBrandSlider");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll(".ts-shop-brand-slide"));
    const dots = Array.from(slider.querySelectorAll(".ts-shop-brand-dot"));
    if (slides.length <= 1) return;

    let currentIdx = 0;
    let isAnimating = false;
    let timer = null;

    function goToSlide(nextIdx) {
      if (isAnimating || nextIdx === currentIdx) return;
      isAnimating = true;

      const prevSlide = slides[currentIdx];
      const nextSlide = slides[nextIdx];

      dots.forEach((d, i) => d.classList.toggle("is-active", i === nextIdx));

      // Đặt slide mới ở ngoài lề trái (-100%) không transition
      nextSlide.style.transition = "none";
      nextSlide.style.transform = "translateX(-100%)";
      nextSlide.style.zIndex = "3";
      nextSlide.style.pointerEvents = "auto";

      prevSlide.style.transition = "none";
      prevSlide.style.transform = "translateX(0%)";
      prevSlide.style.zIndex = "2";

      // Force reflow để trình duyệt nhận vị trí xuất phát
      void nextSlide.offsetWidth;

      // Trượt đồng thời từ trái sang phải trong đúng 1s
      const anim = "transform 1s cubic-bezier(0.22, 1, 0.36, 1)";
      nextSlide.style.transition = anim;
      prevSlide.style.transition = anim;
      nextSlide.style.transform = "translateX(0%)";
      prevSlide.style.transform = "translateX(100%)";

      setTimeout(() => {
        prevSlide.classList.remove("is-active");
        prevSlide.style.transition = "none";
        prevSlide.style.transform = "translateX(-100%)";
        prevSlide.style.zIndex = "1";
        prevSlide.style.pointerEvents = "none";

        nextSlide.classList.add("is-active");
        nextSlide.style.zIndex = "2";
        currentIdx = nextIdx;
        isAnimating = false;
      }, 1020);
    }

    function startAuto() {
      stopAuto();
      timer = setInterval(() => {
        goToSlide((currentIdx + 1) % slides.length);
      }, 3200);
    }

    function stopAuto() {
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
        startAuto();
      });
    });

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    startAuto();
  }

  function getFiltersFromUrl() {
    const params = getUrlParams();
    const brand = params.brand_slug
      ? window.tsportStore?.getBrands().find((item) => item.slug === params.brand_slug)
      : null;
    return {
      search: params.q || params.search || "",
      sport_id: params.sport || "ALL",
      category_id: params.cat || "ALL",
      brand_id: params.brand || (params.brand_slug ? (brand?.id ?? params.brand_slug) : "ALL"),
      condition_type: params.condition || "ALL",
      max_price: params.max_price ? Number(params.max_price) : DEFAULT_MAX_PRICE,
      sort: params.sort || "newest",
      page: Number(params.page) || 1
    };
  }

  function renderFiltersSidebar() {
    const store = window.tsportStore;
    if (!store) return;

    const current = getFiltersFromUrl();

    // 1. Môn thể thao
    const sportList = document.getElementById("filterSportsList");
    if (sportList) {
      const sports = store.getSports();
      sportList.innerHTML = `
        <label class="ts-shop-check-row">
          <input type="radio" name="filterSportRadio" value="ALL" ${current.sport_id === "ALL" ? "checked" : ""} />
          <span>Tất cả môn</span>
        </label>
        ${sports.map((s) => `
          <label class="ts-shop-check-row">
            <input type="radio" name="filterSportRadio" value="${s.id}" ${String(current.sport_id) === String(s.id) ? "checked" : ""} />
            <span>${escapeHtml(s.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // 2. Danh mục (Cây cha - con gọn gàng)
    const catList = document.getElementById("filterCategoriesList");
    if (catList) {
      const categories = store.getCategories();
      catList.innerHTML = `
        <label class="ts-shop-check-row">
          <input type="radio" name="filterCatRadio" value="ALL" ${current.category_id === "ALL" ? "checked" : ""} />
          <span>Tất cả danh mục</span>
        </label>
        ${categories.map((c) => `
          <label class="ts-shop-check-row ${c.parent_id ? 'is-child' : ''}">
            <input type="radio" name="filterCatRadio" value="${c.id}" ${String(current.category_id) === String(c.id) ? "checked" : ""} />
            <span>${escapeHtml(c.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // 3. Thương hiệu
    const brandList = document.getElementById("filterBrandsList");
    if (brandList) {
      const brands = store.getBrands().slice(0, 8);
      brandList.innerHTML = `
        <label class="ts-shop-check-row">
          <input type="radio" name="filterBrandRadio" value="ALL" ${current.brand_id === "ALL" ? "checked" : ""} />
          <span>Tất cả thương hiệu</span>
        </label>
        ${brands.map((b) => `
          <label class="ts-shop-check-row">
            <input type="radio" name="filterBrandRadio" value="${b.id}" ${String(current.brand_id) === String(b.id) ? "checked" : ""} />
            <span>${escapeHtml(b.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // 4. Tình trạng
    document.querySelectorAll('input[name="filterConditionRadio"]').forEach((r) => {
      r.checked = r.value === current.condition_type;
    });

    // 5. Khoảng giá slider
    const slider = document.getElementById("filterMaxPriceSlider");
    const priceLabel = document.getElementById("filterPriceRangeText");
    if (slider) slider.value = current.max_price;
    if (priceLabel) priceLabel.textContent = `0đ - ${Number(current.max_price).toLocaleString("vi-VN")}đ`;

    // Đồng bộ sắp xếp & ô tìm kiếm
    const sortSelect = document.getElementById("shopSortSelect");
    if (sortSelect) sortSelect.value = current.sort;

    const searchInput = document.getElementById("shopSearchInput");
    if (searchInput) searchInput.value = current.search;
  }

  function loadProductsFromUrl() {
    const grid = document.getElementById("shopProductGrid");
    if (!grid) return;

    const filters = getFiltersFromUrl();
    currentPage = filters.page;

    // Đồng bộ trạng thái active trên thanh điều hướng (Sản phẩm vs Đồ cũ)
    const navLinks = document.querySelectorAll(".ts-nav-full-orange .ts-inline-nav-link");
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (filters.condition_type === "CU") {
        a.classList.toggle("is-active", href.includes("condition=CU"));
      } else {
        a.classList.toggle("is-active", href === "shop.html");
      }
    });

    // Loading skeleton ngắn gọn
    renderLoadingState(grid);

    setTimeout(() => {
      try {
        const store = window.tsportStore;
        if (!store) throw new Error("Chưa khởi tạo dữ liệu cửa hàng.");

        let list = store.getProducts({
          search: filters.search,
          sport_id: filters.sport_id,
          category_id: filters.category_id,
          brand_id: filters.brand_id,
          condition_type: filters.condition_type,
          only_active: true
        });

        // Lọc theo mức giá tối đa từ slider
        if (filters.max_price && filters.max_price < DEFAULT_MAX_PRICE) {
          list = list.filter((p) => {
            const minPrice = getMinEffectivePrice(p);
            return minPrice <= filters.max_price;
          });
        }

        // Sắp xếp
        if (filters.sort === "price_asc") {
          list.sort((a, b) => getMinEffectivePrice(a) - getMinEffectivePrice(b));
        } else if (filters.sort === "price_desc") {
          list.sort((a, b) => getMinEffectivePrice(b) - getMinEffectivePrice(a));
        } else {
          list.sort((a, b) => b.id - a.id);
        }

        const totalItems = list.length;
        const countEl = document.getElementById("shopTotalCount");
        if (countEl) countEl.textContent = `${totalItems} sản phẩm`;

        if (totalItems === 0) {
          renderEmptyState(grid);
          renderPagination(0, 1);
          return;
        }

        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedList = list.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        renderProducts(grid, paginatedList);
        renderPagination(totalPages, currentPage);
      } catch (err) {
        renderErrorState(grid, err.message);
      }
    }, 100);
  }

  function getMinEffectivePrice(prod) {
    if (!prod.skus || prod.skus.length === 0) return 0;
    return Math.min(...prod.skus.map((s) =>
      (s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price))
        ? Number(s.sale_price)
        : Number(s.price)
    ));
  }

  function renderLoadingState(grid) {
    let html = "";
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="ts-shop-card-v2" style="pointer-events:none;">
          <div class="ts-shop-card-media tsport-skeleton"></div>
          <div class="tsport-skeleton" style="height:14px; width:82%; margin-bottom:8px; border-radius:4px;"></div>
          <div class="tsport-skeleton" style="height:11px; width:55%; margin-bottom:10px; border-radius:4px;"></div>
          <div class="tsport-skeleton" style="height:16px; width:45%; border-radius:4px;"></div>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  function renderEmptyState(grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px; padding:48px 24px; text-align:center;">
        <h3 style="font-size:17px; font-weight:800; color:#111827; margin:0 0 8px 0;">Không tìm thấy sản phẩm phù hợp</h3>
        <p style="font-size:13px; color:#6B7280; margin:0 0 18px 0;">Vui lòng thử từ khóa khác hoặc xóa bộ lọc đang áp dụng.</p>
        <button type="button" class="ts-shop-apply-btn" id="btnResetFiltersEmpty" style="width:auto; padding:10px 22px;">Xóa bộ lọc</button>
      </div>
    `;
    document.getElementById("btnResetFiltersEmpty")?.addEventListener("click", resetAllFilters);
  }

  function renderErrorState(grid, errMsg) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; background:#FFFFFF; border:1px solid #FECACA; border-radius:10px; padding:40px 24px; text-align:center;">
        <h3 style="font-size:16px; font-weight:800; color:#991B1B; margin:0 0 6px 0;">Lỗi tải danh sách sản phẩm</h3>
        <p style="font-size:13px; color:#6B7280; margin:0 0 16px 0;">${escapeHtml(errMsg || "Không thể kết nối dữ liệu.")}</p>
        <button type="button" class="ts-shop-apply-btn" id="btnRetryShopLoad" style="width:auto; padding:9px 20px;">Thử tải lại</button>
      </div>
    `;
    document.getElementById("btnRetryShopLoad")?.addEventListener("click", loadProductsFromUrl);
  }

  function renderProducts(grid, products) {
    grid.innerHTML = products.map((p) => {
      const primaryImg = (p.images && p.images.find((i) => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };
      const skus = p.skus || [];
      const hasSale = skus.some((s) => s.sale_price && Number(s.sale_price) > 0 && Number(s.sale_price) < Number(s.price));
      const minEff = getMinEffectivePrice(p);
      const minOrig = skus.length ? Math.min(...skus.map((s) => Number(s.price))) : 0;
      const isUsed = p.condition_type === "CU";
      const sizes = [...new Set(skus.map((s) => s.size).filter(Boolean))].slice(0, 2).join(", ");
      const metaText = sizes ? `Màu / Size ${sizes} / Chiếc` : "Màu / Size / Đơn vị";

      return `
        <a href="product-detail.html?id=${p.id}" class="ts-shop-card-v2">
          <div class="ts-shop-card-media">
            <span class="ts-shop-card-badge ${isUsed ? 'is-used' : ''}">
              ${isUsed ? 'Đã qua sử dụng' : 'Mới'}
            </span>
            <img src="${escapeHtml(storefrontImageUrl(primaryImg.image_url))}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
          </div>
          <h3 class="ts-shop-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="ts-shop-card-meta">${escapeHtml(metaText)}</div>
          <div class="ts-shop-card-price-row">
            <span class="ts-shop-card-price">${formatShopMoney(minEff)}</span>
            ${hasSale ? `<span class="ts-shop-card-oldprice">${formatShopMoney(minOrig)}</span>` : ""}
          </div>
        </a>
      `;
    }).join("");

    if (typeof window.gsap !== "undefined") {
      window.gsap.from(grid.querySelectorAll(".ts-shop-card-v2"), {
        y: 12,
        opacity: 0,
        duration: 0.35,
        stagger: 0.03,
        ease: "power2.out",
        clearProps: "transform,opacity"
      });
    }
  }

  function renderPagination(totalPages, activePage) {
    renderCompactPagination(document.getElementById("shopPagination"), totalPages, activePage);
  }

  function applySelectedFiltersFromSidebar() {
    const sportVal = document.querySelector('input[name="filterSportRadio"]:checked')?.value || "ALL";
    const catVal = document.querySelector('input[name="filterCatRadio"]:checked')?.value || "ALL";
    const brandVal = document.querySelector('input[name="filterBrandRadio"]:checked')?.value || "ALL";
    const condVal = document.querySelector('input[name="filterConditionRadio"]:checked')?.value || "ALL";
    const maxPriceVal = Number(document.getElementById("filterMaxPriceSlider")?.value) || DEFAULT_MAX_PRICE;

    updateUrlParams({
      sport: sportVal === "ALL" ? null : sportVal,
      cat: catVal === "ALL" ? null : catVal,
      brand: brandVal === "ALL" ? null : brandVal,
      brand_slug: null,
      condition: condVal === "ALL" ? null : condVal,
      max_price: maxPriceVal < DEFAULT_MAX_PRICE ? maxPriceVal : null,
      page: null
    });

    closeMobileFilters();
    loadProductsFromUrl();
  }

  function resetAllFilters() {
    updateUrlParams({
      q: null,
      sport: null,
      cat: null,
      brand: null,
      brand_slug: null,
      condition: null,
      max_price: null,
      sort: "newest",
      page: null
    }, true);
    renderFiltersSidebar();
    loadProductsFromUrl();
  }

  function bindEvents() {
    const btnToggleMobile = document.getElementById("btnToggleMobileFilter");
    const btnCloseMobile = document.getElementById("btnCloseMobileFilter");
    const sidebar = document.getElementById("shopFilterSidebar");

    const backdrop = document.createElement("div");
    backdrop.className = "ts-shop-filter-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.append(backdrop);
    closeMobileFilters = initResponsiveDrawer({
      toggle: btnToggleMobile, drawer: sidebar, close: btnCloseMobile, backdrop, breakpoint: 768
    });

    // Cập nhật text khoảng giá khi kéo thanh trượt
    const priceSlider = document.getElementById("filterMaxPriceSlider");
    const priceLabel = document.getElementById("filterPriceRangeText");
    priceSlider?.addEventListener("input", () => {
      if (priceLabel) {
        priceLabel.textContent = `0đ - ${Number(priceSlider.value).toLocaleString("vi-VN")}đ`;
      }
    });

    // Nút Áp dụng bộ lọc
    document.getElementById("btnApplyFilters")?.addEventListener("click", applySelectedFiltersFromSidebar);

    // Lọc tức thì khi thay đổi radio trên desktop
    document.addEventListener("change", (e) => {
      if (window.matchMedia("(max-width: 768px)").matches) return;
      if (
        e.target.name === "filterSportRadio" ||
        e.target.name === "filterCatRadio" ||
        e.target.name === "filterBrandRadio" ||
        e.target.name === "filterConditionRadio"
      ) {
        applySelectedFiltersFromSidebar();
      }
    });

    // Sắp xếp
    document.getElementById("shopSortSelect")?.addEventListener("change", (e) => {
      updateUrlParams({ sort: e.target.value, page: null });
      loadProductsFromUrl();
    });

    // Tìm kiếm
    document.getElementById("shopSearchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("shopSearchInput")?.value.trim() || "";
      updateUrlParams({ q: q || null, page: null });
      loadProductsFromUrl();
    });

    // Xóa lọc
    document.getElementById("btnResetFilters")?.addEventListener("click", resetAllFilters);

    // Phân trang
    document.getElementById("shopPagination")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".ts-shop-page-btn");
      if (!btn || btn.disabled) return;
      const targetPage = Number(btn.dataset.page);
      if (targetPage) {
        updateUrlParams({ page: targetPage > 1 ? targetPage : null });
        loadProductsFromUrl();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function formatShopMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await window.tsportCatalogReady;
    initShopModule();
  });
})();
