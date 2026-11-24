/**
 * TSPORT — MODULE ĐƠN HÀNG CỦA TÔI & CHI TIẾT ĐƠN HÀNG (ORDERS V2 FIGMA)
 * - View 1: Lịch sử mua hàng với 4 tab lọc (Tất cả / Chờ xác nhận / Đang giao / Hoàn tất)
 * - View 2: Chi tiết đơn hàng với thanh tiến trình 4 bước, bảng sản phẩm, thông tin người nhận & nút Hủy đơn
 * - Giữ nguyên quy tắc hoàn tồn kho 1 lần (idempotent) của store.cancelOrder()
 */

(function () {
  let activeStatusFilter = "ALL";
  let currentOrderId = null;

  function initOrdersModule() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    if (!user || !(localStorage.getItem("token") || localStorage.getItem("tsport_token"))) {
      window.location.replace("auth.html");
      return;
    }
    initSidebarUser(user);
    initHeaderSearch();
    bindEvents();

    const params = typeof getUrlParams === "function" ? getUrlParams() : {};
    if (params.code) {
      const store = window.tsportStore;
      const found = store && store.getOrders().find((o) => o.order_code === params.code);
      if (found) {
        openOrderDetail(found.id);
        return;
      }
      showToast("Không tìm thấy đơn hàng trong tài khoản này.", "error");
    }

    showOrdersListView();
  }

  function getInitials(name) {
    const parts = String(name || "TS").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function initSidebarUser(user) {
    const nameEl = document.getElementById("sbOrdersName");
    const roleEl = document.getElementById("sbOrdersRole");
    const avatarEl = document.getElementById("sbOrdersAvatar");
    if (nameEl) nameEl.textContent = user.full_name || user.email || "Khách hàng";
    if (roleEl) roleEl.textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    if (avatarEl) avatarEl.textContent = getInitials(user.full_name || user.email);

    document.getElementById("btnOrdersLogout")?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tsport_token");
      localStorage.removeItem("tsport_current_user");
      window.location.href = "auth.html";
    });
  }

  function initHeaderSearch() {
    const form = document.getElementById("ordersSearchForm");
    const input = document.getElementById("ordersSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `shop.html?q=${encodeURIComponent(q)}` : "shop.html";
    });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const datePart = String(dateStr).split(" ")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return datePart;
  }

  function formatOrderMoney(amount) {
    return (Number(amount) || 0).toLocaleString("vi-VN") + "đ";
  }

  function getPaymentLabel(method) {
    const map = {
      COD: "COD",
      BANK: "Chuyển khoản ngân hàng",
      EWALLET_MOMO: "Ví MoMo",
      EWALLET_ZALOPAY: "Ví ZaloPay",
      EWALLET_VNPAY: "Ví VNPay"
    };
    return map[method] || method || "COD";
  }

  function getStatusMeta(status) {
    const map = {
      PENDING: { label: "Chờ xác nhận", cls: "is-pending" },
      CONFIRMED: { label: "Đã xác nhận", cls: "" },
      SHIPPING: { label: "Đang giao", cls: "" },
      COMPLETED: { label: "Hoàn tất", cls: "" },
      CANCELLED: { label: "Đã hủy", cls: "is-cancelled" }
    };
    return map[status] || { label: status, cls: "" };
  }

  // 1. HIỂN THỊ DANH SÁCH ĐƠN HÀNG
  function showOrdersListView() {
    currentOrderId = null;
    const listView = document.getElementById("ordersListView");
    const detailView = document.getElementById("orderDetailView");
    if (listView) listView.style.display = "block";
    if (detailView) detailView.style.display = "none";
    document.title = "Đơn hàng của tôi | Tsport";
    renderOrdersTable();
  }

  function renderOrdersTable() {
    const tbody = document.getElementById("ordersTableBody");
    const store = window.tsportStore;
    if (!tbody || !store) return;

    let orders = store.getOrders() || [];
    if (activeStatusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === activeStatusFilter);
    }

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:42px 16px; color:#6B7280;">
            Chưa có đơn hàng nào ở trạng thái này.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const st = getStatusMeta(o.status);
        return `
          <tr>
            <td>
              <div class="ts-orders-v2-code">${escapeHtml(o.order_code)}</div>
              <div class="ts-orders-v2-date">${escapeHtml(formatDateShort(o.created_at))}</div>
            </td>
            <td class="ts-orders-v2-total">${formatOrderMoney(o.total_amount)}</td>
            <td>
              <span class="ts-orders-v2-status ${st.cls}">${escapeHtml(st.label)}</span>
            </td>
            <td>
              <button type="button" class="ts-orders-v2-detail-btn js-open-order-detail" data-order-id="${o.id}">
                Xem chi tiết →
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // 2. HIỂN THỊ CHI TIẾT ĐƠN HÀNG
  function openOrderDetail(orderId) {
    const store = window.tsportStore;
    if (!store) return;

    const order = store.getOrders().find((o) => Number(o.id) === Number(orderId));
    if (!order) {
      showOrdersListView();
      return;
    }

    currentOrderId = order.id;

    const listView = document.getElementById("ordersListView");
    const detailView = document.getElementById("orderDetailView");
    if (listView) listView.style.display = "none";
    if (detailView) detailView.style.display = "block";

    document.title = `Đơn ${order.order_code} | Tsport`;

    const bcCode = document.getElementById("detailBreadcrumbCode");
    const titleEl = document.getElementById("detailOrderTitle");
    const metaEl = document.getElementById("detailOrderMeta");
    if (bcCode) bcCode.textContent = `Đơn ${order.order_code}`;
    if (titleEl) titleEl.textContent = `Đơn ${order.order_code}`;
    if (metaEl) {
      metaEl.textContent = `Đặt ngày ${formatDateShort(order.created_at)} • ${getPaymentLabel(order.payment_method)} • Vận chuyển 0đ`;
    }

    // Thanh tiến trình 4 bước
    const stepper = document.getElementById("detailOrderStepper");
    if (stepper) {
      if (order.status === "CANCELLED") {
        stepper.innerHTML = `
          <div class="ts-ord-det-cancelled-bar">
            Đơn hàng này đã bị hủy${order.restocked ? " và đã hoàn lại số lượng tồn kho." : "."}
          </div>
        `;
      } else {
        const steps = [
          { key: "PENDING", label: "Chờ xác nhận" },
          { key: "CONFIRMED", label: "Đã xác nhận" },
          { key: "SHIPPING", label: "Đang giao" },
          { key: "COMPLETED", label: "Hoàn tất" }
        ];
        const currentStepIdx = Math.max(0, steps.findIndex((s) => s.key === order.status));
        stepper.innerHTML = steps
          .map((s, idx) => {
            const cls = idx < currentStepIdx ? "is-done" : idx === currentStepIdx ? "is-current" : "";
            return `
              <div class="ts-ord-det-step ${cls}">
                <span class="ts-ord-det-step-dot" aria-hidden="true">${idx < currentStepIdx ? "✓" : ""}</span>
                <span class="ts-ord-det-step-label">${s.label}</span>
              </div>
            `;
          })
          .join("");
      }
    }

    // Bảng sản phẩm trong đơn
    const itemsBody = document.getElementById("detailItemsBody");
    if (itemsBody) {
      const items = order.items || [];
      itemsBody.innerHTML = items
        .map((item) => {
          const condText = item.condition_type === "CU" ? "Đã qua sử dụng" : "Mới";
          const unitText = item.unit === "LO" ? "12 quả / ống" : "Chiếc";
          const varLine = [item.size, item.color, unitText].filter(Boolean).join(" • ");
          const unitPrice = Number(item.price_at_order || item.price || 0);
          const qty = Number(item.quantity || 1);
          return `
            <tr>
              <td>
                <div class="ts-ord-det-prod-name">${escapeHtml(item.product_name)}</div>
                <div class="ts-ord-det-prod-var">${escapeHtml(varLine)}</div>
              </td>
              <td>${condText}</td>
              <td>${qty}</td>
              <td>${formatOrderMoney(unitPrice)}</td>
              <td>${formatOrderMoney(unitPrice * qty)}</td>
            </tr>
          `;
        })
        .join("");
    }

    // Thông tin người nhận & tổng tiền
    const recvContact = document.getElementById("detailReceiverContact");
    const recvAddr = document.getElementById("detailReceiverAddress");
    const grandTotal = document.getElementById("detailGrandTotal");
    const cancelBtn = document.getElementById("btnCancelCurrentOrder");
    const cancelNote = document.getElementById("detailCancelNote");

    if (recvContact) recvContact.textContent = `${order.customer_name || "Khách hàng"} • ${order.phone || ""}`;
    if (recvAddr) recvAddr.textContent = order.address || "Chưa cập nhật địa chỉ";
    if (grandTotal) grandTotal.textContent = formatOrderMoney(order.total_amount);

    const canCancel = order.status === "PENDING";
    if (cancelBtn) {
      cancelBtn.disabled = !canCancel;
      cancelBtn.textContent = order.status === "CANCELLED" ? "Đơn hàng đã hủy" : "Hủy đơn hàng";
    }
    if (cancelNote) {
      cancelNote.textContent = canCancel
        ? "Có thể hủy khi đơn còn chờ xác nhận."
        : order.status === "CANCELLED"
        ? "Đơn hàng đã được hủy và hoàn tồn kho."
        : "Đơn hàng đã được xác nhận hoặc đang xử lý, không thể tự hủy.";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 3. GẮN SỰ KIỆN TƯƠNG TÁC
  function bindEvents() {
    // 4 tab lọc trạng thái
    document.getElementById("ordersStatusTabs")?.addEventListener("click", (e) => {
      const tab = e.target.closest(".ts-orders-v2-tab");
      if (!tab) return;
      activeStatusFilter = tab.dataset.status || "ALL";
      document.querySelectorAll(".ts-orders-v2-tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
      });
      renderOrdersTable();
    });

    // Nút "Xem đơn đang chờ"
    document.getElementById("btnViewPendingOrders")?.addEventListener("click", () => {
      activeStatusFilter = "PENDING";
      document.querySelectorAll(".ts-orders-v2-tab").forEach((t) => {
        t.classList.toggle("is-active", t.dataset.status === "PENDING");
      });
      renderOrdersTable();
    });

    // Bấm "Xem chi tiết →" trên từng dòng đơn hàng
    document.getElementById("ordersTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-open-order-detail");
      if (!btn) return;
      openOrderDetail(Number(btn.dataset.orderId));
    });

    // Quay lại danh sách đơn hàng từ breadcrumb
    document.getElementById("btnBackToOrdersList")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", "orders.html");
      }
      showOrdersListView();
    });

    // Hủy đơn hàng (chỉ khi PENDING, hoàn tồn kho 1 lần)
    document.getElementById("btnCancelCurrentOrder")?.addEventListener("click", async () => {
      if (!currentOrderId) return;
      const confirmed = await confirmAction("Bạn có chắc chắn muốn hủy đơn hàng này không?", "Hủy đơn hàng");
      if (!confirmed) return;

      try {
        window.tsportStore.cancelOrder(currentOrderId);
        showToast("Đã hủy đơn hàng và hoàn lại tồn kho thành công!", "success");
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

  document.addEventListener("DOMContentLoaded", () => initCustomerPage(initOrdersModule));
})();
