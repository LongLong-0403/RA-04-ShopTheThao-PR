/**
 * TSPORT — MODULE QUẢN LÝ THU MUA ĐỒ CŨ & TỰ ĐỘNG TẠO SKU HÀNG CŨ (BUYBACK)
 */
(function () {
  const STORE_KEY = "tsport_store_data_v4";
  let activeFilter = "ALL";
  let pendingSkuBuybackId = null;

  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(parsed.buybacks)) parsed.buybacks = [];
      if (!Array.isArray(parsed.products)) parsed.products = [];
      return parsed;
    } catch (_) {
      return { buybacks: [], products: [] };
    }
  }

  function writeStore(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function formatPrice(val) {
    const num = Number(val);
    if (!Number.isFinite(num) || num <= 0) return "Chưa có";
    return num.toLocaleString("vi-VN") + " đ";
  }

  function escapeText(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensurePricingTab() {
    const container =
      document.querySelector(".tsport-filter-bar > div") ||
      document.querySelector(".tsport-filter-bar");
    if (!container || container.querySelector('[data-status="DANG_DINH_GIA"]')) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary btn-sm js-filter-buyback-status";
    btn.dataset.status = "DANG_DINH_GIA";
    btn.textContent = "💰 Đang định giá";

    const doneTab = container.querySelector('[data-status="DA_THU_MUA"]');
    if (doneTab) {
      container.insertBefore(btn, doneTab);
    } else {
      container.appendChild(btn);
    }
  }

  function getBuybackListByFilter() {
    const data = readStore();
    const list = Array.isArray(data.buybacks) ? data.buybacks : [];
    if (!activeFilter || activeFilter === "ALL") return list;
    return list.filter((item) => item.status === activeFilter);
  }

  function renderBuybacksTable() {
    ensurePricingTab();

    const tbody = document.getElementById("adminBuybackTbody");
    if (!tbody) return;

    const list = getBuybackListByFilter();
    const countBadge = document.getElementById("adminBuybackCountBadge");
    if (countBadge) countBadge.textContent = `${list.length} yêu cầu`;

    if (list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94A3B8;">Chưa có yêu cầu thu mua nào ở trạng thái này.</td></tr>';
      return;
    }

    const statusBadgeMap = {
      CHO_DUYET: '<span class="badge" style="background:#FEF3C7; color:#B45309;">⏳ Chờ duyệt</span>',
      DANG_DINH_GIA:
        '<span class="badge" style="background:#DBEAFE; color:#1D4ED8;">💰 Đang định giá</span>',
      DA_THU_MUA: '<span class="badge badge-active">✓ Đã thu mua</span>',
      TU_CHOI: '<span class="badge badge-inactive">✕ Từ chối</span>',
      DA_HUY: '<span class="badge" style="background:#F1F5F9; color:#64748B;">Đã hủy</span>'
    };

    tbody.innerHTML = list
      .map((b) => {
        const desired = b.desired_price ?? b.proposed_price ?? 0;
        const offered = b.offered_price;

        let actionHtml = '<span style="font-size:11px; color:#94A3B8;">Hoàn tất</span>';

        if (b.status === "CHO_DUYET") {
          actionHtml = `
            <div style="display:flex; flex-direction:column; gap:6px;">
              <input type="number" min="1000" step="1000" class="form-control js-offer-price-input" data-id="${b.id}"
                value="${offered || desired || ""}" placeholder="Nhập giá đề nghị (VNĐ)" style="font-size:12px; padding:5px 8px;" />
              <button type="button" class="btn btn-primary btn-sm js-start-pricing" data-id="${b.id}">
                💰 Chuyển Đang định giá
              </button>
              <button type="button" class="btn btn-secondary btn-sm js-reject-buyback" data-id="${b.id}">
                ✕ Từ chối
              </button>
            </div>
          `;
        } else if (b.status === "DANG_DINH_GIA") {
          actionHtml = `
            <div style="display:flex; flex-direction:column; gap:6px;">
              <input type="number" min="1000" step="1000" class="form-control js-offer-price-input" data-id="${b.id}"
                value="${offered || desired || ""}" placeholder="Cập nhật giá đề nghị" style="font-size:12px; padding:5px 8px;" />
              <button type="button" class="btn btn-primary btn-sm js-save-offer-price" data-id="${b.id}">
                Lưu giá đề nghị
              </button>
              <button type="button" class="btn btn-primary btn-sm js-finalize-buyback" data-id="${b.id}" style="background:#16A34A; border-color:#16A34A;">
                ✓ Đã thu mua
              </button>
              <button type="button" class="btn btn-secondary btn-sm js-reject-buyback" data-id="${b.id}">
                ✕ Từ chối
              </button>
            </div>
          `;
        } else if (b.status === "DA_THU_MUA" && !b.sku_created) {
          actionHtml = `
            <button type="button" class="btn btn-primary btn-sm js-open-create-sku" data-id="${b.id}" style="background:#16A34A; border-color:#16A34A;">
              ➕ Tạo SKU hàng cũ
            </button>
          `;
        }

        return `
          <tr>
            <td>#${escapeText(b.id)}</td>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="${escapeText(b.image_url)}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300'" />
                <div>
                  <strong style="color:#0F172A; font-size:14px;">${escapeText(b.product_name)}</strong>
                  <div style="font-size:11px; color:#64748B;">Hãng: ${escapeText(b.brand || "-")} | Model: ${escapeText(b.model || "-")}</div>
                  <div style="font-size:11px; color:#64748B;">Tình trạng: <strong>${escapeText(b.condition_grade || "85%")}</strong></div>
                </div>
              </div>
            </td>
            <td>
              <strong>${escapeText(b.customer_name)}</strong>
              <div style="font-size:11px; color:#64748B;">Liên hệ: ${escapeText(b.contact_info || b.phone || "-")}</div>
            </td>
            <td style="max-width:240px; font-size:12px; color:#475569; line-height:1.4;">
              ${escapeText(b.wear_description || "-")}
            </td>
            <td style="font-size:12px;">
              <div>Mong muốn: <strong style="color:#0F172A;">${formatPrice(desired)}</strong></div>
              <div style="margin-top:2px;">Đề nghị: <strong style="color:#D94C26;">${formatPrice(offered)}</strong></div>
            </td>
            <td>
              ${statusBadgeMap[b.status] || escapeText(b.status)}
              ${b.sku_created ? `<div style="font-size:10px; color:#16A34A; margin-top:2px; font-weight:700;">✓ Đã tạo SKU: ${escapeText(b.created_sku_code || "")}</div>` : ""}
            </td>
            <td style="text-align:center;">${actionHtml}</td>
          </tr>
        `;
      })
      .join("");
  }

  function ensureSkuModal() {
    if (document.getElementById("tsportSkuPopupBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "tsportSkuPopupBackdrop";
    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(15,23,42,0.48)",
      "backdrop-filter:blur(2px)",
      "display:none",
      "align-items:center",
      "justify-content:center",
      "padding:16px",
      "z-index:9999",
      "font-family:'Roboto',sans-serif"
    ].join(";");

    backdrop.innerHTML = `
      <div style="width:100%; max-width:440px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; box-shadow:0 20px 40px rgba(15,23,42,0.18); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid #E2E8F0; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#D94C26; letter-spacing:0.4px;">Nhập kho hàng cũ</div>
            <h3 style="margin:2px 0 0; font-size:17px; font-weight:800; color:#0F172A;">Tạo mã SKU hàng cũ</h3>
          </div>
          <button type="button" id="tsportSkuCloseBtn" style="border:none; background:#F1F5F9; color:#475569; width:30px; height:30px; border-radius:8px; cursor:pointer; font-weight:700;">✕</button>
        </div>

        <form id="tsportSkuPopupForm" style="padding:18px 20px;">
          <div id="tsportSkuItemSummary" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px; margin-bottom:14px; font-size:12.5px; color:#334155;"></div>

          <div style="margin-bottom:12px;">
            <label for="tsportSkuPriceInput" style="display:block; font-size:13px; font-weight:700; color:#0F172A; margin-bottom:6px;">
              Giá bán niêm yết (VNĐ) *
            </label>
            <input type="number" id="tsportSkuPriceInput" required min="1000" step="1000"
              style="width:100%; padding:10px 12px; border:1px solid #CBD5E1; border-radius:8px; font-size:14px; font-weight:700; color:#0F172A; box-sizing:border-box;" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
            <div>
              <label for="tsportSkuSizeInput" style="display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:5px;">Size / Trọng lượng</label>
              <input type="text" id="tsportSkuSizeInput" value="Tiêu chuẩn"
                style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px; box-sizing:border-box;" />
            </div>
            <div>
              <label for="tsportSkuStockInput" style="display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:5px;">Số lượng tồn</label>
              <input type="number" id="tsportSkuStockInput" min="1" step="1" value="1"
                style="width:100%; padding:8px 10px; border:1px solid #CBD5E1; border-radius:8px; font-size:13px; box-sizing:border-box;" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
            <button type="button" id="tsportSkuCancelBtn"
              style="padding:9px 14px; border-radius:8px; border:1px solid #CBD5E1; background:#FFFFFF; color:#334155; font-size:13px; font-weight:700; cursor:pointer;">
              Hủy
            </button>
            <button type="submit"
              style="padding:9px 16px; border-radius:8px; border:none; background:#16A34A; color:#FFFFFF; font-size:13px; font-weight:700; cursor:pointer;">
              ✓ Xác nhận tạo SKU
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closePopup = () => {
      pendingSkuBuybackId = null;
      backdrop.style.display = "none";
    };

    document.getElementById("tsportSkuCloseBtn")?.addEventListener("click", closePopup);
    document.getElementById("tsportSkuCancelBtn")?.addEventListener("click", closePopup);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closePopup();
    });

    document.getElementById("tsportSkuPopupForm")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!pendingSkuBuybackId) return;

      const price = Number(document.getElementById("tsportSkuPriceInput")?.value) || 1500000;
      const size = (document.getElementById("tsportSkuSizeInput")?.value || "Tiêu chuẩn").trim();
      const stock = Math.max(1, Number(document.getElementById("tsportSkuStockInput")?.value) || 1);

      if (window.tsportStore && typeof window.tsportStore.createSkuFromBuyback === "function") {
        try {
          const res = window.tsportStore.createSkuFromBuyback(pendingSkuBuybackId, {
            price,
            size,
            stock,
            unit: "CHIEC",
            quantity_per_lot: 1
          });
          closePopup();
          renderBuybacksTable();
          if (typeof showToast === "function") {
            showToast(`Đã tạo SKU "${res.skuCode}" vào kho sản phẩm!`, "success");
          }
          return;
        } catch (err) {
          alert("⚠️ " + err.message);
          return;
        }
      }

      const data = readStore();
      const item = data.buybacks.find((b) => Number(b.id) === Number(pendingSkuBuybackId));
      if (!item) return;

      const skuCode = `USED-BBX-${Math.floor(1000 + Math.random() * 9000)}`;
      const maxProdId = data.products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);

      data.products.push({
        id: maxProdId + 1,
        sport_id: 1,
        category_id: 2,
        brand_id: 1,
        name: `${item.product_name} (Hàng cũ thu mua)`,
        description: item.wear_description || "",
        condition_type: "CU",
        wear_description: item.wear_description || "",
        status: "ACTIVE",
        specifications: { condition_grade: item.condition_grade || "85%", buyback_id: item.id },
        images: [{ id: Date.now(), image_url: item.image_url, is_primary: true, sort_order: 1 }],
        skus: [
          {
            id: Date.now() + 1,
            sku_code: skuCode,
            size,
            color: "Nguyên bản",
            price,
            stock,
            unit: "CHIEC",
            quantity_per_lot: 1,
            status: "ACTIVE"
          }
        ]
      });

      item.sku_created = true;
      item.created_sku_code = skuCode;
      writeStore(data);
      closePopup();
      renderBuybacksTable();
    });
  }

  function openSkuPopup(buybackId) {
    ensureSkuModal();
    const data = readStore();
    const item = (data.buybacks || []).find((b) => Number(b.id) === Number(buybackId));
    if (!item) return;

    pendingSkuBuybackId = Number(buybackId);
    const basePrice = Number(item.offered_price) || Number(item.desired_price) || Number(item.proposed_price) || 1500000;

    const summaryEl = document.getElementById("tsportSkuItemSummary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div><strong>Sản phẩm:</strong> ${escapeText(item.product_name)}</div>
        <div style="margin-top:3px;"><strong>Tình trạng:</strong> ${escapeText(item.condition_grade || "85%")} · <strong>Giá đề nghị:</strong> ${escapeText(formatPrice(item.offered_price))}</div>
      `;
    }

    const priceInput = document.getElementById("tsportSkuPriceInput");
    if (priceInput) priceInput.value = String(basePrice);

    const backdrop = document.getElementById("tsportSkuPopupBackdrop");
    if (backdrop) backdrop.style.display = "flex";
    setTimeout(() => priceInput?.focus(), 20);
  }

  function getPriceInput(id) {
    const input = document.querySelector(`.js-offer-price-input[data-id="${id}"]`);
    const val = input ? Number(input.value) : 0;
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  function bindEvents() {
    document.addEventListener(
      "click",
      (e) => {
        const filterBtn = e.target.closest(".js-filter-buyback-status");
        if (filterBtn) {
          e.preventDefault();
          e.stopPropagation();
          activeFilter = filterBtn.dataset.status || "ALL";
          document.querySelectorAll(".js-filter-buyback-status").forEach((b) => {
            b.classList.remove("is-active", "active", "btn-primary");
            if (!b.classList.contains("btn-secondary")) b.classList.add("btn-secondary");
          });
          filterBtn.classList.add("is-active", "active");
          renderBuybacksTable();
          return;
        }

        const startPricingBtn = e.target.closest(".js-start-pricing");
        if (startPricingBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = Number(startPricingBtn.dataset.id);
          const price = getPriceInput(id);
          const data = readStore();
          const item = data.buybacks.find((x) => Number(x.id) === id);
          if (!item || item.status !== "CHO_DUYET") return;
          if (price) {
            item.offered_price = price;
            item.proposed_price = price;
          }
          item.status = "DANG_DINH_GIA";
          writeStore(data);
          renderBuybacksTable();
          return;
        }

        const saveOfferBtn = e.target.closest(".js-save-offer-price");
        if (saveOfferBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = Number(saveOfferBtn.dataset.id);
          const price = getPriceInput(id);
          const data = readStore();
          const item = data.buybacks.find((x) => Number(x.id) === id);
          if (!item || !price) return;
          item.offered_price = price;
          item.proposed_price = price;
          writeStore(data);
          renderBuybacksTable();
          return;
        }

        const finalizeBtn = e.target.closest(".js-finalize-buyback");
        if (finalizeBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = Number(finalizeBtn.dataset.id);
          const price = getPriceInput(id);
          const data = readStore();
          const item = data.buybacks.find((x) => Number(x.id) === id);
          if (!item || item.status !== "DANG_DINH_GIA") return;
          if (price) {
            item.offered_price = price;
            item.proposed_price = price;
          }
          item.status = "DA_THU_MUA";
          writeStore(data);
          renderBuybacksTable();
          return;
        }

        const rejectBtn = e.target.closest(".js-reject-buyback");
        if (rejectBtn) {
          e.preventDefault();
          e.stopPropagation();
          const id = Number(rejectBtn.dataset.id);
          const reason = prompt("Nhập lý do từ chối thu mua:", "Sản phẩm hao mòn quá 30% hoặc nứt gãy");
          if (reason === null) return;
          const data = readStore();
          const item = data.buybacks.find((x) => Number(x.id) === id);
          if (!item) return;
          item.status = "TU_CHOI";
          item.note = reason;
          writeStore(data);
          renderBuybacksTable();
          return;
        }

        const skuBtn = e.target.closest(".js-open-create-sku");
        if (skuBtn) {
          e.preventDefault();
          e.stopPropagation();
          openSkuPopup(Number(skuBtn.dataset.id));
        }
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureSkuModal();
    ensurePricingTab();
    renderBuybacksTable();
    bindEvents();
  });
})();