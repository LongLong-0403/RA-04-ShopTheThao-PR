/**
 * TSPORT — MODULE YÊU CẦU THU MUA CỦA TÔI (MY BUYBACKS FIGMA)
 * - Hiển thị chi tiết từng yêu cầu thu mua kèm 3 ảnh thực tế, mô tả tình trạng
 * - So sánh Giá mong muốn vs Giá cửa hàng đề nghị + nút Đồng ý / Từ chối giá đề nghị
 * - Hỗ trợ Hủy yêu cầu khi còn Chờ thẩm định hoặc Đã báo giá
 */

(function () {
  function initMyBuybacksPage() {
    initSidebarUser();
    initHeaderSearch();
    ensureDemoQuotedBuyback();
    renderBuybacksList();
    bindEvents();
  }

  function getInitials(name) {
    const parts = String(name || "TS").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function initSidebarUser() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null") || {
      full_name: "Nguyễn Minh Anh",
      role: "CUSTOMER"
    };
    const nameEl = document.getElementById("sbBuybacksName");
    const roleEl = document.getElementById("sbBuybacksRole");
    const avatarEl = document.getElementById("sbBuybacksAvatar");
    if (nameEl) nameEl.textContent = user.full_name || user.email || "Khách hàng";
    if (roleEl) roleEl.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    if (avatarEl) avatarEl.textContent = getInitials(user.full_name || user.email);

    document.getElementById("btnBuybacksLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function initHeaderSearch() {
    const form = document.getElementById("myBuybacksSearchForm");
    const input = document.getElementById("myBuybacksSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  // Đảm bảo có sẵn 1 yêu cầu ở trạng thái Đã báo giá (OFFERED) để khách trải nghiệm luồng phản hồi
  function ensureDemoQuotedBuyback() {
    const store = window.tsportStore;
    if (!store) return;
    const list = store.getBuybacks() || [];
    const hasDemo = list.some((b) => String(b.product_name || "").includes("Yonex Astrox 88D"));
    if (!hasDemo) {
      store.saveBuyback({
        customer_name: "Nguyễn Minh Anh",
        phone: "0901234567",
        sport_name: "Cầu lông",
        product_name: "Yonex Astrox 88D",
        condition_desc: "Trầy nhẹ ở viền khung; không nứt, đã sử dụng 6 tháng.",
        expected_price: 1200000,
        offered_price: 1000000,
        images: [
          "/frontend/assets/products/victor-auraspeed-90k-ii.png",
          "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400",
          "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=400"
        ],
        status: "OFFERED",
        created_at: "2026-11-07"
      });
    }
  }

  function formatDMY(iso) {
    const parts = String(iso || "").split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso || "";
  }

  function formatMoneyVN(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function getStatusMeta(status) {
    const map = {
      PENDING: { label: "Chờ thẩm định", cls: "is-pending" },
      CHO_DUYET: { label: "Chờ thẩm định", cls: "is-pending" },
      OFFERED: { label: "Đã báo giá", cls: "is-pending" },
      ACCEPTED: { label: "Đã đồng ý", cls: "" },
      REJECTED: { label: "Đã từ chối", cls: "is-cancelled" },
      TU_CHOI: { label: "Đã từ chối", cls: "is-cancelled" },
      DA_THU_MUA: { label: "Hoàn tất", cls: "" },
      COMPLETED: { label: "Hoàn tất", cls: "" },
      CANCELLED: { label: "Đã hủy", cls: "is-cancelled" }
    };
    return map[status] || { label: status, cls: "" };
  }

  function renderBuybacksList() {
    const wrap = document.getElementById("myBuybacksList");
    const store = window.tsportStore;
    if (!wrap || !store) return;

    const buybacks = store.getBuybacks() || [];

    if (buybacks.length === 0) {
      wrap.innerHTML = `
        <div class="ts-mybb-card" style="text-align:center; padding:48px 24px;">
          <h3 style="font-size:17px; font-weight:800; color:#111827; margin:0 0 8px 0;">Bạn chưa gửi yêu cầu thu mua nào</h3>
          <p style="font-size:13px; color:#6B7280; margin:0 0 18px 0;">Gửi ảnh và mô tả dụng cụ cũ để nhận báo giá từ Tsport.</p>
          <a href="buyback.html" class="ts-acc-v2-btn-primary" style="text-decoration:none; display:inline-block;">Gửi yêu cầu định giá</a>
        </div>
      `;
      return;
    }

    const fallbackImg = "/frontend/assets/products/victor-auraspeed-90k-ii.png";

    wrap.innerHTML = buybacks
      .map((b) => {
        const st = getStatusMeta(b.status);
        const sportName =
          b.sport_name ||
          (store.getSports().find((s) => Number(s.id) === Number(b.sport_id))?.name) ||
          "Cầu lông";
        const desc = b.condition_desc || b.wear_description || "Đang cập nhật mô tả tình trạng.";
        const expected = Number(b.expected_price || b.proposed_price || 0);
        const offered = b.offered_price != null ? Number(b.offered_price) : b.status === "DA_THU_MUA" ? expected : null;

        let imgs = Array.isArray(b.images) && b.images.length ? b.images : [b.image_url || fallbackImg];
        while (imgs.length < 3) imgs = [...imgs, imgs[0]];
        imgs = imgs.slice(0, 3);

        const isOffered = b.status === "OFFERED";
        const canCancel = b.status === "PENDING" || b.status === "CHO_DUYET" || b.status === "OFFERED";

        return `
          <article class="ts-mybb-card" data-buyback-id="${b.id}">
            <div class="ts-mybb-card-head">
              <div>
                <h2 class="ts-mybb-title">${escapeHtml(b.product_name)}</h2>
                <div class="ts-mybb-meta">Gửi ngày ${escapeHtml(formatDMY(b.created_at))} • ${escapeHtml(sportName)}</div>
              </div>
              <span class="ts-orders-v2-status ${st.cls}">${escapeHtml(st.label)}</span>
            </div>

            <div class="ts-mybb-photos">
              ${imgs
                .map(
                  (src, idx) => `
                  <div class="ts-mybb-photo-box">
                    <img src="${escapeHtml(src)}" alt="Ảnh thực tế ${idx + 1}" onerror="this.src='${fallbackImg}'" />
                    <span class="ts-mybb-photo-tag">ẢNH THỰC TẾ ${idx + 1}</span>
                  </div>
                `
                )
                .join("")}
            </div>

            <div class="ts-mybb-desc-block">
              <div class="ts-mybb-desc-label">Tình trạng bạn mô tả</div>
              <p class="ts-mybb-desc-text">${escapeHtml(desc)}</p>
            </div>

            <div class="ts-mybb-offer-box">
              <div class="ts-mybb-price-grid">
                <div>
                  <div class="ts-mybb-price-label">Giá mong muốn</div>
                  <div class="ts-mybb-price-expected">${formatMoneyVN(expected)}</div>
                </div>
                <div>
                  <div class="ts-mybb-price-label">Giá cửa hàng đề nghị</div>
                  <div class="ts-mybb-price-offered">${offered != null ? formatMoneyVN(offered) : "Đang thẩm định..."}</div>
                </div>
              </div>

              ${
                isOffered
                  ? `
                <div class="ts-mybb-offer-actions">
                  <button type="button" class="ts-mybb-btn-accept js-bb-accept" data-id="${b.id}">Đồng ý giá đề nghị</button>
                  <button type="button" class="ts-mybb-btn-reject js-bb-reject" data-id="${b.id}">Từ chối giá đề nghị</button>
                </div>
              `
                  : ""
              }
            </div>

            <div class="ts-mybb-flow-note">
              Trạng thái: Chờ thẩm định → Đã báo giá → Đồng ý / Từ chối → Hoàn tất
            </div>

            ${
              canCancel
                ? `<div class="ts-mybb-cancel-wrap"><button type="button" class="ts-mybb-cancel-btn js-bb-cancel" data-id="${b.id}">Hủy yêu cầu</button></div>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  function bindEvents() {
    document.getElementById("myBuybacksList")?.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const acceptBtn = e.target.closest(".js-bb-accept");
      if (acceptBtn) {
        store.updateBuybackStatus(acceptBtn.dataset.id, "ACCEPTED", "Khách hàng đã đồng ý giá đề nghị.");
        renderBuybacksList();
        showToast("Bạn đã đồng ý giá đề nghị! Cửa hàng sẽ liên hệ hoàn tất thu mua.", "success");
        return;
      }

      const rejectBtn = e.target.closest(".js-bb-reject");
      if (rejectBtn) {
        if (confirm("Bạn có chắc muốn từ chối giá đề nghị này?")) {
          store.updateBuybackStatus(rejectBtn.dataset.id, "REJECTED", "Khách hàng từ chối giá đề nghị.");
          renderBuybacksList();
          showToast("Đã từ chối giá đề nghị.", "info");
        }
        return;
      }

      const cancelBtn = e.target.closest(".js-bb-cancel");
      if (cancelBtn) {
        if (confirm("Bạn có chắc muốn hủy yêu cầu thu mua này không?")) {
          store.updateBuybackStatus(cancelBtn.dataset.id, "CANCELLED", "Khách hàng chủ động hủy yêu cầu.");
          renderBuybacksList();
          showToast("Đã hủy yêu cầu thu mua.", "info");
        }
      }
    });
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

  document.addEventListener("DOMContentLoaded", initMyBuybacksPage);
})();
