/**
 * TSPORT — MODULE SẢN PHẨM KHÁCH HÀNG (SHOP CATALOG & GRID)
 * Tính năng:
 * - Lưới ảnh - tên - giá VNĐ (2/3/4 cột theo màn hình)
 * - Bộ lọc bên trái (Môn, Loại hàng, Thương hiệu, Mới/Cũ, Khoảng giá)
 * - Mở / đóng bộ lọc dạng Drawer trên Mobile
 * - Sắp xếp theo giá (tăng dần / giảm dần / mới nhất)
 * - Phân trang (Pagination)
 * - Giữ điều kiện lọc trên URL (URLSearchParams) để khi reload hoặc mở từ menu hiển thị đúng danh sách
 * - 3 Trạng thái chuẩn: Đang tải (Loading Skeleton) / Danh sách rỗng (Empty) / Lỗi tải (Error retry)
 */

(function () {
  const ITEMS_PER_PAGE = 8;
  let currentPage = 1;

  function initShopModule() {
    renderFiltersSidebar();
    bindEvents();
    loadProductsFromUrl();
  }

  // Đọc điều kiện lọc từ URL
  function getFiltersFromUrl() {
    const params = getUrlParams();
    return {
      search: params.q || "",
      sport_id: params.sport || "ALL",
      category_id: params.cat || "ALL",
      brand_id: params.brand || "ALL",
      condition_type: params.condition || "ALL",
      price_range: params.price || "ALL",
      sort: params.sort || "newest",
      page: Number(params.page) || 1
    };
  }

  // Lưu điều kiện lọc lên URL
  function syncFiltersToUrl(filters) {
    updateUrlParams({
      q: filters.search,
      sport: filters.sport_id,
      cat: filters.category_id,
      brand: filters.brand_id,
      condition: filters.condition_type,
      price: filters.price_range,
      sort: filters.sort,
      page: filters.page > 1 ? filters.page : null
    });
  }

  // Render Bộ lọc bên trái (Sidebar)
  function renderFiltersSidebar() {
    const store = window.tsportStore;
    if (!store) return;

    const current = getFiltersFromUrl();

    // 1. Môn thể thao
    const sportList = document.getElementById("filterSportsList");
    if (sportList) {
      const sports = store.getSports();
      sportList.innerHTML = `
        <label class="tsport-filter-label">
          <input type="radio" name="filterSportRadio" value="ALL" ${current.sport_id === "ALL" ? "checked" : ""} />
          <span>Tất cả môn</span>
        </label>
        ${sports.map((s) => `
          <label class="tsport-filter-label">
            <input type="radio" name="filterSportRadio" value="${s.id}" ${current.sport_id == s.id ? "checked" : ""} />
            <span>${escapeHtml(s.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // 2. Danh mục sản phẩm (Cây phân cấp)
    const catList = document.getElementById("filterCategoriesList");
    if (catList) {
      const categories = store.getCategories();
      catList.innerHTML = `
        <label class="tsport-filter-label">
          <input type="radio" name="filterCatRadio" value="ALL" ${current.category_id === "ALL" ? "checked" : ""} />
          <span>Tất cả loại</span>
        </label>
        ${categories.map((c) => `
          <label class="tsport-filter-label" style="${c.parent_id ? 'padding-left:14px;' : 'font-weight:700;'}">
            <input type="radio" name="filterCatRadio" value="${c.id}" ${current.category_id == c.id ? "checked" : ""} />
            <span>${c.parent_id ? '↳ ' : ''}${escapeHtml(c.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // 3. Thương hiệu
    const brandList = document.getElementById("filterBrandsList");
    if (brandList) {
      const brands = store.getBrands();
      brandList.innerHTML = `
        <label class="tsport-filter-label">
          <input type="radio" name="filterBrandRadio" value="ALL" ${current.brand_id === "ALL" ? "checked" : ""} />
          <span>Tất cả thương hiệu</span>
        </label>
        ${brands.map((b) => `
          <label class="tsport-filter-label">
            <input type="radio" name="filterBrandRadio" value="${b.id}" ${current.brand_id == b.id ? "checked" : ""} />
            <span>${escapeHtml(b.name)}</span>
          </label>
        `).join("")}
      `;
    }

    // Đồng bộ select sắp xếp và ô tìm kiếm
    const sortSelect = document.getElementById("shopSortSelect");
    if (sortSelect) sortSelect.value = current.sort;

    const searchInput = document.getElementById("shopSearchInput");
    if (searchInput) searchInput.value = current.search;
  }

  // Tải danh sách sản phẩm với hiệu ứng loading và các trạng thái
  function loadProductsFromUrl() {
    const grid = document.getElementById("shopProductGrid");
    if (!grid) return;

    // 1. Hiển thị TRẠNG THÁI ĐANG TẢI (Loading Skeleton)
    renderLoadingState(grid);

    // Giả lập độ trễ mạng nhẹ (150ms) để thể hiện trạng thái tải mượt mà
    setTimeout(() => {
      try {
        const store = window.tsportStore;
        if (!store) throw new Error("Chưa khởi tạo Store dữ liệu!");

        const filters = getFiltersFromUrl();
        currentPage = filters.page;

        // Lấy dữ liệu và lọc
        let list = store.getProducts({
          search: filters.search,
          sport_id: filters.sport_id,
          category_id: filters.category_id,
          brand_id: filters.brand_id,
          condition_type: filters.condition_type
        });

        // Lọc theo khoảng giá
        if (filters.price_range && filters.price_range !== "ALL") {
          list = list.filter((p) => {
            const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.price)) : 0;
            if (filters.price_range === "UNDER_1M") return minPrice < 1000000;
            if (filters.price_range === "1M_3M") return minPrice >= 1000000 && minPrice <= 3000000;
            if (filters.price_range === "3M_5M") return minPrice >= 3000000 && minPrice <= 5000000;
            if (filters.price_range === "ABOVE_5M") return minPrice > 5000000;
            return true;
          });
        }

        // Sắp xếp theo giá hoặc mới nhất
        if (filters.sort === "price_asc") {
          list.sort((a, b) => {
            const pA = a.skus.length ? Math.min(...a.skus.map(s => s.price)) : 0;
            const pB = b.skus.length ? Math.min(...b.skus.map(s => s.price)) : 0;
            return pA - pB;
          });
        } else if (filters.sort === "price_desc") {
          list.sort((a, b) => {
            const pA = a.skus.length ? Math.min(...a.skus.map(s => s.price)) : 0;
            const pB = b.skus.length ? Math.min(...b.skus.map(s => s.price)) : 0;
            return pB - pA;
          });
        } else if (filters.sort === "name_asc") {
          list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
        } else {
          // Mới nhất (id giảm dần)
          list.sort((a, b) => b.id - a.id);
        }

        const totalItems = list.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
        if (currentPage > totalPages) currentPage = 1;

        // Phân trang
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pagedList = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // Cập nhật số lượng sản phẩm hiển thị trên badge
        const countBadge = document.getElementById("shopResultCount");
        if (countBadge) {
          countBadge.innerHTML = `Hiển thị <strong>${pagedList.length}</strong> / <strong>${totalItems}</strong> sản phẩm`;
        }

        // 2. Kiểm tra TRẠNG THÁI RỖNG (Empty State)
        if (totalItems === 0) {
          renderEmptyState(grid);
          renderPagination(0, 1);
          return;
        }

        // 3. Render danh sách sản phẩm bình thường
        renderProducts(grid, pagedList);
        renderPagination(totalPages, currentPage);

      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        // 4. TRẠNG THÁI LỖI (Error State)
        renderErrorState(grid, err.message);
      }
    }, 150);
  }

  // TRẠNG THÁI 1: LOADING SKELETON
  function renderLoadingState(grid) {
    let skeletons = "";
    for (let i = 0; i < 8; i++) {
      skeletons += `
        <div class="tsport-skeleton-card">
          <div class="tsport-skeleton-thumb"></div>
          <div class="tsport-skeleton-line short"></div>
          <div class="tsport-skeleton-line"></div>
          <div class="tsport-skeleton-line short" style="margin-top:14px;"></div>
        </div>
      `;
    }
    grid.innerHTML = skeletons;
  }

  // TRẠNG THÁI 2: EMPTY STATE
  function renderEmptyState(grid) {
    grid.innerHTML = `
      <div class="tsport-empty-state">
        <div class="tsport-empty-icon">🔍📦</div>
        <h3 class="tsport-empty-title">Không tìm thấy sản phẩm nào!</h3>
        <p class="tsport-empty-desc">
          Rất tiếc, không có sản phẩm nào khớp với các tiêu chí lọc hiện tại của bạn. Vui lòng thử tìm kiếm khác hoặc xóa bớt bộ lọc.
        </p>
        <button type="button" class="btn btn-primary" id="btnResetFiltersEmpty">
          ✕ Xóa tất cả bộ lọc & Xem toàn bộ sản phẩm
        </button>
      </div>
    `;
    document.getElementById("btnResetFiltersEmpty")?.addEventListener("click", resetAllFilters);
  }

  // TRẠNG THÁI 3: ERROR STATE
  function renderErrorState(grid, errMsg) {
    grid.innerHTML = `
      <div class="tsport-error-state">
        <div class="tsport-error-icon">⚠️</div>
        <h3 class="tsport-error-title">Đã xảy ra lỗi khi tải dữ liệu!</h3>
        <p class="tsport-error-desc">${escapeHtml(errMsg || "Không thể kết nối đến kho dữ liệu.")}</p>
        <button type="button" class="btn btn-secondary" id="btnRetryShopLoad">
          🔄 Thử tải lại ngay
        </button>
      </div>
    `;
    document.getElementById("btnRetryShopLoad")?.addEventListener("click", loadProductsFromUrl);
  }

  // RENDER LƯỚI SẢN PHẨM 2/3/4 CỘT
  function renderProducts(grid, products) {
    const store = window.tsportStore;
    const brands = store ? store.getBrands() : [];
    const sports = store ? store.getSports() : [];

    let html = "";
    products.forEach((p) => {
      const brand = brands.find((b) => b.id === p.brand_id);
      const sport = sports.find((s) => s.id === p.sport_id);

      // Ảnh chính
      const primaryImg = (p.images && p.images.find((i) => i.is_primary)) || (p.images && p.images[0]) || { image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600" };

      // Giá thấp nhất trong các SKU
      const minPrice = p.skus && p.skus.length ? Math.min(...p.skus.map(s => s.price)) : 0;
      const totalStock = p.skus ? p.skus.reduce((sum, s) => sum + s.stock, 0) : 0;

      // Nhãn Mới / Cũ
      const isUsed = p.condition_type === "CU";

      // Điểm đánh giá trung bình
      const ratingInfo = store && typeof store.getProductRating === "function"
        ? store.getProductRating(p.id)
        : { avgRating: 5.0, count: 0 };

      html += `
        <a href="product-detail.html?id=${p.id}" class="tsport-product-card">
          <div class="tsport-product-thumb">
            <img src="${escapeHtml(primaryImg.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'" />
            <div class="tsport-card-badges">
              <span class="tsport-badge-condition ${isUsed ? 'cu' : 'moi'}">
                ${isUsed ? 'ĐỒ CŨ MINH BẠCH' : 'HÀNG MỚI 100%'}
              </span>
              ${sport ? `<span class="tsport-badge-sport-tag">${escapeHtml(sport.name)}</span>` : ''}
            </div>
          </div>

          <div class="tsport-product-info">
            <div class="tsport-product-brand">${escapeHtml(brand ? brand.name : 'Tsport')}</div>
            <h3 class="tsport-product-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
            
            <div style="display:flex; align-items:center; gap:6px; font-size:12px; margin:4px 0;">
              <span style="color:#F59E0B; font-weight:800;">★ ${ratingInfo.avgRating}</span>
              <span style="color:#64748B; font-size:11px;">(${ratingInfo.count} đánh giá)</span>
            </div>

            <div class="tsport-product-meta">
              <span>${p.skus ? p.skus.length : 0} biến thể</span>
              <span>•</span>
              <span class="tsport-product-stock-tag ${totalStock > 0 ? '' : 'out'}">
                ${totalStock > 0 ? `Còn hàng (${totalStock})` : 'Tạm hết hàng'}
              </span>
            </div>

            <div class="tsport-product-bottom">
              <div class="tsport-product-price">${formatMoney(minPrice)}</div>
              <span style="font-size:12px; color:#D94C26; font-weight:700;">Xem chi tiết →</span>
            </div>
          </div>
        </a>
      `;
    });

    grid.innerHTML = html;
  }

  // RENDER THANH PHÂN TRANG (PAGINATION)
  function renderPagination(totalPages, activePage) {
    const container = document.getElementById("shopPagination");
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `
      <button type="button" class="tsport-page-btn" ${activePage <= 1 ? 'disabled' : ''} data-page="${activePage - 1}">
        ‹ Trước
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      html += `
        <button type="button" class="tsport-page-btn ${p === activePage ? 'is-active' : ''}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    html += `
      <button type="button" class="tsport-page-btn" ${activePage >= totalPages ? 'disabled' : ''} data-page="${activePage + 1}">
        Sau ›
      </button>
    `;

    container.innerHTML = html;
  }

  // Xóa toàn bộ bộ lọc
  function resetAllFilters() {
    updateUrlParams({
      q: null,
      sport: null,
      cat: null,
      brand: null,
      condition: null,
      price: null,
      sort: "newest",
      page: null
    }, true);
    renderFiltersSidebar();
    loadProductsFromUrl();
  }

  // GẮN CÁC SỰ KIỆN
  function bindEvents() {
    // 1. Mobile Filter Drawer Open / Close
    const btnToggleMobile = document.getElementById("btnToggleMobileFilter");
    const btnCloseMobile = document.getElementById("btnCloseMobileFilter");
    const sidebar = document.getElementById("shopFilterSidebar");

    btnToggleMobile?.addEventListener("click", () => {
      sidebar?.classList.add("is-open");
    });
    btnCloseMobile?.addEventListener("click", () => {
      sidebar?.classList.remove("is-open");
    });

    // 2. Bắt sự kiện thay đổi radio môn / danh mục / thương hiệu / tình trạng / khoảng giá
    document.addEventListener("change", (e) => {
      if (e.target.name === "filterSportRadio") {
        updateUrlParams({ sport: e.target.value, page: null });
        loadProductsFromUrl();
      } else if (e.target.name === "filterCatRadio") {
        updateUrlParams({ cat: e.target.value, page: null });
        loadProductsFromUrl();
      } else if (e.target.name === "filterBrandRadio") {
        updateUrlParams({ brand: e.target.value, page: null });
        loadProductsFromUrl();
      } else if (e.target.name === "filterConditionRadio") {
        updateUrlParams({ condition: e.target.value, page: null });
        loadProductsFromUrl();
      } else if (e.target.name === "filterPriceRadio") {
        updateUrlParams({ price: e.target.value, page: null });
        loadProductsFromUrl();
      }
    });

    // 3. Sắp xếp giá
    document.getElementById("shopSortSelect")?.addEventListener("change", (e) => {
      updateUrlParams({ sort: e.target.value, page: null });
      loadProductsFromUrl();
    });

    // 4. Tìm kiếm từ ô input
    const searchForm = document.getElementById("shopSearchForm");
    searchForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("shopSearchInput")?.value.trim() || "";
      updateUrlParams({ q: val, page: null });
      loadProductsFromUrl();
    });

    // 5. Nút xóa bộ lọc trên sidebar
    document.getElementById("btnResetFilters")?.addEventListener("click", resetAllFilters);

    // 6. Phân trang
    document.getElementById("shopPagination")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tsport-page-btn");
      if (btn && !btn.disabled && btn.dataset.page) {
        updateUrlParams({ page: Number(btn.dataset.page) });
        loadProductsFromUrl();
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    });

    // 7. Lắng nghe popstate (người dùng bấm nút Back/Forward trên trình duyệt)
    window.addEventListener("popstate", () => {
      renderFiltersSidebar();
      loadProductsFromUrl();
    });
  }

  document.addEventListener("DOMContentLoaded", initShopModule);
})();
