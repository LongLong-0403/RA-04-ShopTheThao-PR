/**
 * TSPORT — MODULE QUẢN LÝ ĐƠN HÀNG CỦA KHÁCH (ORDERS & IDEMPOTENT RESTOCKING)
 * Tính năng:
 * - Khách xem danh sách đơn hàng và chi tiết đơn của mình
 * - Hủy đơn khi còn ở trạng thái "Chờ xác nhận" (PENDING)
 * - Quy tắc HOÀN TỒN ĐÚNG MỘT LẦN: Khi hủy, hoàn lại số lượng tồn kho cho các SKU;
 *   nếu hủy lặp lại, hệ thống CHẶN TUYỆT ĐỐI và KHÔNG tăng tồn kho lần 2.
 */

(function () {
  let currentDetailOrder = null;

  function initOrdersModule() {
    renderOrdersList();
    bindEvents();
  }

  function renderOrdersList() {
    const listWrap = document.getElementById("ordersListWrap");
    if (!listWrap) return;

    const store = window.tsportStore;
    if (!store) return;

    const orders = store.getOrders();

    if (orders.length === 0) {
      listWrap.innerHTML = `
        <div class="tsport-card" style="text-align:center; padding:50px 20px;">
          <div style="font-size:48px; margin-bottom:12px;">📦</div>
          <h3 style="font-size:18px; font-weight:800; color:#1E293B;">Bạn chưa có đơn hàng nào</h3>
          <p style="font-size:13px; color:#64748B; margin-bottom:18px;">Hãy đặt mua các sản phẩm thể thao yêu thích ngay hôm nay!</p>
          <a href="shop.html" class="btn btn-primary">🛍️ Đến cửa hàng mua sắm</a>
        </div>
      `;
      return;
    }

    const statusMap = {
      PENDING: { label: "⏳ Chờ xác nhận", cls: "pending" },
      CONFIRMED: { label: "✓ Đã xác nhận", cls: "confirmed" },
      SHIPPING: { label: "🚚 Đang giao hàng", cls: "shipping" },
      COMPLETED: { label: "★ Đã hoàn thành", cls: "completed" },
      CANCELLED: { label: "✕ Đã hủy đơn", cls: "cancelled" }
    };

    listWrap.innerHTML = orders.map((o) => {
      const st = statusMap[o.status] || { label: o.status, cls: "pending" };
      const canCancel = o.status === "PENDING";

      return `
        <div class="tsport-order-card" data-order-id="${o.id}">
          <div class="tsport-order-header">
            <div>
              <span class="tsport-order-code">
                <span>📦</span>
                <span>Mã đơn: ${escapeHtml(o.order_code)}</span>
              </span>
              <div class="tsport-order-date">Thời gian đặt: ${escapeHtml(o.created_at)}</div>
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
              <span class="tsport-badge-order-status ${st.cls}">
                ${st.label}
              </span>
              ${o.restocked ? '<span class="tsport-restock-alert">✓ Đã hoàn tồn kho (1 lần)</span>' : ''}
            </div>
          </div>

          <div class="tsport-order-body">
            ${(o.items || []).map((item) => `
              <div class="tsport-order-item-row">
                <img src="${escapeHtml(item.image_url)}" class="tsport-order-item-thumb" alt="${escapeHtml(item.product_name)}" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
                <div class="tsport-order-item-details">
                  <div class="tsport-order-item-title">${escapeHtml(item.product_name)}</div>
                  <div class="tsport-order-item-sub">
                    Phân loại: Size ${escapeHtml(item.size)} • Màu ${escapeHtml(item.color)} | Số lượng: x${item.quantity}
                  </div>
                </div>
                <div class="tsport-order-item-price">${formatMoney(item.price * item.quantity)}</div>
              </div>
            `).join("")}
          </div>

          <div class="tsport-order-footer">
            <div class="tsport-order-total">
              Tổng tiền thanh toán: <strong>${formatMoney(o.total_amount)}</strong>
              <span style="font-size:12px; color:#64748B; margin-left:8px;">(${o.payment_method})</span>
            </div>

            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm js-view-order-detail" data-id="${o.id}">
                👁️ Xem chi tiết
              </button>

              ${canCancel ? `
                <button type="button" class="btn btn-danger btn-sm js-cancel-order" data-id="${o.id}" title="Hủy đơn hàng và hoàn lại tồn kho">
                  🚫 Hủy đơn hàng
                </button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm" disabled style="opacity:0.5; cursor:not-allowed;" title="Chỉ có thể hủy khi đơn ở trạng thái Chờ xác nhận">
                  ${o.status === 'CANCELLED' ? 'Đã hủy đơn' : 'Không thể hủy'}
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Mở modal xem chi tiết đơn hàng
  function openOrderDetailModal(orderId) {
    const store = window.tsportStore;
    if (!store) return;

    currentDetailOrder = store.getOrderById(orderId);
    if (!currentDetailOrder) return;

    const o = currentDetailOrder;
    const modal = document.getElementById("modalOrderDetail");
    if (!modal) return;

    document.getElementById("detailModalOrderCode").textContent = o.order_code;
    document.getElementById("detailModalStatus").textContent = o.status;
    document.getElementById("detailModalDate").textContent = o.created_at;
    document.getElementById("detailModalCustomer").textContent = o.customer_name;
    document.getElementById("detailModalPhone").textContent = o.phone;
    document.getElementById("detailModalAddress").textContent = o.address;
    document.getElementById("detailModalNote").textContent = o.note || "Không có ghi chú";
    document.getElementById("detailModalTotal").textContent = formatMoney(o.total_amount);

    const itemsWrap = document.getElementById("detailModalItemsTbody");
    if (itemsWrap) {
      itemsWrap.innerHTML = (o.items || []).map((i) => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${escapeHtml(i.image_url)}" style="width:36px; height:36px; border-radius:4px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300'" />
              <div>
                <strong>${escapeHtml(i.product_name)}</strong>
                <div style="font-size:11px; color:#64748B;">${i.size} - ${i.color}</div>
              </div>
            </div>
          </td>
          <td>${formatMoney(i.price)}</td>
          <td>${i.quantity}</td>
          <td style="font-weight:700; color:#D94C26;">${formatMoney(i.price * i.quantity)}</td>
        </tr>
      `).join("");
    }

    openModal("modalOrderDetail");
  }

  // Hủy đơn hàng và kiểm tra hoàn tồn đúng 1 lần
  function handleCancelOrder(orderId) {
    const store = window.tsportStore;
    if (!store) return;

    const order = store.getOrderById(orderId);
    if (!order) return;

    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.order_code} không?\n\nTheo quy tắc: Hệ thống sẽ tự động hoàn lại số lượng tồn kho cho các sản phẩm trong đơn đúng 1 lần duy nhất.`)) {
      return;
    }

    try {
      // Gọi hàm cancelOrder trong store (đã tích hợp kiểm tra idempotency và hoàn tồn)
      store.cancelOrder(orderId);
      renderOrdersList();
      showToast(`Hủy đơn hàng #${order.order_code} thành công! Số lượng sản phẩm đã được hoàn lại vào kho.`, "success");
    } catch (err) {
      alert("⚠️ Lỗi: " + err.message);
    }
  }

  function bindEvents() {
    document.addEventListener("click", (e) => {
      // Xem chi tiết
      const viewBtn = e.target.closest(".js-view-order-detail");
      if (viewBtn) {
        openOrderDetailModal(viewBtn.dataset.id);
      }

      // Hủy đơn hàng
      const cancelBtn = e.target.closest(".js-cancel-order");
      if (cancelBtn) {
        handleCancelOrder(cancelBtn.dataset.id);
      }
    });

    // Nút test nhanh: Tạo đơn mới ở trạng thái Chờ xác nhận để kiểm tra hủy và hoàn tồn
    document.getElementById("btnTestSeedOrder")?.addEventListener("click", () => {
      const store = window.tsportStore;
      const testOrder = store.createOrder({
        customer_name: "Nguyễn Văn An (Test)",
        phone: "0912345601",
        address: "Số 15 Xuân Thủy, Cầu Giấy, Hà Nội",
        payment_method: "COD",
        note: "Đơn hàng test tính năng Hủy & Hoàn tồn kho",
        items: [
          {
            product_id: 1,
            sku_id: 1,
            product_name: "Vợt cầu lông Yonex Astrox 88D Pro 2024",
            sku_code: "AX88DP-4U-BK",
            size: "4U",
            color: "Đen Đỏ",
            unit: "CHIEC",
            image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300",
            price: 4250000,
            quantity: 1
          }
        ]
      });

      renderOrdersList();
      showToast(`Đã tạo đơn test #${testOrder.order_code}! Bây giờ bạn có thể thử bấm "Hủy đơn hàng" để kiểm tra tính năng hoàn tồn.`, "info");
    });
  }

  document.addEventListener("DOMContentLoaded", initOrdersModule);
})();
