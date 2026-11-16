// Trang Đặt sân dành cho Khách hàng: Gửi yêu cầu đặt sân, xem danh sách và huỷ đơn.

const bookingForm = document.getElementById("booking-form");
const bookingTableBody = document.getElementById("booking-table-body");
const searchInput = document.getElementById("search-input");
const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");

let editingId = null;

// 1. Tải danh sách đơn đặt sân từ Backend
async function loadBookings() {
    bookingTableBody.innerHTML = `<tr><td colspan="5" class="muted">Đang tải dữ liệu...</td></tr>`;
    try {
        const keyword = searchInput.value.trim();
        const bookings = await api.get("/bookings", keyword ? { q: keyword } : undefined);
        renderBookings(bookings);
    } catch (error) {
        bookingTableBody.innerHTML = `<tr><td colspan="5" class="text-error">Không thể tải dữ liệu: ${escapeHtml(error.message)}</td></tr>`;
    }
}

// 2. Render danh sách đơn đặt sân ra bảng HTML
function renderBookings(bookings) {
    if (!bookings || bookings.length === 0) {
        bookingTableBody.innerHTML = `<tr><td colspan="5" class="muted">Chưa có đơn đặt sân nào.</td></tr>`;
        return;
    }
    bookingTableBody.innerHTML = bookings.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>
                <strong>${escapeHtml(item.sport)}</strong>
                <div class="muted">${escapeHtml(item.court_name)}</div>
            </td>
            <td>
                <div>Ngày: ${escapeHtml(item.booking_date)}</div>
                <div class="muted">Ca: ${escapeHtml(item.time_slot)}</div>
            </td>
            <td class="text-right">
                <span class="badge badge-${item.status === 'Confirmed' ? 'success' : item.status === 'Cancelled' ? 'danger' : 'warning'}">
                    ${escapeHtml(item.status || 'Pending')}
                </span>
            </td>
            <td>
                <button class="btn btn-sm" data-action="cancel" data-id="${item.id}">Huỷ đơn</button>
            </td>
        </tr>
    `).join("");
}

// 3. Xử lý sự kiện Submit Form (Gửi yêu cầu đặt sân mới)
bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
        sport: bookingForm.sport.value.trim(),
        court_name: bookingForm.court_name.value.trim(),
        booking_date: bookingForm.booking_date.value,
        time_slot: bookingForm.time_slot.value.trim(),
    };

    btnSubmit.disabled = true;
    try {
        await api.post("/bookings", data);
        showToast("Gửi yêu cầu đặt sân thành công!", "success");
        bookingForm.reset();
        loadBookings();
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        btnSubmit.disabled = false;
    }
});

// 4. Xử lý nút Huỷ đơn đặt sân
async function cancelBooking(id) {
    if (!confirm(`Bạn có chắc chắn muốn huỷ đơn đặt sân #${id}?`)) return;
    try {
        await api.delete(`/bookings/${id}`);
        showToast("Đã huỷ đơn đặt sân thành công", "success");
        loadBookings();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// Lắng nghe sự kiện click trên bảng (Event Delegation cho nút Huỷ)
bookingTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === "cancel") {
        cancelBooking(id);
    }
});

// Tìm kiếm nhanh (debounce 300ms tránh gọi API liên tục)
let searchTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadBookings, 300);
});

// Tải dữ liệu lần đầu khi vào trang
loadBookings();