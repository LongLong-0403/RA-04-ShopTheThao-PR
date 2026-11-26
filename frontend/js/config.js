// Cấu hình chung của frontend.
// Đổi API_BASE_URL nếu backend chạy ở địa chỉ/cổng khác (hoặc khi deploy).
const CONFIG = {
  API_BASE_URL: window.location.protocol === "http:" || window.location.protocol === "https:"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : "http://127.0.0.1:8000/api",
  APP_NAME: "Tsport",
};
