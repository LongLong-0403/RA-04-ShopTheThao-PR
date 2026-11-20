/**
 * TSPORT — MODULE TỔNG QUAN QUẢN TRỊ (ADMIN DASHBOARD V2 FIGMA)
 * - Nạp 4 chỉ số KPI live từ tsportStore (Đơn cần xử lý, Lịch sân chờ duyệt, Yêu cầu thu mua, SKU hết hàng)
 * - Tổng hợp bảng "Công việc cần xử lý" từ Đặt sân, Đơn hàng và Thu mua đồ cũ
 */

(function () {
  function pad2(n) {
    return String(Number(n) || 0).padStart(2, "0");
  }

  function formatShortDate(str) {
    if (!str) return "";
    const parts = String(str).split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return str;
  }

  function initAdminDashboard() {
    initTopbarControls();
    renderKpisAndTasks();
  }

  function initTopbarControls() {
    const user = JSON.parse(localStorage.getItem("tsport_current_user") || "null");
    const nameEl = document.getElementById("adminTopName");
    if (nameEl && user && user.role === "ADMIN" && user.full_name) {
      nameEl.textContent = "Admin";
    }

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

    const sidebar = document.getElementById("adminSidebar");
    document.getElementById("btnToggleAdminSidebar")?.addEventListener("click", () => {
      sidebar?.classList.toggle("is-open");
    });
  }

  function renderKpisAndTasks() {
    const store = window.tsportStore;
    if (!store) return;

    const orders = store.getOrders() || [];
    const bookings = store.getBookings() || [];
    const buybacks = store.getBuybacks() || [];
    const products = store.getProducts({ status: "ACTIVE" }) || [];

    const pendingOrders = orders.filter((o) => o.status === "PENDING");
    const pendingBookings = bookings.filter((b) => b.status === "PENDING");
    const pendingBuybacks = buybacks.filter((b) => b.status === "PENDING" || b.status === "CHO_DUYET");

    let outOfStockSkus = 0;
    products.forEach((p) => {
      (p.skus || []).forEach((s) => {
        if (Number(s.stock) <= 0) outOfStockSkus++;
      });
    });

    const elOrders = document.getElementById("kpiPendingOrders");
    const elBookings = document.getElementById("kpiPendingBookings");
    const elBuybacks = document.getElementById("kpiPendingBuybacks");
    const elSkus = document.getElementById("kpiOutOfStockSkus");

    if (elOrders) elOrders.textContent = pad2(pendingOrders.length);
    if (elBookings) elBookings.textContent = pad2(pendingBookings.length);
    if (elBuybacks) elBuybacks.textContent = pad2(pendingBuybacks.length);
    if (elSkus) elSkus.textContent = pad2(outOfStockSkus);

    // Tổng hợp danh sách "Công việc cần xử lý"
    const tasks = [];

    pendingBookings.slice(0, 3).forEach((b) => {
      tasks.push({
        type: "Đặt sân",
        customer: b.customer_name || "Khách hàng",
        content: `${b.court_name} • ${formatShortDate(b.booking_date)}`,
        statusLabel: "Chờ xác nhận",
        statusCls: "is-pending",
        href: "admin-courts.html"
      });
    });

    pendingOrders.slice(0, 3).forEach((o) => {
      tasks.push({
        type: "Đơn hàng",
        customer: o.customer_name || "Khách hàng",
        content: o.order_code,
        statusLabel: "Chờ xác nhận",
        statusCls: "is-pending",
        href: "admin-orders.html"
      });
    });

    pendingBuybacks.slice(0, 3).forEach((bb) => {
      tasks.push({
        type: "Thu mua",
        customer: bb.customer_name || "Khách hàng",
        content: bb.product_name,
        statusLabel: "Chờ thẩm định",
        statusCls: "",
        href: "admin-buyback.html"
      });
    });

    // Nếu chưa có công việc chờ nào, hiển thị các mục gần nhất
    if (tasks.length === 0) {
      if (bookings[0]) {
        tasks.push({
          type: "Đặt sân",
          customer: bookings[0].customer_name || "Nguyễn Minh Anh",
          content: `${bookings[0].court_name} • ${formatShortDate(bookings[0].booking_date)}`,
          statusLabel: "Chờ xác nhận",
          statusCls: "is-pending",
          href: "admin-courts.html"
        });
      }
      if (orders[0]) {
        tasks.push({
          type: "Đơn hàng",
          customer: orders[0].customer_name || "Trần Hoàng",
          content: orders[0].order_code,
          statusLabel: "Chờ xác nhận",
          statusCls: "is-pending",
          href: "admin-orders.html"
        });
      }
      if (buybacks[0]) {
        tasks.push({
          type: "Thu mua",
          customer: buybacks[0].customer_name || "Lê Linh",
          content: buybacks[0].product_name,
          statusLabel: "Chờ thẩm định",
          statusCls: "",
          href: "admin-buyback.html"
        });
      }
    }

    const tbody = document.getElementById("adminPendingTasksTbody");
    if (!tbody) return;

    tbody.innerHTML = tasks
      .map(
        (t) => `
        <tr onclick="window.location.href='${t.href}'">
          <td>${escapeHtml(t.type)}</td>
          <td>${escapeHtml(t.customer)}</td>
          <td>${escapeHtml(t.content)}</td>
          <td><span class="ts-orders-v2-status ${t.statusCls}">${escapeHtml(t.statusLabel)}</span></td>
        </tr>
      `
      )
      .join("");
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

  document.addEventListener("DOMContentLoaded", initAdminDashboard);
})();
