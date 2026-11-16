// Trang Quản trị Đặt sân dành cho Admin (Khớp thiết kế A07 & A08)

const adminBookingTableBody = document.getElementById("admin-booking-table-body");
const adminSearch = document.getElementById("admin-search");
const courtForm = document.getElementById("court-form");

// 1. Tải danh sách yêu cầu đặt sân để Admin duyệt
async function loadAdminBookings() {
    adminBookingTableBody.innerHTML = `<tr><td colspan="5" class="muted">Đang tải dữ liệu...</td></tr>`;
    try {
        const keyword = adminSearch.value.trim();
        const bookings = await api.get("/admin/bookings", keyword ? { q: keyword } : undefined);
        renderAdminBookings(bookings);
    } catch (error) {
        adminBookingTableBody.innerHTML = `<tr><td colspan="5" class="text-error">Không thể tải dữ liệu: ${escapeHtml(error.message)}</td></tr>`;
    }
}

// 2. Render danh sách đơn lên bảng quản trị
function renderAdminBookings(bookings) {
    if (!bookings || bookings.length === 0) {
        adminBookingTableBody.innerHTML = `<tr><td colspan="5" class="muted">Không có yêu cầu đặt sân nào.</td></tr>`;
        return;
    }
    adminBookingTableBody.innerHTML = bookings.map(item => `
        <tr>
            <td>
                <strong>${escapeHtml(item.customer_name || 'Khách hàng')}</strong>
                <div class="muted">${escapeHtml(item.phone || '')}</div>
            </td>
            <td>
                <div>${escapeHtml(item.court_name)}</div>
                <div class="muted">Ngày: ${escapeHtml(item.booking_date)}</div>
            </td>
            <td>
                <div>Ca: ${escapeHtml(item.time_slot)}</div>
                <div class="muted">Giá: ${formatMoney(item.price || 0)}</div>
            </td>
            <td class="text-right">
                <span class="badge badge-${item.status === 'Confirmed' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}">
                    ${escapeHtml(item.status || 'Pending')}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" data-action="approve" data-id="${item.id}">Xác nhận</button>
                <button class="btn btn-sm" data-action="reject" data-id="${item.id}">Từ chối</button>
            </td>
        </tr>
    `).join("");
}

// 3. Xử lý Thêm sân & ca giá cố định (A07)
courtForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = {
        court_name: courtForm.court_name.value.trim(),
        time_slot: courtForm.time_slot.value.trim(),
        price: Number(courtForm.price.value)
    };

    try {
        await api.post("/admin/courts", data);
        showToast("Thêm ca giá sân thành công!", "success");
        courtForm.reset();
    } catch (error) {
        showToast(error.message, "error");
    }
});

// 4. Xử lý Duyệt / Từ chối đơn đặt sân
async function updateBookingStatus(id, status) {
    try {
        await api.put(`/admin/bookings/${id}/status`, { status });
        showToast(`Đã cập nhật trạng thái đơn #${id}`, "success");
        loadAdminBookings();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// Lắng nghe sự kiện click nút Duyệt / Từ chối
adminBookingTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "approve") {
        updateBookingStatus(id, "Confirmed");
    } else if (action === "reject") {
        updateBookingStatus(id, "Rejected");
    }
});

// Tìm kiếm đơn đặt sân
let adminSearchTimer;
adminSearch.addEventListener("input", () => {
    clearTimeout(adminSearchTimer);
    adminSearchTimer = setTimeout(loadAdminBookings, 300);
});

// Tải dữ liệu lần đầu
loadAdminBookings();