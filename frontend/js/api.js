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
const http = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000, // quá 10 giây không phản hồi thì báo lỗi
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn Token đăng nhập cho mọi request khi đã đăng nhập (JWT Bearer Token):
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("tsport_token");
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
// --- DỮ LIỆU MẪU BUYBACKS (THÊM VÀO initialData) ---
const initialBuybacks = [
  {
    id: 1,
    product_name: "Yonex Astrox 88D Pro 4U",
    brand: "Yonex",
    model: "Astrox 88D Pro",
    condition_grade: "90%",
    wear_description: "Vợt còn 90%, xước nhẹ 1 điểm viền, khung cacbon không nứt.",
    desired_price: 2200000,
    offered_price: null,
    image_url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600",
    customer_name: "Nguyễn Văn An",
    phone: "0912345601",
    contact_info: "0912345601",
    status: "CHO_DUYET",
    note: "",
    sku_created: false,
    created_sku_code: "",
    created_at: "2026-11-20 10:00:00"
  },
  {
    id: 2,
    product_name: "Lining Axforce 90 Max 3U",
    brand: "Lining",
    model: "Axforce 90 Max",
    condition_grade: "88%",
    wear_description: "Xước dăm nhẹ đầu vợt, cán zin còn đẹp.",
    desired_price: 2000000,
    offered_price: 1850000,
    image_url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600",
    customer_name: "Trần Minh Quân",
    phone: "0987654321",
    contact_info: "0987654321",
    status: "DANG_DINH_GIA",
    note: "Đang kiểm tra độ lún khung",
    sku_created: false,
    created_sku_code: "",
    created_at: "2026-11-20 11:15:00"
  }
];

// --- CÁC HÀM QUẢN LÝ BUYBACK TRÊN window.tsportStore ---
function getStoreData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.buybacks)) {
      parsed.buybacks = [...initialBuybacks];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  }
  const seeded = { ...initialData, buybacks: [...initialBuybacks] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveStoreData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const buybackStoreMethods = {
  getBuybacks(statusFilter = "ALL") {
    const data = getStoreData();
    const list = data.buybacks || [];
    if (!statusFilter || statusFilter === "ALL") return list;
    return list.filter((item) => item.status === statusFilter);
  },

  getBuybackById(id) {
    const data = getStoreData();
    return (data.buybacks || []).find((item) => Number(item.id) === Number(id)) || null;
  },

  // Khách gửi yêu cầu thu mua vợt cũ
  createBuyback(payload) {
    const data = getStoreData();
    data.buybacks = data.buybacks || [];
    const maxId = data.buybacks.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0);

    const brand = (payload.brand || "").trim();
    const model = (payload.model || "").trim();
    const productName = (payload.product_name || [brand, model].filter(Boolean).join(" ")).trim();
    const desiredPrice = Number(payload.desired_price ?? payload.proposed_price ?? 0);

    const newItem = {
      id: maxId + 1,
      product_name: productName,
      brand,
      model,
      condition_grade: (payload.condition_grade || "85%").trim(),
      wear_description: (payload.wear_description || "").trim(),
      desired_price: desiredPrice,
      proposed_price: desiredPrice,
      offered_price: null,
      image_url:
        (payload.image_url || "").trim() ||
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600",
      customer_name: (payload.customer_name || "").trim(),
      phone: (payload.phone || "").trim(),
      contact_info: (payload.contact_info || payload.phone || "").trim(),
      status: "CHO_DUYET",
      note: "",
      sku_created: false,
      created_sku_code: "",
      created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    data.buybacks.unshift(newItem);
    saveStoreData(data);
    return newItem;
  },

  // Khách hủy yêu cầu khi đang ở trạng thái CHO_DUYET
  cancelBuyback(id) {
    const data = getStoreData();
    const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
    if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");
    if (item.status !== "CHO_DUYET") {
      throw new Error("Chỉ có thể hủy yêu cầu khi đang ở trạng thái Chờ duyệt");
    }
    item.status = "DA_HUY";
    saveStoreData(data);
    return item;
  },

  // Admin nhập giá đề nghị và chuyển sang Đang định giá (hoặc cập nhật giá đề nghị)
  setBuybackPricing(id, offeredPrice, note = "") {
    const data = getStoreData();
    const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
    if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");

    const priceNum = Number(offeredPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      throw new Error("Giá đề nghị phải lớn hơn 0");
    }

    item.offered_price = priceNum;
    item.proposed_price = priceNum;
    if (note) item.note = note;
    if (item.status === "CHO_DUYET" || item.status === "DANG_DINH_GIA") {
      item.status = "DANG_DINH_GIA";
    }
    saveStoreData(data);
    return item;
  },

  // Chuyển trạng thái theo luồng: CHO_DUYET -> DANG_DINH_GIA -> DA_THU_MUA / TU_CHOI
  updateBuybackStatus(id, nextStatus, noteOrReason = "", offeredPrice = null) {
    const data = getStoreData();
    const item = (data.buybacks || []).find((b) => Number(b.id) === Number(id));
    if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");

    const allowedTransitions = {
      CHO_DUYET: ["DANG_DINH_GIA", "TU_CHOI"],
      DANG_DINH_GIA: ["DA_THU_MUA", "TU_CHOI"],
      DA_THU_MUA: [],
      TU_CHOI: [],
      DA_HUY: []
    };

    const allowed = allowedTransitions[item.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Không thể chuyển trạng thái từ ${item.status} sang ${nextStatus}`);
    }

    if (offeredPrice !== null && offeredPrice !== undefined && offeredPrice !== "") {
      const priceNum = Number(offeredPrice);
      if (Number.isFinite(priceNum) && priceNum > 0) {
        item.offered_price = priceNum;
        item.proposed_price = priceNum;
      }
    }

    item.status = nextStatus;
    item.note = noteOrReason || item.note || "";
    saveStoreData(data);
    return item;
  },

  // Sinh SKU hàng cũ vào kho sản phẩm khi đã DA_THU_MUA
  createSkuFromBuyback(buybackId, skuPayload) {
    const data = getStoreData();
    const item = (data.buybacks || []).find((b) => Number(b.id) === Number(buybackId));
    if (!item) throw new Error("Không tìm thấy yêu cầu thu mua");
    if (item.status !== "DA_THU_MUA") {
      throw new Error("Chỉ tạo SKU khi yêu cầu đã ở trạng thái Đã thu mua");
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const skuCode = `USED-BBX-${randomCode}`;
    data.products = data.products || [];
    const maxProductId = data.products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);

    const newProduct = {
      id: maxProductId + 1,
      sport_id: 1,
      category_id: 2,
      brand_id: 1,
      name: `${item.product_name} (Hàng cũ thu mua)`,
      description: skuPayload.wear_description || item.wear_description || "",
      condition_type: "CU",
      wear_description: skuPayload.wear_description || item.wear_description || "",
      status: "ACTIVE",
      specifications: {
        condition_grade: item.condition_grade || "85%",
        buyback_id: item.id
      },
      images: [
        {
          id: Date.now(),
          image_url: item.image_url,
          is_primary: true,
          sort_order: 1
        }
      ],
      skus: [
        {
          id: Date.now() + 1,
          sku_code: skuCode,
          size: skuPayload.size || "Tiêu chuẩn",
          color: skuPayload.color || "Nguyên bản",
          price: Number(skuPayload.price) || 1500000,
          stock: Number(skuPayload.stock) || 1,
          unit: skuPayload.unit || "CHIEC",
          quantity_per_lot: Number(skuPayload.quantity_per_lot) || 1,
          status: "ACTIVE"
        }
      ]
    };

    data.products.push(newProduct);
    item.sku_created = true;
    item.created_sku_code = skuCode;
    saveStoreData(data);

    return { skuCode, product: newProduct, buyback: item };
  }
};

window.tsportStore = Object.assign(window.tsportStore || {}, buybackStoreMethods);