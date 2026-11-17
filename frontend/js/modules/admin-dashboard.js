/**
 * TSPORT — MODULE DASHBOARD & THỐNG KÊ (CHART.JS)
 * Tính năng:
 * - Thống kê KPI: Doanh thu tổng, Đơn hàng theo trạng thái, Số booking sân
 * - Bộ lọc khoảng thời gian: Hôm nay, 7 ngày qua, 30 ngày qua
 * - 3 Biểu đồ Chart.js trực quan:
 *   1. Doanh thu theo ngày (Bar / Line)
 *   2. Số booking sân theo ngày (Line)
 *   3. Phân bổ trạng thái đơn hàng (Doughnut)
 * - Bảng Top sản phẩm bán chạy nhất
 */

(function () {
  let revenueChart = null;
  let bookingChart = null;
  let statusChart = null;

  function initDashboard() {
    renderDashboard("7days");
    bindDashboardEvents();
  }

  function renderDashboard(period = "7days") {
    const store = window.tsportStore;
    if (!store) return;

    const data = store.getAnalytics(period);

    // 1. Cập nhật các thẻ KPI
    const totalRevEl = document.getElementById("kpiTotalRevenue");
    const totalOrdersEl = document.getElementById("kpiTotalOrders");
    const totalBookingsEl = document.getElementById("kpiTotalBookings");
    const completedOrdersEl = document.getElementById("kpiCompletedOrders");

    if (totalRevEl) totalRevEl.textContent = formatMoney(data.totalRevenue);
    if (totalOrdersEl) totalOrdersEl.textContent = `${data.totalOrders} đơn`;
    if (totalBookingsEl) totalBookingsEl.textContent = `${data.totalBookings} lượt`;
    if (completedOrdersEl) completedOrdersEl.textContent = `${data.ordersByStatus.COMPLETED} đơn`;

    // Cập nhật breakdown trạng thái
    const statusPendingEl = document.getElementById("countPending");
    const statusConfirmedEl = document.getElementById("countConfirmed");
    const statusShippingEl = document.getElementById("countShipping");
    const statusCompletedEl = document.getElementById("countCompleted");
    const statusCancelledEl = document.getElementById("countCancelled");

    if (statusPendingEl) statusPendingEl.textContent = data.ordersByStatus.PENDING;
    if (statusConfirmedEl) statusConfirmedEl.textContent = data.ordersByStatus.CONFIRMED;
    if (statusShippingEl) statusShippingEl.textContent = data.ordersByStatus.SHIPPING;
    if (statusCompletedEl) statusCompletedEl.textContent = data.ordersByStatus.COMPLETED;
    if (statusCancelledEl) statusCancelledEl.textContent = data.ordersByStatus.CANCELLED;

    // 2. Render Biểu đồ Chart.js
    renderCharts(data);

    // 3. Render Top sản phẩm bán chạy
    renderTopProducts(data.topProducts);
  }

  function renderCharts(data) {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js chưa được nạp CDN!");
      return;
    }

    // A. BIỂU ĐỒ DOANH THU THEO NGÀY
    const revCtx = document.getElementById("chartRevenue")?.getContext("2d");
    if (revCtx) {
      if (revenueChart) revenueChart.destroy();
      revenueChart = new Chart(revCtx, {
        type: "bar",
        data: {
          labels: data.dateLabels,
          datasets: [{
            label: "Doanh thu (VNĐ)",
            data: data.revenueData,
            backgroundColor: "rgba(217, 76, 38, 0.75)",
            borderColor: "#D94C26",
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `Doanh thu: ${formatMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => val >= 1000000 ? (val / 1000000) + " tr" : val
              }
            }
          }
        }
      });
    }

    // B. BIỂU ĐỒ SỐ BOOKING SÂN THEO NGÀY
    const bookCtx = document.getElementById("chartBookings")?.getContext("2d");
    if (bookCtx) {
      if (bookingChart) bookingChart.destroy();
      bookingChart = new Chart(bookCtx, {
        type: "line",
        data: {
          labels: data.dateLabels,
          datasets: [{
            label: "Số lượt đặt sân",
            data: data.bookingData,
            borderColor: "#2563EB",
            backgroundColor: "rgba(37, 99, 235, 0.15)",
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#2563EB",
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }

    // C. BIỂU ĐỒ TRẠNG THÁI ĐƠN HÀNG (DOUGHNUT)
    const stCtx = document.getElementById("chartOrderStatus")?.getContext("2d");
    if (stCtx) {
      if (statusChart) statusChart.destroy();
      statusChart = new Chart(stCtx, {
        type: "doughnut",
        data: {
          labels: ["Chờ duyệt", "Đã xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"],
          datasets: [{
            data: [
              data.ordersByStatus.PENDING,
              data.ordersByStatus.CONFIRMED,
              data.ordersByStatus.SHIPPING,
              data.ordersByStatus.COMPLETED,
              data.ordersByStatus.CANCELLED
            ],
            backgroundColor: ["#F59E0B", "#3B82F6", "#6366F1", "#10B981", "#EF4444"],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }
  }

  function renderTopProducts(products) {
    const tbody = document.getElementById("topProductsTbody");
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94A3B8;">Chưa có dữ liệu bán hàng.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map((p, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${escapeHtml(p.image_url)}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
            <div>
              <strong style="color:#0F172A; font-size:13px;">${escapeHtml(p.name)}</strong>
              <div style="font-size:11px; color:#64748B;">SKU: <code>${escapeHtml(p.sku_code)}</code></div>
            </div>
          </div>
        </td>
        <td style="font-weight:700; color:#2563EB;">${p.quantity_sold} món</td>
        <td style="font-weight:800; color:#D94C26;">${formatMoney(p.total_revenue)}</td>
        <td>
          <a href="product-detail.html?id=${p.product_id}" class="btn btn-secondary btn-sm" target="_blank">Xem SP</a>
        </td>
      </tr>
    `).join("");
  }

  function bindDashboardEvents() {
    // Chọn khoảng thời gian
    document.getElementById("analyticsPeriodSelect")?.addEventListener("change", (e) => {
      renderDashboard(e.target.value);
      showToast(`Đã cập nhật dữ liệu thống kê: ${e.target.options[e.target.selectedIndex].text}`, "info");
    });
  }

  document.addEventListener("DOMContentLoaded", initDashboard);
})();
