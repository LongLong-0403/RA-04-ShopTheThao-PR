// Module gọi API bằng axios: cấu hình 1 lần, mọi trang dùng chung.
// (axios được nạp từ CDN bằng thẻ <script> trong từng trang HTML, trước file này)
//
// Cách dùng (trong các file js/pages/*.js):
//   const items = await api.get("/items");
//   const items = await api.get("/items", { q: "com" });          // -> /items?q=com
//   const created = await api.post("/items", { name: "Trà đá", price: 5000 });
//   await api.put("/items/1", { name: "Tên mới" });
//   await api.delete("/items/1");
//
// Các hàm trả về thẳng dữ liệu JSON (đã lấy sẵn response.data).
// Nếu lỗi, hàm sẽ throw ApiError -> bắt bằng try/catch và hiện error.message cho người dùng.

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status; // mã HTTP: 404, 422, 500... (0 = không gọi được server)
    this.data = data; // nội dung lỗi gốc server trả về
  }
}

// Instance axios dùng chung: mọi request tự nối thêm baseURL phía trước
const TSPORT_API_BASE =
  typeof CONFIG !== "undefined" && CONFIG && CONFIG.API_BASE_URL
    ? CONFIG.API_BASE_URL
    : "http://127.0.0.1:8000/api";
window.TSPORT_API_BASE = TSPORT_API_BASE;

function getSessionToken() {
  return localStorage.getItem("token") || localStorage.getItem("tsport_token");
}

function clearLocalSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("tsport_token");
  localStorage.removeItem("tsport_current_user");
}

const http = axios.create({
  baseURL: TSPORT_API_BASE,
  timeout: 10000, // quá 10 giây không phản hồi thì báo lỗi
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn Token đăng nhập cho mọi request khi đã đăng nhập (JWT Bearer Token):
http.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy câu thông báo lỗi dễ đọc từ response của FastAPI
function getErrorMessage(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  // Lỗi 422 (dữ liệu không hợp lệ): detail là mảng [{ loc: [...], msg: "..." }]
  if (data && Array.isArray(data.detail)) {
    return data.detail.map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join("; ");
  }
  return `Lỗi ${status}`;
}

// Gom xử lý lỗi một chỗ: đổi lỗi của axios thành ApiError dễ dùng
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server có trả lời nhưng là lỗi (4xx, 5xx)
      const { status, data } = error.response;
      return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
    }
    // Không có response: server tắt, sai URL, bị chặn CORS, hoặc quá thời gian chờ
    return Promise.reject(new ApiError(
      "Không kết nối được backend. Backend đã chạy chưa? Kiểm tra CONFIG.API_BASE_URL.", 0,
    ));
  },
);

const api = {
  get: (path, params) => http.get(path, { params }).then((res) => res.data),
  post: (path, body) => http.post(path, body).then((res) => res.data),
  put: (path, body) => http.put(path, body).then((res) => res.data),
  patch: (path, body) => http.patch(path, body).then((res) => res.data),
  delete: (path) => http.delete(path).then((res) => res.data),
};
window.api = api;

async function logoutAdmin() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    if (error.status !== 401) {
      showToast(error.message, "error");
      return;
    }
  }
  clearLocalSession();
  location.replace("auth.html");
}

if (typeof CONFIG !== "undefined" && CONFIG.DEMO_MODE) {
  document.addEventListener("DOMContentLoaded", () => {
    const notice = document.createElement("p");
    notice.className = "tsport-demo-notice";
    notice.textContent = "Bản demo Tsport · Dùng thông tin giả lập khi đăng ký, đặt hàng hoặc gửi yêu cầu.";
    document.body.prepend(notice);
    document.getElementById("authNoticeBox")?.remove();
  });
}

async function verifyCartCustomer() {
  const token = getSessionToken();
  const signInRequired = () => new ApiError("Hãy đăng nhập để thêm sản phẩm vào giỏ hàng.", 401);
  if (!token) throw signInRequired();
  let user;
  try {
    user = await api.get("/auth/me");
  } catch (error) {
    if (error.status !== 401) throw error;
    if (token === getSessionToken()) clearLocalSession();
    throw signInRequired();
  }
  if (token !== getSessionToken()) throw signInRequired();
  if (user.role !== "CUSTOMER") throw new ApiError("Hãy dùng tài khoản khách hàng để thêm sản phẩm vào giỏ hàng.", 403);
  return user;
}

function handleAddToCartError(error, productId) {
  if (error.status === 401) {
    const root = document.body.dataset.root ?? "../";
    location.href = `${root}pages/auth.html?product=${encodeURIComponent(productId)}`;
    return;
  }
  showToast(error.message || "Không thể thêm vào giỏ hàng.", "error");
}

function watchHeaderSession(render) {
  let revision = 0;

  async function refresh() {
    const currentRevision = ++revision;
    const token = getSessionToken();
    render(null);
    if (!token) {
      clearLocalSession();
      return;
    }

    try {
      const user = await api.get("/auth/me");
      if (currentRevision === revision && token === getSessionToken()) render(user);
    } catch (error) {
      if (error.status === 401 && currentRevision === revision && token === getSessionToken()) {
        clearLocalSession();
      }
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === "token" || event.key === "tsport_token") refresh();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refresh();
  });
  refresh();
}

async function initRolePage(init, role) {
  try {
    const user = await api.get("/auth/me");
    if (user.role !== role) { location.replace(user.role === "ADMIN" ? "admin-dashboard.html" : "account.html"); return; }
    document.body.hidden = false;
    await init(user);
  } catch (error) {
    if (error.status === 401) location.replace("auth.html");
    else { document.body.textContent = error.message; document.body.hidden = false; }
  }
}

function initAdminPage(init) { return initRolePage(init, "ADMIN"); }
function initCustomerPage(init) { return initRolePage(init, "CUSTOMER"); }

function matchView(row) {
  const [date,time] = row.match_time.split("T");
  return {...row, title: row.location, match_date: date, match_time: time.slice(0,5),
    level: row.skill_level, contact_phone: row.contact_info};
}

function matchAvailability(match) {
  const labels = { CANCELLED: "Đã hủy", FULL: "Đã đủ người", CLOSED: "Đã đóng", EXPIRED: "Đã qua giờ" };
  return labels[match.registration_status] || `Thiếu ${match.players_needed} người`;
}

window.addEventListener("load", async () => {
  const links = document.querySelectorAll("[data-admin-link]");
  if (!links.length || !(localStorage.getItem("token") || localStorage.getItem("tsport_token"))) return;
  try {
    const user = await api.get("/auth/me");
    for (const link of links) link.hidden = user.role !== "ADMIN";
  } catch { /* Giữ ẩn liên kết khi chưa xác minh được phiên. */ }
});

function orderView(row) {
  return { ...row, customer_name: row.receiver_name, phone: row.receiver_phone, address: row.shipping_address };
}

async function loadOrderDetail(id) {
  const { order, items } = await api.get(`/orders/${id}`);
  return { ...orderView(order), items: items.map(item => ({
    ...item, condition_type: item.condition_at_order, sku_id: item.product_sku_id
  })) };
}
