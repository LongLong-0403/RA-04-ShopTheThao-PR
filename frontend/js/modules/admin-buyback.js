/**
 * TSPORT — MODULE QUẢN LÝ THU MUA ĐỒ CŨ & TỰ ĐỘNG TẠO SKU HÀNG CŨ (BUYBACK)
 * Tính năng:
 * - Admin duyệt yêu cầu thu mua đồ cũ của khách hàng
 * - Nút "Tạo SKU hàng cũ vào Kho" khi đã ở trạng thái ĐÃ THU MUA
 * - Sinh mã SKU USED-XXX, tự động đồng bộ vào danh mục đồ cũ của module Sản phẩm
 */

(function () {
  let activeFilter = "ALL";
  let currentBuybackId = null;

  function initAdminBuyback() {
    renderBuybacksTable();
    bindEvents();
  }

  function renderBuybacksTable() {
    const tbody = document.getElementById("adminBuybackTbody");
    if (!tbody) return;

    const store = window.tsportStore;
    if (!store) return;

    const buybacks = store.getBuybacks(activeFilter);
    const countBadge = document.getElementById("adminBuybackCountBadge");
    if (countBadge) countBadge.textContent = `${buybacks.length} yêu cầu`;

    if (buybacks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94A3B8;">Chưa có yêu cầu thu mua nào.</td></tr>';
      return;
    }

    const statusBadgeMap = {
      CHO_DUYET: '<span class="badge" style="background:#FEF3C7; color:#B45309;">⏳ Chờ duyệt</span>',
      DA_THU_MUA: '<span class="badge badge-active">✓ Đã thu mua</span>',
      TU_CHOI: '<span class="badge badge-inactive">✕ Từ chối</span>'
    };

    tbody.innerHTML = buybacks.map((b) => `
      <tr>
        <td>#${b.id}</td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${escapeHtml(b.image_url)}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300'" />
            <div>
              <strong style="color:#0F172A; font-size:14px;">${escapeHtml(b.product_name)}</strong>
              <div style="font-size:11px; color:#64748B;">Độ mới: <strong>${escapeHtml(b.condition_grade || '85%')}</strong></div>
            </div>
          </div>
        </td>
        <td>
          <strong>${escapeHtml(b.customer_name)}</strong>
          <div style="font-size:11px; color:#64748B;">SĐT: ${escapeHtml(b.phone)}</div>
        </td>
        <td style="max-width:240px; font-size:12px; color:#475569; line-height:1.4;">
          ${escapeHtml(b.wear_description || '-')}
        </td>
        <td style="font-weight:900; color:#D94C26;">${formatMoney(b.proposed_price)}</td>
        <td>
          ${statusBadgeMap[b.status] || b.status}
          ${b.sku_created ? `<div style="font-size:10px; color:#16A34A; margin-top:2px; font-weight:700;">✓ Đã tạo SKU: ${escapeHtml(b.created_sku_code || '')}</div>` : ''}
        </td>
        <td style="text-align:center;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${b.status === 'CHO_DUYET' ? `
              <button type="button" class="btn btn-primary btn-sm js-buyback-approve" data-id="${b.id}">
                ✓ Duyệt thu mua
              </button>
              <button type="button" class="btn btn-secondary btn-sm js-buyback-reject" data-id="${b.id}">
                Từ chối
              </button>
            ` : b.status === 'DA_THU_MUA' && !b.sku_created ? `
              <button type="button" class="btn btn-primary btn-sm js-open-create-sku" data-id="${b.id}" style="background:#16A34A; border-color:#16A34A;">
                ➕ Tạo SKU hàng cũ
              </button>
            ` : `
              <span style="font-size:11px; color:#94A3B8;">Hoàn tất</span>
            `}
          </div>
        </td>
      </tr>
    `).join("");
  }

  function openCreateUsedSkuModal(buybackId) {
    const store = window.tsportStore;
    const b = store.getBuybackById(buybackId);
    if (!b) return;

    currentBuybackId = buybackId;
    document.getElementById("modalBuybackTitle").textContent = b.product_name;
    document.getElementById("usedSkuPrice").value = b.proposed_price ? Math.round(b.proposed_price * 1.25) : 1500000;
    document.getElementById("usedSkuWearDesc").value = b.wear_description || "";
    document.getElementById("usedSkuStock").value = 1;
    document.getElementById("usedSkuSize").value = "Tiêu chuẩn";
    document.getElementById("usedSkuColor").value = "Nguyên bản";
    const unitSelect = document.getElementById("usedSkuUnit");
    if (unitSelect) unitSelect.value = "CHIEC";
    const lotGroup = document.getElementById("groupUsedSkuLotQty");
    if (lotGroup) lotGroup.style.display = "none";

    openModal("modalCreateUsedSku");
  }

  function handleCreateUsedSkuSubmit(e) {
    e.preventDefault();
    const store = window.tsportStore;
    if (!store || !currentBuybackId) return;

    const price = Number(document.getElementById("usedSkuPrice").value);
    const stock = Number(document.getElementById("usedSkuStock").value) || 1;
    const size = document.getElementById("usedSkuSize").value.trim();
    const color = document.getElementById("usedSkuColor").value.trim();
    const wearDesc = document.getElementById("usedSkuWearDesc").value.trim();
    const unit = document.getElementById("usedSkuUnit")?.value || "CHIEC";
    const quantity_per_lot = Number(document.getElementById("usedSkuLotQty")?.value) || 1;

    try {
      const res = store.createSkuFromBuyback(currentBuybackId, {
        price,
        stock,
        size,
        color,
        wear_description: wearDesc,
        unit,
        quantity_per_lot
      });

      closeModal("modalCreateUsedSku");
      renderBuybacksTable();
      showToast(`Đã tạo thành công sản phẩm đồ cũ với SKU "${res.skuCode}" vào Kho!`, "success");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  function bindEvents() {
    document.getElementById("usedSkuUnit")?.addEventListener("change", (e) => {
      const lotGroup = document.getElementById("groupUsedSkuLotQty");
      if (lotGroup) {
        lotGroup.style.display = e.target.value === "LO" ? "block" : "none";
      }
    });
    // Filter tabs
    document.querySelectorAll(".js-filter-buyback-status").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".js-filter-buyback-status").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeFilter = btn.dataset.status;
        renderBuybacksTable();
      });
    });

    // Thao tác duyệt / từ chối
    document.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      const approveBtn = e.target.closest(".js-buyback-approve");
      if (approveBtn) {
        store.updateBuybackStatus(Number(approveBtn.dataset.id), "DA_THU_MUA", "Đã kiểm tra chất lượng và thanh toán tiền cho khách");
        renderBuybacksTable();
        showToast("Đã duyệt thu mua thành công! Bây giờ bạn có thể bấm 'Tạo SKU hàng cũ'.", "success");
      }

      const rejectBtn = e.target.closest(".js-buyback-reject");
      if (rejectBtn) {
        const reason = prompt("Nhập lý do từ chối thu mua:", "Sản phẩm hao mòn quá 30% hoặc nứt gãy");
        if (reason !== null) {
          store.updateBuybackStatus(Number(rejectBtn.dataset.id), "TU_CHOI", reason);
          renderBuybacksTable();
          showToast("Đã từ chối yêu cầu thu mua.", "info");
        }
      }

      const createSkuBtn = e.target.closest(".js-open-create-sku");
      if (createSkuBtn) {
        openCreateUsedSkuModal(Number(createSkuBtn.dataset.id));
      }
    });

    document.getElementById("formCreateUsedSku")?.addEventListener("submit", handleCreateUsedSkuSubmit);
  }

  document.addEventListener("DOMContentLoaded", initAdminBuyback);
})();
