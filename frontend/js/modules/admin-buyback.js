/**
 * TSPORT — MODULE THẨM ĐỊNH THU MUA ĐỒ CŨ (ADMIN BUYBACK FIGMA)
 * Luồng trạng thái theo schema:
 * PENDING -> OFFERED -> ACCEPTED / REJECTED -> COMPLETED (nhánh CANCELLED)
 */

(function () {
  let selectedBuybackId = null;
  let buybackRows = [];

  async function initAdminBuyback() {
    buybackRows = (await api.get('/buyback-requests')).map(row => ({
      ...row, product_name: row.brand_model, condition_desc: row.condition_detail
    }));
    initShellControls();
    selectInitialRequest();
    renderSwitcher();
    renderSelectedRequest();
    bindEvents();
  }

  function initShellControls() {
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

  function selectInitialRequest() {
    const list = buybackRows;
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
    if (!raw) return "";
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
        label: "Hoàn tất",
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

    const list = buybackRows;
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
    const list = buybackRows;
    const b = list.find((item) => Number(item.id) === Number(selectedBuybackId)) || list[0];
    document.getElementById('admBbDetailCard').hidden = !b;
    document.getElementById('admBbEmpty').hidden = Boolean(b);
    if (!b) return;

    selectedBuybackId = Number(b.id);
    const code = getRequestCode(b);
    const stNorm = normalizeStatus(b.status);
    const stMeta = getStatusMeta(b.status);

    const sportName =
      b.sport_name ||
      store?.getSports()?.find((s) => Number(s.id) === Number(b.sport_id))?.name ||
      "Chưa chọn môn";

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

    // 4 ảnh thực tế
    if (photosEl) {
      const rawImages = Array.isArray(b.images) && b.images.length
        ? b.images
        : b.image_url
          ? [b.image_url]
          : [];

      const slots = Array.from({ length: Math.max(4, rawImages.length) }, (_, idx) => {
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

    if (offerInput) {
      offerInput.value = formatVND(defaultOffer);
      const isClosed = stNorm !== "PENDING";
      offerInput.disabled = isClosed;
    }

    if (sendOfferBtn) {
      const isClosed = stNorm !== "PENDING";
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
      completeBtn.textContent =
        stNorm === "COMPLETED" ? "Đã hoàn tất thu mua" : "Hoàn tất khi khách đã đồng ý";
    }

    if (cancelBtn) {
      const isClosed = stNorm !== "PENDING" && stNorm !== "ACCEPTED";
      cancelBtn.disabled = isClosed;
      cancelBtn.style.opacity = isClosed ? "0.55" : "1";
      cancelBtn.style.cursor = isClosed ? "not-allowed" : "pointer";
    }
  }

  async function updateRequest(status, offeredPrice) {
    const id = selectedBuybackId;
    const payload = offeredPrice === undefined ? { status } : { status, offered_price: offeredPrice };
    try {
      await api.patch("/buyback-requests/" + id + "/status", payload);
      buybackRows = buybackRows.map(row => row.id === id ? {
        ...row, status, offered_price: offeredPrice ?? row.offered_price
      } : row);
      renderSwitcher();
      renderSelectedRequest();
      showToast("Đã cập nhật yêu cầu thu mua.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  function handleSendOffer(e) {
    e.preventDefault();
    const input = document.getElementById("admBbOfferInput");
    const amount = parseVND(input.value);
    if (amount < 10000 || !amount) {
      showToast("Vui lòng nhập giá đề nghị tối thiểu 10.000đ.", "error");
      input.focus();
      return;
    }
    return updateRequest("OFFERED", amount);
  }

  function handleCompleteBuyback() {
    return updateRequest("COMPLETED");
  }

  function handleCancelOrReject() {
    const request = buybackRows.find(row => row.id === selectedBuybackId);
    if (request) return updateRequest(request.status === "PENDING" ? "REJECTED" : "CANCELLED");
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
  }

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminBuyback));
})();
