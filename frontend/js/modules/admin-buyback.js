/**
 * TSPORT — MODULE THẨM ĐỊNH THU MUA ĐỒ CŨ (ADMIN BUYBACK FIGMA)
 * Luồng trạng thái:
 * PENDING -> OFFERED -> ACCEPTED -> DA_THU_MUA (COMPLETED) -> Tạo SKU hàng cũ (nhánh REJECTED / CANCELLED)
 */

(function () {
  let selectedBuybackId = null;

  function initAdminBuyback() {
    initShellControls();
    ensureDemoBuybackRequest();
    ensureCreateSkuUi();
    selectInitialRequest();
    renderSwitcher();
    renderSelectedRequest();
    bindEvents();
  }

  function initShellControls() {
    const sidebar = document.getElementById("adminSidebar");
    const backdrop = document.getElementById("adminSidebarBackdrop");
    const toggleBtn = document.getElementById("btnToggleAdminSidebar");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("is-open");
        backdrop?.classList.toggle("is-open");
      });
    }
    backdrop?.addEventListener("click", () => {
      sidebar?.classList.remove("is-open");
      backdrop.classList.remove("is-open");
    });

    const userBtn = document.getElementById("btnAdminUserMenu");
    const dropdown = document.getElementById("adminUserDropdown");
    userBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("is-open");
    });
    document.addEventListener("click", () => {
      dropdown?.classList.remove("is-open");
    });

    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function ensureCreateSkuUi() {
    const card = document.getElementById("admBbDetailCard");
    if (!card || document.getElementById("admBbCreateSkuBox")) return;

    const box = document.createElement("div");
    box.id = "admBbCreateSkuBox";
    box.style.cssText =
      "display:none; margin-top:18px; padding:16px; border:1px solid #E2E8F0; border-radius:10px; background:#F8FAFC;";
    box.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
        <div>
          <strong style="font-size:14px; color:#0F172A;">Tạo SKU hàng cũ vào kho sản phẩm</strong>
          <div id="admBbSkuStatusText" style="font-size:12px; color:#475569; margin-top:2px;"></div>
        </div>
      </div>
      <div id="admBbSkuFormRow" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; align-items:end;">
        <div>
          <label for="admBbSkuPriceInput" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Giá bán đồ cũ (VNĐ)</label>
          <input type="number" id="admBbSkuPriceInput" class="ts-adm-input" min="10000" step="5000" />
        </div>
        <div>
          <label for="admBbSkuSizeInput" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Size / Thông số</label>
          <input type="text" id="admBbSkuSizeInput" class="ts-adm-input" value="Tiêu chuẩn" />
        </div>
        <div>
          <label for="admBbSkuColorInput" style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Màu sắc</label>
          <input type="text" id="admBbSkuColorInput" class="ts-adm-input" value="Nguyên bản" />
        </div>
        <div>
          <button type="button" class="ts-adm-btn-primary" id="btnAdmBbCreateSku" style="width:100%;">
            + Tạo SKU hàng cũ
          </button>
        </div>
      </div>
    `;

    const actionsEl = card.querySelector(".ts-adm-bb-actions");
    if (actionsEl) {
      actionsEl.insertAdjacentElement("afterend", box);
    } else {
      card.appendChild(box);
    }
  }

  function ensureDemoBuybackRequest() {
    const store = window.tsportStore;
    if (!store) return;

    const list = store.getBuybacks() || [];
    const hasSeed = list.some(
      (b) => b.request_code === "BB-001" || String(b.product_name || "").includes("Yonex Astrox 88D")
    );
    if (!hasSeed) {
      store.saveBuyback({
        request_code: "BB-001",
        customer_name: "Nguyễn Minh Anh",
        phone: "0901234567",
        sport_id: 1,
        sport_name: "Cầu lông",
        product_name: "Yonex Astrox 88D",
        condition_grade: "88%",
        condition_desc: "Trầy nhẹ ở viền khung; không nứt, đã sử dụng 6 tháng.",
        wear_description: "Trầy nhẹ ở viền khung; không nứt, đã sử dụng 6 tháng.",
        expected_price: 1200000,
        proposed_price: 1200000,
        offered_price: 1000000,
        images: [],
        status: "PENDING",
        created_at: "2026-11-07 09:00:00"
      });
    }
  }

  function getAllBuybacks() {
    const store = window.tsportStore;
    if (!store) return [];
    const list = store.getBuybacks() || [];
    return [...list].sort((a, b) => {
      const aPin = a.request_code === "BB-001" || String(a.product_name || "").includes("Yonex Astrox 88D") ? 1 : 0;
      const bPin = b.request_code === "BB-001" || String(b.product_name || "").includes("Yonex Astrox 88D") ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return Number(b.id) - Number(a.id);
    });
  }

  function selectInitialRequest() {
    const list = getAllBuybacks();
    if (!list.length) {
      selectedBuybackId = null;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const paramId = Number(params.get("id"));
    if (paramId && list.some((b) => Number(b.id) === paramId)) {
      selectedBuybackId = paramId;
      return;
    }
    selectedBuybackId = Number(list[0].id);
  }

  function getRequestCode(b) {
    if (b.request_code) return b.request_code;
    return `BB-${String(b.id || 1).padStart(3, "0")}`;
  }

  function formatDMY(raw) {
    if (!raw) return "07/11/2026";
    const datePart = String(raw).split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return datePart;
  }

  function formatVND(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function parseVND(str) {
    const digits = String(str || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function normalizeStatus(status) {
    const map = {
      CHO_DUYET: "PENDING",
      DA_THU_MUA: "COMPLETED",
      TU_CHOI: "REJECTED"
    };
    return map[status] || status || "PENDING";
  }

  function getStatusMeta(rawStatus) {
    const st = normalizeStatus(rawStatus);
    const map = {
      PENDING: {
        label: "Chờ thẩm định",
        pillCls: "",
        feedback: "Chờ phản hồi giá"
      },
      OFFERED: {
        label: "Đã gửi báo giá",
        pillCls: "",
        feedback: "Đã gửi giá đề nghị — Chờ khách hàng xác nhận"
      },
      ACCEPTED: {
        label: "Khách đã đồng ý",
        pillCls: "is-success",
        feedback: "Khách hàng đã đồng ý giá đề nghị — Sẵn sàng hoàn tất thu mua"
      },
      COMPLETED: {
        label: "Đã thu mua",
        pillCls: "is-neutral",
        feedback: "Đã hoàn tất thu mua và thanh toán cho khách"
      },
      REJECTED: {
        label: "Đã từ chối",
        pillCls: "is-cancelled",
        feedback: "Yêu cầu đã bị từ chối"
      },
      CANCELLED: {
        label: "Đã hủy",
        pillCls: "is-cancelled",
        feedback: "Yêu cầu đã bị hủy theo quy trình"
      }
    };
    return map[st] || { label: st, pillCls: "is-neutral", feedback: "Chờ phản hồi giá" };
  }

  function renderSwitcher() {
    const wrap = document.getElementById("admBbSwitcherWrap");
    const select = document.getElementById("admBbRequestSelect");
    if (!wrap || !select) return;

    const list = getAllBuybacks();
    if (list.length <= 1) {
      wrap.style.display = "none";
      return;
    }

    wrap.style.display = "flex";
    select.innerHTML = list
      .map((b) => {
        const code = getRequestCode(b);
        const st = getStatusMeta(b.status).label;
        return `<option value="${b.id}" ${Number(b.id) === Number(selectedBuybackId) ? "selected" : ""}>#${escapeHtml(code)} • ${escapeHtml(b.customer_name || "Khách hàng")} (${escapeHtml(st)})</option>`;
      })
      .join("");
  }

  function getRacketPlaceholderSvg() {
    return `
      <div class="ts-adm-bb-photo-placeholder" aria-hidden="true">
        <svg width="74" height="92" viewBox="0 0 74 92" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="42" cy="30" rx="22" ry="25" stroke="#CBD5E1" stroke-width="1.35"/>
          <line x1="33" y1="8" x2="33" y2="52" stroke="#E2E8F0" stroke-width="1"/>
          <line x1="42" y1="5" x2="42" y2="55" stroke="#E2E8F0" stroke-width="1"/>
          <line x1="51" y1="8" x2="51" y2="52" stroke="#E2E8F0" stroke-width="1"/>
          <line x1="32" y1="53" x2="14" y2="86" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }

  function renderSelectedRequest() {
    const store = window.tsportStore;
    const list = getAllBuybacks();
    const b = list.find((item) => Number(item.id) === Number(selectedBuybackId)) || list[0];
    if (!b) return;

    selectedBuybackId = Number(b.id);
    const code = getRequestCode(b);
    const stNorm = normalizeStatus(b.status);
    const stMeta = getStatusMeta(b.status);

    const sportName =
      b.sport_name ||
      store?.getSports()?.find((s) => Number(s.id) === Number(b.sport_id))?.name ||
      "Cầu lông";

    const titleEl = document.getElementById("admBbTitle");
    const statusPillEl = document.getElementById("admBbStatusPill");
    const metaEl = document.getElementById("admBbMeta");
    const photosEl = document.getElementById("admBbPhotosGrid");
    const descEl = document.getElementById("admBbDesc");
    const expectedEl = document.getElementById("admBbExpectedPrice");
    const offerInput = document.getElementById("admBbOfferInput");
    const sendOfferBtn = document.getElementById("btnAdmBbSendOffer");
    const feedbackEl = document.getElementById("admBbFeedback");
    const completeBtn = document.getElementById("btnAdmBbComplete");
    const cancelBtn = document.getElementById("btnAdmBbCancel");

    const skuBox = document.getElementById("admBbCreateSkuBox");
    const skuStatusText = document.getElementById("admBbSkuStatusText");
    const skuFormRow = document.getElementById("admBbSkuFormRow");
    const skuPriceInput = document.getElementById("admBbSkuPriceInput");

    if (titleEl) {
      titleEl.textContent = `Yêu cầu #${code} • ${b.customer_name || "Khách hàng"}`;
    }

    if (statusPillEl) {
      statusPillEl.textContent = stMeta.label;
      statusPillEl.className = "ts-adm-bb-status-pill" + (stMeta.pillCls ? " " + stMeta.pillCls : "");
    }

    if (metaEl) {
      metaEl.textContent = `${sportName} • ${b.product_name || "Sản phẩm"} • ${formatDMY(b.created_at)}`;
    }

    if (photosEl) {
      const rawImages =
        Array.isArray(b.images) && b.images.length ? b.images : b.image_url ? [b.image_url] : [];

      const slots = [0, 1, 2, 3].map((idx) => {
        const src = rawImages[idx] || "";
        const content = src
          ? `<img src="${escapeHtml(src)}" alt="Ảnh thực tế ${idx + 1}" onerror="this.remove();" />`
          : getRacketPlaceholderSvg();
        return `
          <div class="ts-adm-bb-photo-slot">
            ${content}
            <span class="ts-adm-bb-photo-label">ẢNH THỰC TẾ ${idx + 1}</span>
          </div>
        `;
      });
      photosEl.innerHTML = slots.join("");
    }

    if (descEl) {
      descEl.textContent =
        b.condition_desc || b.wear_description || "Chưa có mô tả chi tiết tình trạng sản phẩm.";
    }

    const expectedVal = Number(b.expected_price || b.proposed_price || 0);
    if (expectedEl) {
      expectedEl.textContent = formatVND(expectedVal);
    }

    const defaultOffer =
      b.offered_price != null && Number(b.offered_price) > 0
        ? Number(b.offered_price)
        : Math.max(100000, Math.round((expectedVal * 0.85) / 50000) * 50000);

    const isClosed = stNorm === "COMPLETED" || stNorm === "REJECTED" || stNorm === "CANCELLED";

    if (offerInput) {
      offerInput.value = formatVND(defaultOffer);
      offerInput.disabled = isClosed;
    }

    if (sendOfferBtn) {
      sendOfferBtn.disabled = isClosed;
      sendOfferBtn.style.opacity = isClosed ? "0.55" : "1";
      sendOfferBtn.style.cursor = isClosed ? "not-allowed" : "pointer";
      sendOfferBtn.textContent = stNorm === "OFFERED" ? "Cập nhật giá đề nghị" : "Gửi giá đề nghị";
    }

    if (feedbackEl) {
      const extraOffer =
        stNorm === "OFFERED" && b.offered_price
          ? ` (Giá đề nghị hiện tại: ${formatVND(b.offered_price)})`
          : "";
      feedbackEl.textContent = `Phản hồi của khách: ${stMeta.feedback}${extraOffer}`;
    }

    if (completeBtn) {
      const canComplete = stNorm === "ACCEPTED";
      completeBtn.disabled = !canComplete;
      completeBtn.classList.toggle("is-ready", canComplete);
      completeBtn.textContent = stNorm === "COMPLETED" ? "Đã thu mua" : "Hoàn tất khi khách đã đồng ý";
    }

    if (cancelBtn) {
      cancelBtn.disabled = isClosed;
      cancelBtn.style.opacity = isClosed ? "0.55" : "1";
      cancelBtn.style.cursor = isClosed ? "not-allowed" : "pointer";
    }

    // Khu vực Tạo SKU hàng cũ khi trạng thái là Đã thu mua (COMPLETED / DA_THU_MUA)
    if (skuBox) {
      const showSkuBox = stNorm === "COMPLETED";
      skuBox.style.display = showSkuBox ? "block" : "none";

      if (showSkuBox) {
        if (b.sku_created) {
          if (skuFormRow) skuFormRow.style.display = "none";
          if (skuStatusText) {
            skuStatusText.innerHTML = `Đã tạo SKU hàng cũ vào kho: <code>${escapeHtml(b.created_sku_code || "")}</code>`;
          }
        } else {
          if (skuFormRow) skuFormRow.style.display = "grid";
          if (skuStatusText) {
            skuStatusText.textContent = "Yêu cầu đã thu mua — Nhập thông tin để sinh sản phẩm cũ & mã SKU vào danh mục.";
          }
          if (skuPriceInput && !skuPriceInput.value) {
            const basePrice = Number(b.offered_price || b.expected_price || 1500000);
            skuPriceInput.value = String(Math.round((basePrice * 1.15) / 5000) * 5000 || 1500000);
          }
        }
      }
    }
  }

  function handleSendOffer(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store || !selectedBuybackId) return;

    const b = store.getBuybackById(selectedBuybackId);
    if (!b) return;

    const input = document.getElementById("admBbOfferInput");
    const offerAmount = parseVND(input?.value);
    if (!offerAmount || offerAmount < 10000) {
      if (typeof showToast === "function") {
        showToast("Vui lòng nhập mức giá đề nghị thu mua hợp lệ (tối thiểu 10.000đ).", "error");
      }
      input?.focus();
      return;
    }

    b.offered_price = offerAmount;
    b.status = "OFFERED";
    b.admin_note = `Đã gửi báo giá đề nghị ${formatVND(offerAmount)} tới khách hàng.`;
    store.save();

    renderSwitcher();
    renderSelectedRequest();
    if (typeof showToast === "function") {
      showToast(`Đã gửi giá đề nghị ${formatVND(offerAmount)} cho yêu cầu #${getRequestCode(b)}.`, "success");
    }
  }

  function handleCompleteBuyback() {
    const store = window.tsportStore;
    if (!store || !selectedBuybackId) return;

    const b = store.getBuybackById(selectedBuybackId);
    if (!b) return;

    if (normalizeStatus(b.status) !== "ACCEPTED") {
      if (typeof showToast === "function") {
        showToast("Chỉ có thể hoàn tất khi khách hàng đã đồng ý mức giá đề nghị.", "info");
      }
      return;
    }

    store.updateBuybackStatus(b.id, "DA_THU_MUA", "Đã kiểm định hoàn tất và thanh toán thu mua cho khách.");
    renderSwitcher();
    renderSelectedRequest();
    if (typeof showToast === "function") {
      showToast(`Đã thu mua yêu cầu #${getRequestCode(b)}. Bạn có thể tạo SKU hàng cũ ngay bên dưới.`, "success");
    }
  }

  function handleCreateSkuFromBuyback() {
    const store = window.tsportStore;
    if (!store || !selectedBuybackId) return;

    const b = store.getBuybackById(selectedBuybackId);
    if (!b) return;

    // Đảm bảo trạng thái lưu trong store khớp điều kiện DA_THU_MUA của store.createSkuFromBuyback
    if (normalizeStatus(b.status) === "COMPLETED" && b.status !== "DA_THU_MUA") {
      b.status = "DA_THU_MUA";
      store.save();
    }

    const price = Number(document.getElementById("admBbSkuPriceInput")?.value || b.offered_price || b.expected_price || 1500000);
    const size = document.getElementById("admBbSkuSizeInput")?.value.trim() || "Tiêu chuẩn";
    const color = document.getElementById("admBbSkuColorInput")?.value.trim() || "Nguyên bản";
    const wearDesc = b.condition_desc || b.wear_description || `Độ mới ${b.condition_grade || "85%"}. Đã qua kiểm định.`;

    try {
      const res = store.createSkuFromBuyback(b.id, {
        price,
        stock: 1,
        size,
        color,
        wear_description: wearDesc
      });
      renderSwitcher();
      renderSelectedRequest();
      if (typeof showToast === "function") {
        showToast(`Đã tạo SKU hàng cũ ${res.skuCode} thành công!`, "success");
      }
    } catch (err) {
      if (typeof showToast === "function") {
        showToast(err.message || "Không thể tạo SKU hàng cũ.", "error");
      } else {
        alert(err.message);
      }
    }
  }

  function handleCancelOrReject() {
    const store = window.tsportStore;
    if (!store || !selectedBuybackId) return;

    const b = store.getBuybackById(selectedBuybackId);
    if (!b) return;

    const stNorm = normalizeStatus(b.status);
    if (stNorm === "COMPLETED" || stNorm === "REJECTED" || stNorm === "CANCELLED") return;

    const nextStatus = stNorm === "PENDING" ? "REJECTED" : "CANCELLED";
    store.updateBuybackStatus(b.id, nextStatus, "Quản trị viên đã từ chối / hủy yêu cầu thu mua.");
    renderSwitcher();
    renderSelectedRequest();
    if (typeof showToast === "function") {
      showToast(`Đã cập nhật trạng thái ${nextStatus} cho yêu cầu #${getRequestCode(b)}.`, "info");
    }
  }

  function bindEvents() {
    document.getElementById("admBbRequestSelect")?.addEventListener("change", (e) => {
      selectedBuybackId = Number(e.target.value);
      renderSelectedRequest();
    });

    const offerInput = document.getElementById("admBbOfferInput");
    offerInput?.addEventListener("blur", () => {
      const val = parseVND(offerInput.value);
      if (val > 0) offerInput.value = formatVND(val);
    });

    document.getElementById("admBbOfferForm")?.addEventListener("submit", handleSendOffer);
    document.getElementById("btnAdmBbComplete")?.addEventListener("click", handleCompleteBuyback);
    document.getElementById("btnAdmBbCancel")?.addEventListener("click", handleCancelOrReject);
    document.getElementById("btnAdmBbCreateSku")?.addEventListener("click", handleCreateSkuFromBuyback);
  }

  document.addEventListener("DOMContentLoaded", initAdminBuyback);
})();