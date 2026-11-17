/**
 * TSPORT — MODULE QUẢN LÝ ĐƠN HÀNG ADMIN (CHUYỂN TRẠNG THÁI & IN ĐƠN HÀNG)
 * Tính năng:
 * - Bảng đơn hàng có bộ lọc trạng thái và tìm kiếm
 * - Nút chuyển trạng thái theo luồng: PENDING -> CONFIRMED -> SHIPPING -> COMPLETED
 * - Hủy đơn an toàn (hoàn tồn đúng 1 lần)
 * - In hóa đơn / phiếu xuất kho bằng window.print()
 */

(function () {
  let activeFilter = "ALL";

  function initAdminOrders() {
    renderAdminOrdersTable();
    bindEvents();
  }

  function renderAdminOrdersTable() {
    const tbody = document.getElementById("adminOrdersTbody");
    if (!tbody) return;

    const store = window.tsportStore;
    if (!store) return;

    const searchQ = (document.getElementById("adminOrderSearch")?.value || "").toLowerCase().trim();
    let orders = store.getOrders();

    if (activeFilter !== "ALL") {
      orders = orders.filter(o => o.status === activeFilter);
    }

    if (searchQ) {
      orders = orders.filter(o =>
        o.order_code.toLowerCase().includes(searchQ) ||
        o.customer_name.toLowerCase().includes(searchQ) ||
        o.phone.includes(searchQ)
      );
    }

    const countBadge = document.getElementById("adminOrdersCountBadge");
    if (countBadge) countBadge.textContent = `${orders.length} đơn hàng`;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94A3B8;">Không tìm thấy đơn hàng nào khớp với bộ lọc.</td></tr>';
      return;
    }

    const statusBadgeMap = {
      PENDING: '<span class="tsport-badge-order-status pending">⏳ Chờ xác nhận</span>',
      CONFIRMED: '<span class="tsport-badge-order-status confirmed">✓ Đã xác nhận</span>',
      SHIPPING: '<span class="tsport-badge-order-status shipping">🚚 Đang giao hàng</span>',
      COMPLETED: '<span class="tsport-badge-order-status completed">★ Đã hoàn thành</span>',
      CANCELLED: '<span class="tsport-badge-order-status cancelled">✕ Đã hủy đơn</span>'
    };

    tbody.innerHTML = orders.map((o) => `
      <tr>
        <td>
          <strong>${escapeHtml(o.order_code)}</strong>
          <div style="font-size:11px; color:#64748B;">${escapeHtml(o.created_at)}</div>
        </td>
        <td>
          <strong>${escapeHtml(o.customer_name)}</strong>
          <div style="font-size:11px; color:#64748B;">SĐT: ${escapeHtml(o.phone)}</div>
          <div style="font-size:11px; color:#94A3B8; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(o.address)}
          </div>
        </td>
        <td>
          <div>${(o.items || []).length} sản phẩm</div>
          <div style="font-size:11px; color:#64748B;">${o.payment_method}</div>
        </td>
        <td style="font-weight:900; color:#D94C26;">${formatMoney(o.total_amount)}</td>
        <td>
          ${statusBadgeMap[o.status] || o.status}
          ${o.restocked ? '<div style="font-size:10px; color:#16A34A; margin-top:2px;">(Đã hoàn tồn kho)</div>' : ''}
        </td>
        <td>
          <!-- NÚT CHUYỂN TRẠNG THÁI THEO LUỒNG -->
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${o.status === 'PENDING' ? `
              <button type="button" class="btn btn-primary btn-sm js-order-change-status" data-id="${o.id}" data-status="CONFIRMED">
                ✓ Xác nhận đơn
              </button>
              <button type="button" class="btn btn-danger btn-sm js-order-cancel" data-id="${o.id}">
                ✕ Hủy đơn
              </button>
            ` : o.status === 'CONFIRMED' ? `
              <button type="button" class="btn btn-primary btn-sm js-order-change-status" data-id="${o.id}" data-status="SHIPPING">
                🚚 Giao cho vận chuyển
              </button>
              <button type="button" class="btn btn-danger btn-sm js-order-cancel" data-id="${o.id}">
                ✕ Hủy đơn
              </button>
            ` : o.status === 'SHIPPING' ? `
              <button type="button" class="btn btn-primary btn-sm js-order-change-status" data-id="${o.id}" data-status="COMPLETED" style="background:#10B981; border-color:#10B981;">
                ★ Hoàn tất giao hàng
              </button>
            ` : `
              <span style="font-size:11px; color:#94A3B8;">Không còn thao tác</span>
            `}
          </div>
        </td>
        <td style="text-align:center;">
          <div style="display:flex; gap:4px; justify-content:center;">
            <button type="button" class="btn btn-secondary btn-sm js-preview-invoice" data-id="${o.id}" title="Xem và in hóa đơn">
              🖨️ In đơn
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function printOrderInvoice(orderId) {
    const store = window.tsportStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    // Đổ dữ liệu vào khung in hóa đơn
    const invEl = document.getElementById("invoicePrintArea");
    if (!invEl) return;

    invEl.innerHTML = `
      <div style="padding:20px; font-family:sans-serif; color:#0F172A; max-width:700px; margin:0 auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #D94C26; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h1 style="font-size:24px; font-weight:900; color:#D94C26; margin:0;">TSPORT STORE</h1>
            <div style="font-size:12px; color:#64748B;">Hệ thống đồ thể thao chính hãng & Dịch vụ thể thao</div>
          </div>
          <div style="text-align:right;">
            <h2 style="font-size:16px; margin:0; font-weight:800;">HÓA ĐƠN BÁN HÀNG</h2>
            <div style="font-size:12px; font-weight:700;">Mã đơn: ${escapeHtml(order.order_code)}</div>
            <div style="font-size:11px; color:#64748B;">Ngày in: ${new Date().toLocaleString("vi-VN")}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; font-size:13px;">
          <div style="background:#F8FAFC; padding:12px; border-radius:6px; border:1px solid #E2E8F0;">
            <strong style="color:#D94C26;">THÔNG TIN NGƯỜI NHẬN:</strong>
            <div style="margin-top:4px;"><strong>Họ tên:</strong> ${escapeHtml(order.customer_name)}</div>
            <div><strong>Điện thoại:</strong> ${escapeHtml(order.phone)}</div>
            <div><strong>Địa chỉ:</strong> ${escapeHtml(order.address)}</div>
          </div>
          <div style="background:#F8FAFC; padding:12px; border-radius:6px; border:1px solid #E2E8F0;">
            <strong style="color:#D94C26;">THÔNG TIN ĐƠN HÀNG:</strong>
            <div style="margin-top:4px;"><strong>Ngày đặt:</strong> ${escapeHtml(order.created_at)}</div>
            <div><strong>Phương thức:</strong> ${escapeHtml(order.payment_method)}</div>
            <div><strong>Trạng thái:</strong> ${escapeHtml(order.status)}</div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:18px;">
          <thead>
            <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1;">
              <th style="padding:8px; text-align:left;">STT</th>
              <th style="padding:8px; text-align:left;">Sản phẩm &amp; SKU</th>
              <th style="padding:8px; text-align:center;">Phân loại</th>
              <th style="padding:8px; text-align:right;">Đơn giá</th>
              <th style="padding:8px; text-align:center;">SL</th>
              <th style="padding:8px; text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item, idx) => `
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:8px;">${idx + 1}</td>
                <td style="padding:8px;">
                  <strong>${escapeHtml(item.product_name)}</strong>
                  ${item.condition_type === 'CU' ? '<span class="badge" style="background:#FEF3C7; color:#92400E; font-size:10px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:4px;">CŨ (Lúc đặt)</span>' : '<span class="badge" style="background:#DEF7EC; color:#03543F; font-size:10px; font-weight:700; padding:2px 5px; border-radius:4px; margin-left:4px;">MỚI (Lúc đặt)</span>'}
                  <div style="font-size:11px; color:#64748B;">Mã: ${escapeHtml(item.sku_code)}</div>
                </td>
                <td style="padding:8px; text-align:center;">${escapeHtml(item.size)} / ${escapeHtml(item.color)}</td>
                <td style="padding:8px; text-align:right;">${formatMoney(item.price)}</td>
                <td style="padding:8px; text-align:center;">${item.quantity}</td>
                <td style="padding:8px; text-align:right; font-weight:700;">${formatMoney(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="text-align:right; margin-top:16px; font-size:14px;">
          <div>Phí vận chuyển: <strong>0 ₫ (Miễn phí)</strong></div>
          <div style="font-size:18px; font-weight:900; color:#D94C26; margin-top:4px;">
            Tổng tiền thanh toán: ${formatMoney(order.total_amount)}
          </div>
        </div>

        <div style="margin-top:36px; display:flex; justify-content:space-between; text-align:center; font-size:12px;">
          <div>
            <strong>Người nhận hàng</strong><br/>
            <span style="font-size:10px; color:#94A3B8;">(Ký và ghi rõ họ tên)</span>
          </div>
          <div>
            <strong>Người lập phiếu</strong><br/>
            <span style="font-size:10px; color:#94A3B8;">(Ký và ghi rõ họ tên)</span>
          </div>
        </div>
      </div>
    `;

    // Gọi lệnh in trình duyệt window.print()
    setTimeout(() => {
      window.print();
    }, 200);
  }

  function bindEvents() {
    // Lọc theo tabs trạng thái
    document.querySelectorAll(".js-filter-order-status").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".js-filter-order-status").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeFilter = btn.dataset.status;
        renderAdminOrdersTable();
      });
    });

    // Tìm kiếm ô input
    document.getElementById("adminOrderSearch")?.addEventListener("input", renderAdminOrdersTable);

    // Xử lý chuyển trạng thái & In đơn
    document.addEventListener("click", (e) => {
      const store = window.tsportStore;
      if (!store) return;

      // Nút chuyển trạng thái
      const changeBtn = e.target.closest(".js-order-change-status");
      if (changeBtn) {
        const orderId = Number(changeBtn.dataset.id);
        const nextStatus = changeBtn.dataset.status;
        try {
          store.updateOrderStatus(orderId, nextStatus);
          renderAdminOrdersTable();
          showToast(`Đã chuyển đơn hàng #${orderId} sang trạng thái "${nextStatus}"!`, "success");
        } catch (err) {
          alert("⚠️ " + err.message);
        }
      }

      // Nút Hủy đơn Admin
      const cancelBtn = e.target.closest(".js-order-cancel");
      if (cancelBtn) {
        const orderId = Number(cancelBtn.dataset.id);
        const reason = prompt("Nhập lý do hủy đơn hàng:", "Khách yêu cầu hủy hoặc hết hàng");
        if (reason !== null) {
          try {
            store.updateOrderStatus(orderId, "CANCELLED", reason);
            renderAdminOrdersTable();
            showToast(`Đã hủy đơn hàng #${orderId} và tự động hoàn tồn kho 1 lần duy nhất!`, "info");
          } catch (err) {
            alert("⚠️ " + err.message);
          }
        }
      }

      // Nút In hóa đơn
      const printBtn = e.target.closest(".js-preview-invoice");
      if (printBtn) {
        printOrderInvoice(Number(printBtn.dataset.id));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initAdminOrders);
})();
