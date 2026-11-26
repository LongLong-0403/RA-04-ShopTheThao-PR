/**
 * TSPORT — MODULE QUẢN LÝ ĐƠN HÀNG (ADMIN ORDERS V2 FIGMA)
 * - View 1: Danh sách đơn hàng 6 cột (tìm theo mã/khách, lọc trạng thái, nút Mở đơn đang chờ xử lý)
 * - View 2: Chi tiết & xử lý vòng đời đơn hàng (PENDING -> CONFIRMED -> SHIPPING -> COMPLETED / CANCELLED hoàn tồn kho)
 */

(function () {
  let currentOrderId = null;
  let orderRows = [];
  let detailRevision = 0;

  async function initAdminOrders() {
    orderRows = (await api.get("/orders")).map(orderView);
    initTopbarControls();
    renderOrdersTable();
    bindEvents();
    const code = new URLSearchParams(location.search).get("code");
    const order = orderRows.find(row => row.order_code === code);
    if (order) await openOrderDetail(order.id);
  }

  function initTopbarControls() {
    const userBtn = document.getElementById("btnAdminUserMenu");
    const dropdown = document.getElementById("adminUserDropdown");
    userBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("is-open");
    });
    document.addEventListener("click", () => dropdown?.classList.remove("is-open"));
    document.getElementById("btnAdminLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  const pageSize = 10;
  let currentPage = 1;

  function formatDMY(str) {
    if (!str) return "";
    const parts = String(str).slice(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  }

  function formatMoneyVN(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function getPayLabel(method) {
    const map = {
      COD: "COD",
      BANK: "Chuyển khoản",
      EWALLET_MOMO: "Ví MoMo",
      EWALLET_ZALOPAY: "Ví ZaloPay",
      EWALLET_VNPAY: "Ví VNPay"
    };
    return map[method] || method || "COD";
  }

  function getStatusMeta(status) {
    const map = {
      PENDING: { label: "Chờ xử lý", cls: "is-pending", next: "CONFIRMED", nextLabel: "Xác nhận đơn (CONFIRMED)" },
      CONFIRMED: { label: "Đã xác nhận", cls: "", next: "SHIPPING", nextLabel: "Chuyển đang giao (SHIPPING)" },
      SHIPPING: { label: "Đang giao", cls: "", next: "COMPLETED", nextLabel: "Hoàn tất đơn (COMPLETED)" },
      COMPLETED: { label: "Hoàn tất", cls: "", next: null, nextLabel: "Đơn đã hoàn tất" },
      CANCELLED: { label: "Đã hủy", cls: "is-cancelled", next: null, nextLabel: "Đơn đã hủy" }
    };
    return map[status] || { label: status, cls: "", next: null, nextLabel: status };
  }

  function showListView() {
    detailRevision++;
    currentOrderId = null;
    document.getElementById("admOrdersListView").style.display = "block";
    document.getElementById("admOrderDetailView").style.display = "none";
    const bc = document.getElementById("admOrdersBreadcrumb");
    if (bc) bc.textContent = "Quản lý đơn hàng";
    renderOrdersTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderOrdersTable() {
    const tbody = document.getElementById("admOrdersTbody");
    if (!tbody) return;

    const q = (document.getElementById("admOrderSearch")?.value || "").trim().toLowerCase();
    const statusFilter = document.getElementById("admOrderStatusFilter")?.value || "ALL";

    let orders = orderRows;
    if (statusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    if (q) {
      orders = orders.filter((o) => {
        const hay = `${o.order_code} ${o.customer_name} ${o.phone}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const totalPages = Math.ceil(orders.length / pageSize);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    renderCompactPagination(document.getElementById("admOrdersPagination"), totalPages, currentPage);

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:36px 16px; color:#6B7280;">
            Không tìm thấy đơn hàng phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders
      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
      .map((o) => {
        const st = getStatusMeta(o.status);
        return `
          <tr data-order-id="${o.id}">
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(o.order_code)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(formatDMY(o.created_at))}</div>
            </td>
            <td>${escapeHtml(o.customer_name || "Khách hàng")}</td>
            <td class="ts-orders-v2-total">${formatMoneyVN(o.total_amount)}</td>
            <td>${escapeHtml(getPayLabel(o.payment_method))}</td>
            <td><span class="ts-orders-v2-status ${st.cls}">${st.label}</span></td>
            <td>
              <button type="button" class="ts-orders-v2-detail-btn js-open-adm-order" data-id="${o.id}">
                Chi tiết →
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function openOrderDetail(orderId) {
    const revision = ++detailRevision;
    let order;
    try {
      order = await loadOrderDetail(orderId);
    } catch (error) {
      if (revision === detailRevision) showToast(error.message, "error");
      return;
    }
    if (revision !== detailRevision) return;
    orderRows = orderRows.map(row => row.id === order.id ? order : row);
    currentOrderId = order.id;
    document.getElementById("admOrdersListView").style.display = "none";
    document.getElementById("admOrderDetailView").style.display = "block";

    const bc = document.getElementById("admOrdersBreadcrumb");
    if (bc) bc.textContent = `Chi tiết đơn ${order.order_code}`;

    document.getElementById("admDetOrderCode").textContent = `Chi tiết đơn ${order.order_code}`;
    document.getElementById("admDetReceiverLine").textContent = `${order.customer_name || "Khách hàng"} • ${order.phone || ""}`;
    document.getElementById("admDetReceiverAddr").textContent = order.address || "Chưa cập nhật địa chỉ";
    document.getElementById("admDetOrderMeta").textContent = `${getPayLabel(order.payment_method)} • Phí vận chuyển 0đ • Tổng cộng ${formatMoneyVN(order.total_amount)}`;

    const st = getStatusMeta(order.status);
    const pillEl = document.getElementById("admDetStatusPill");
    if (pillEl) {
      pillEl.textContent = order.status === "PENDING" ? "Chờ xác nhận" : st.label;
      pillEl.className = `ts-orders-v2-status ${st.cls}`;
    }

    // Dòng vòng đời trạng thái
    const flowLine = document.getElementById("admDetFlowLine");
    if (flowLine) {
      const steps = [
        { key: "PENDING", label: "Chờ xử lý" },
        { key: "CONFIRMED", label: "Đã xác nhận" },
        { key: "SHIPPING", label: "Đang giao" },
        { key: "COMPLETED", label: "Hoàn tất" }
      ];
      if (order.status === "CANCELLED") {
        flowLine.innerHTML = `<strong style="color:#DC2626;">Đơn hàng đã hủy${order.restocked ? " • Đã hoàn kho (1 lần)" : ""}</strong>`;
      } else {
        flowLine.innerHTML = steps
          .map((s) =>
            s.key === order.status
              ? `<strong style="color:#111827;">${s.label}</strong>`
              : `<span>${s.label}</span>`
          )
          .join(' <span style="margin:0 8px; color:#9CA3AF;">→</span> ');
      }
    }

    // Bảng sản phẩm trong đơn
    const itemsBody = document.getElementById("admDetItemsBody");
    if (itemsBody) {
      itemsBody.innerHTML = (order.items || [])
        .map((item) => {
          const cond = item.condition_type === "CU" ? "Cũ" : "Mới";
          const unitPrice = Number(item.price_at_order || item.price || 0);
          const qty = Number(item.quantity || 1);
          const skuCode = item.sku_code || `SKU-${item.sku_id || 1}`;
          return `
            <tr>
              <td>
                <div class="ts-ord-det-prod-name">${escapeHtml(skuCode)}</div>
                <div class="ts-ord-det-prod-var">${escapeHtml(item.product_name)}</div>
              </td>
              <td>${cond}</td>
              <td>${qty}</td>
              <td>${formatMoneyVN(unitPrice)}</td>
              <td>${formatMoneyVN(unitPrice * qty)}</td>
            </tr>
          `;
        })
        .join("");
    }

    const btnConfirm = document.getElementById("btnAdmConfirmOrder");
    const btnNext = document.getElementById("btnAdmNextOrderStatus");
    const btnCancel = document.getElementById("btnAdmCancelOrder");

    if (btnConfirm) {
      btnConfirm.disabled = order.status !== "PENDING";
    }
    if (btnNext) {
      btnNext.disabled = order.status !== "CONFIRMED" && order.status !== "SHIPPING";
      btnNext.textContent =
        order.status === "CONFIRMED"
          ? "Chuyển trạng thái tiếp (Đang giao)"
          : order.status === "SHIPPING"
          ? "Chuyển trạng thái tiếp (Hoàn tất)"
          : "Chuyển trạng thái tiếp";
    }
    if (btnCancel) {
      btnCancel.disabled = order.status === "COMPLETED" || order.status === "CANCELLED";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateStatus(id, status) {
    const updated = await api.patch("/orders/" + id + "/status", { status });
    orderRows = orderRows.map(row => row.id === id ? { ...row, status: updated.status } : row);
  }

  function bindEvents() {
    document.getElementById("admOrdersPagination")?.addEventListener("click", event => {
      const button = event.target.closest("button[data-page]");
      if (!button || button.disabled) return;
      currentPage = Number(button.dataset.page);
      renderOrdersTable();
    });
    document.getElementById("admOrderSearch")?.addEventListener("input", () => { currentPage = 1; renderOrdersTable(); });
    document.getElementById("admOrderStatusFilter")?.addEventListener("change", () => { currentPage = 1; renderOrdersTable(); });

    document.getElementById("admOrdersTbody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-open-adm-order");
      if (btn) {
        openOrderDetail(Number(btn.dataset.id));
        return;
      }
      const row = e.target.closest("tr[data-order-id]");
      if (row) openOrderDetail(Number(row.dataset.orderId));
    });

    document.getElementById("btnOpenPendingOrder")?.addEventListener("click", () => {
      const pending = orderRows.find((o) => o.status === "PENDING");
      if (pending) {
        openOrderDetail(pending.id);
      } else {
        showToast("Hiện không có đơn hàng nào đang chờ xử lý.", "info");
      }
    });

    document.getElementById("btnBackToAdmOrders")?.addEventListener("click", showListView);

    async function advanceCurrentOrder(expectedNext) {
      if (!currentOrderId) return;
      const order = orderRows.find((o) => Number(o.id) === Number(currentOrderId));
      if (!order) return;

      const st = getStatusMeta(order.status);
      const nextStatus = expectedNext || st.next;
      if (!nextStatus) return;

      try {
        await updateStatus(order.id, nextStatus);
        showToast(`Đã chuyển đơn ${order.order_code} sang ${nextStatus}!`, "success");
        openOrderDetail(order.id);
      } catch (err) {
        showToast(err.message || "Không thể cập nhật trạng thái đơn.", "error");
      }
    }

    document.getElementById("btnAdmConfirmOrder")?.addEventListener("click", () => advanceCurrentOrder("CONFIRMED"));
    document.getElementById("btnAdmNextOrderStatus")?.addEventListener("click", () => advanceCurrentOrder(null));

    document.getElementById("btnAdmCancelOrder")?.addEventListener("click", async () => {
      if (!currentOrderId) return;
      const id = currentOrderId;
      if (!(await confirmAction("Xác nhận hủy đơn hàng này và hoàn lại tồn kho?", "Hủy đơn hàng"))) return;

      try {
        await updateStatus(id, "CANCELLED");
        showToast("Đã hủy đơn hàng và hoàn tồn kho thành công!", "success");
        if (currentOrderId === id) await openOrderDetail(id);
        else if (!currentOrderId) renderOrdersTable();
      } catch (err) {
        showToast(err.message || "Không thể hủy đơn hàng này.", "error");
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

  document.addEventListener("DOMContentLoaded", () => initAdminPage(initAdminOrders));
})();
