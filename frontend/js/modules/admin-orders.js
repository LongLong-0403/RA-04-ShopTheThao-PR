/**
 * TSPORT — MODULE QUẢN LÝ ĐƠN HÀNG (ADMIN ORDERS V2 FIGMA)
 * - View 1: Danh sách đơn hàng 6 cột (tìm theo mã/khách, lọc trạng thái, nút Mở đơn đang chờ xử lý)
 * - View 2: Chi tiết & xử lý vòng đời đơn hàng (PENDING -> CONFIRMED -> SHIPPING -> COMPLETED / CANCELLED hoàn tồn kho)
 */

(function () {
  let currentOrderId = null;

  function initAdminOrders() {
    initTopbarControls();
    renderOrdersTable();
    bindEvents();
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
    document.getElementById("btnToggleAdminSidebar")?.addEventListener("click", () => {
      document.getElementById("adminSidebar")?.classList.toggle("is-open");
    });
  }

  function formatDMY(str) {
    if (!str) return "";
    const parts = String(str).split(" ")[0].split("-");
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
    const store = window.tsportStore;
    if (!tbody || !store) return;

    const q = (document.getElementById("admOrderSearch")?.value || "").trim().toLowerCase();
    const statusFilter = document.getElementById("admOrderStatusFilter")?.value || "ALL";

    let orders = store.getOrders() || [];
    if (statusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    if (q) {
      orders = orders.filter((o) => {
        const hay = `${o.order_code} ${o.customer_name} ${o.phone}`.toLowerCase();
        return hay.includes(q);
      });
    }

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

  function openOrderDetail(orderId) {
    const store = window.tsportStore;
    if (!store) return;

    const order = (store.getOrders() || []).find((o) => Number(o.id) === Number(orderId));
    if (!order) {
      showListView();
      return;
    }

    currentOrderId = order.id;
    document.getElementById("admOrdersListView").style.display = "none";
    document.getElementById("admOrderDetailView").style.display = "block";

    const bc = document.getElementById("admOrdersBreadcrumb");
    if (bc) bc.textContent = `Đơn ${order.order_code}`;

    document.getElementById("admDetOrderCode").textContent = `Đơn ${order.order_code}`;
    document.getElementById("admDetOrderMeta").textContent = `Đặt ngày ${formatDMY(order.created_at)} • ${getPayLabel(order.payment_method)} • Vận chuyển 0đ`;

    // Thanh tiến trình 4 bước
    const stepper = document.getElementById("admDetOrderStepper");
    if (stepper) {
      if (order.status === "CANCELLED") {
        stepper.innerHTML = `<div class="ts-ord-det-cancelled-bar">Đơn hàng đã bị hủy${order.restocked ? " và đã hoàn tồn kho (1 lần)." : "."}</div>`;
      } else {
        const steps = [
          { key: "PENDING", label: "Chờ xử lý" },
          { key: "CONFIRMED", label: "Đã xác nhận" },
          { key: "SHIPPING", label: "Đang giao" },
          { key: "COMPLETED", label: "Hoàn tất" }
        ];
        const currIdx = Math.max(0, steps.findIndex((s) => s.key === order.status));
        stepper.innerHTML = steps
          .map((s, idx) => {
            const cls = idx < currIdx ? "is-done" : idx === currIdx ? "is-current" : "";
            return `
              <div class="ts-ord-det-step ${cls}">
                <span class="ts-ord-det-step-dot">${idx < currIdx ? "✓" : ""}</span>
                <span class="ts-ord-det-step-label">${s.label}</span>
              </div>
            `;
          })
          .join("");
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
          return `
            <tr>
              <td>
                <div class="ts-ord-det-prod-name">${escapeHtml(item.product_name)}</div>
                <div class="ts-ord-det-prod-var">${escapeHtml([item.size, item.color].filter(Boolean).join(" • "))}</div>
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

    document.getElementById("admDetReceiverLine").textContent = `${order.customer_name || ""} • ${order.phone || ""}`;
    document.getElementById("admDetReceiverAddr").textContent = order.address || "";
    document.getElementById("admDetGrandTotal").textContent = formatMoneyVN(order.total_amount);

    const st = getStatusMeta(order.status);
    const btnAdvance = document.getElementById("btnAdmAdvanceOrder");
    const btnCancel = document.getElementById("btnAdmCancelOrder");

    if (btnAdvance) {
      btnAdvance.textContent = st.nextLabel;
      btnAdvance.disabled = !st.next;
    }
    if (btnCancel) {
      btnCancel.disabled = order.status === "COMPLETED" || order.status === "CANCELLED";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindEvents() {
    document.getElementById("admOrderSearch")?.addEventListener("input", renderOrdersTable);
    document.getElementById("admOrderStatusFilter")?.addEventListener("change", renderOrdersTable);

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
      const store = window.tsportStore;
      if (!store) return;
      const pending = (store.getOrders() || []).find((o) => o.status === "PENDING");
      if (pending) {
        openOrderDetail(pending.id);
      } else {
        showToast("Hiện không có đơn hàng nào đang chờ xử lý.", "info");
      }
    });

    document.getElementById("btnBackToAdmOrders")?.addEventListener("click", showListView);

    document.getElementById("btnAdmAdvanceOrder")?.addEventListener("click", () => {
      const store = window.tsportStore;
      if (!store || !currentOrderId) return;
      const order = (store.getOrders() || []).find((o) => Number(o.id) === Number(currentOrderId));
      if (!order) return;

      const st = getStatusMeta(order.status);
      if (!st.next) return;

      try {
        if (typeof store.updateOrderStatus === "function") {
          store.updateOrderStatus(order.id, st.next);
        } else {
          order.status = st.next;
          store.save();
        }
        showToast(`Đã chuyển đơn ${order.order_code} sang ${st.next}!`, "success");
        openOrderDetail(order.id);
      } catch (err) {
        showToast(err.message || "Không thể cập nhật trạng thái đơn.", "error");
      }
    });

    document.getElementById("btnAdmCancelOrder")?.addEventListener("click", () => {
      const store = window.tsportStore;
      if (!store || !currentOrderId) return;
      if (!confirm("Xác nhận hủy đơn hàng này và hoàn lại tồn kho?")) return;

      try {
        store.cancelOrder(currentOrderId);
        showToast("Đã hủy đơn hàng và hoàn tồn kho thành công!", "info");
        openOrderDetail(currentOrderId);
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

  document.addEventListener("DOMContentLoaded", initAdminOrders);
})();
