const fs = require('fs');

// Setup localStorage Mock
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {};

const code = fs.readFileSync('frontend/js/data/store.js', 'utf-8');
eval(code);

const store = window.tsportStore;
console.log("=== START VERIFICATION ===");

// 1. Kiểm tra Seed Data Coupons
const coupons = store.getCoupons();
console.log(`[PASS] Số lượng mã giảm giá hạt giống: ${coupons.length}`);
if (coupons.length < 5) throw new Error("Seed coupons count too low!");

// 2. Kiểm tra SKU có Giá Sale
const p1 = store.getProductById(1);
const sku1 = p1.skus[0];
console.log(`[PASS] SKU 1 (${sku1.sku_code}) - Giá niêm yết: ${sku1.price}, Giá sale: ${sku1.sale_price}`);
if (!sku1.sale_price || sku1.sale_price >= sku1.price) throw new Error("SKU 1 sale_price invalid!");

// 3. Thêm vào giỏ với Giá Sale
store.clearCart();
store.addToCart(1, sku1.id, 1);
const cartTotals = store.getCartTotals();
console.log(`[PASS] Giỏ hàng 1 SP: Giá tính = ${cartTotals.subtotal} (Kỳ vọng: ${sku1.sale_price})`);
if (cartTotals.subtotal !== sku1.sale_price) throw new Error("Cart price did not use sale_price!");

// 4. Kiểm tra Validation Mã Giảm Giá
// a) Mã không tồn tại
const invalidCodeRes = store.validateAndCalculateCoupon("NOTEXIST", 2500000);
console.log(`[PASS] Mã không tồn tại: valid=${invalidCodeRes.valid}, msg="${invalidCodeRes.message}"`);
if (invalidCodeRes.valid) throw new Error("Nonexistent code should be invalid!");

// b) Mã hết hạn
const expiredRes = store.validateAndCalculateCoupon("HETHAN2025", 2500000);
console.log(`[PASS] Mã hết hạn (HETHAN2025): valid=${expiredRes.valid}, msg="${expiredRes.message}"`);
if (expiredRes.valid) throw new Error("Expired code should be invalid!");

// c) Mã hết lượt
const limitRes = store.validateAndCalculateCoupon("HETLUOT", 2500000);
console.log(`[PASS] Mã hết lượt (HETLUOT): valid=${limitRes.valid}, msg="${limitRes.message}"`);
if (limitRes.valid) throw new Error("Used up code should be invalid!");

// d) Đơn chưa đạt mức tối thiểu
const minOrderRes = store.validateAndCalculateCoupon("TSPORT10", 1000000); // Yêu cầu 2.000.000₫
console.log(`[PASS] Chưa đạt đơn tối thiểu: valid=${minOrderRes.valid}, msg="${minOrderRes.message}"`);
if (minOrderRes.valid) throw new Error("Under minimum order should be invalid!");

// e) Áp dụng mã phần trăm hợp lệ (TSPORT10: giảm 10%, max 500k)
const validPctRes = store.validateAndCalculateCoupon("TSPORT10", 2500000);
console.log(`[PASS] Áp dụng TSPORT10 (2.5M): Giảm=${validPctRes.discount_amount}, Còn lại=${validPctRes.final_total}`);
if (!validPctRes.valid || validPctRes.discount_amount !== 250000 || validPctRes.final_total !== 2250000) {
  throw new Error("Coupon TSPORT10 calculation mismatch!");
}

// f) Áp dụng mã phần trăm vượt trần max_discount (TSPORT10 trên đơn 6.000.000₫ -> 10% = 600k nhưng max 500k)
const capRes = store.validateAndCalculateCoupon("TSPORT10", 6000000);
console.log(`[PASS] Giảm 10% trần 500k trên đơn 6M: Giảm=${capRes.discount_amount}`);
if (capRes.discount_amount !== 500000) throw new Error("Max discount cap was not enforced!");

// g) Áp dụng mã tiền cố định (GIAM100K: giảm 100k cho đơn từ 1.000.000₫)
const validFixedRes = store.validateAndCalculateCoupon("GIAM100K", 1500000);
console.log(`[PASS] Áp dụng GIAM100K (1.5M): Giảm=${validFixedRes.discount_amount}, Còn lại=${validFixedRes.final_total}`);
if (!validFixedRes.valid || validFixedRes.discount_amount !== 100000 || validFixedRes.final_total !== 1400000) {
  throw new Error("Coupon GIAM100K calculation mismatch!");
}

// 5. Kiểm tra Đặt hàng kèm Mã Giảm Giá & Server Re-calculation
const couponBefore = store.getCouponByCode("TSPORT10");
const usedCountBefore = couponBefore.used_count || 0;

const order = store.createOrder({
  customer_name: "Nguyễn Văn An",
  phone: "0912345601",
  address: "Số 15 Xuân Thủy, Cầu Giấy, Hà Nội",
  payment_method: "COD",
  coupon_code: "TSPORT10"
});

console.log(`[PASS] Đơn hàng tạo thành công: ${order.order_code}`);
console.log(`       Tiền hàng (subtotal): ${order.subtotal}`);
console.log(`       Mã áp dụng: ${order.coupon_code}`);
console.log(`       Số tiền giảm: ${order.discount_amount}`);
console.log(`       Tổng thanh toán: ${order.total_amount}`);

const couponAfter = store.getCouponByCode("TSPORT10");
console.log(`[PASS] Lượt sử dụng mã TSPORT10: ${usedCountBefore} -> ${couponAfter.used_count}`);
if (couponAfter.used_count !== usedCountBefore + 1) throw new Error("Coupon used_count did not increment!");

// 6. Kiểm tra Thử đặt hàng với mã gian lận / sai
store.addToCart(1, sku1.id, 1);
let threwErrorOnCheat = false;
try {
  store.createOrder({
    customer_name: "Nguyễn Văn An",
    phone: "0912345601",
    address: "Số 15 Xuân Thủy",
    coupon_code: "HETHAN2025" // Mã hết hạn
  });
} catch (err) {
  threwErrorOnCheat = true;
  console.log(`[PASS] Server chặn mã không hợp lệ lúc đặt hàng: "${err.message}"`);
}
if (!threwErrorOnCheat) throw new Error("Server failed to reject invalid coupon on order creation!");

// 7. Kiểm tra Đánh giá & Chấm sao
// a) Khách Nguyễn Văn An có đơn COMPLETED chứa sản phẩm 1
const canReviewP1 = store.canUserReviewProduct(1, "Nguyễn Văn An");
console.log(`[PASS] Quyền đánh giá SP 1 của Nguyễn Văn An (đã có đơn hoàn thành): ${canReviewP1}`);
if (!canReviewP1) throw new Error("User with completed order should be allowed to review!");

// b) Người lạ không có đơn hoàn thành
const canStrangerReview = store.canUserReviewProduct(1, "Người Chưa Từng Mua");
console.log(`[PASS] Quyền đánh giá SP 1 của Người Chưa Mua: ${canStrangerReview}`);
if (canStrangerReview) throw new Error("Stranger should not be allowed to review!");

// c) Thêm đánh giá mới
const initialRating = store.getProductRating(1);
console.log(`[PASS] Đánh giá SP 1 ban đầu: avg=${initialRating.avgRating}, count=${initialRating.count}`);

store.addReview({
  product_id: 1,
  user_name: "Nguyễn Văn An",
  rating: 5,
  comment: "Sản phẩm chính hãng, đập cầu rất thoát tay, nhân viên tư vấn nhiệt tình!"
});

const updatedRating = store.getProductRating(1);
console.log(`[PASS] Đánh giá SP 1 sau khi thêm: avg=${updatedRating.avgRating}, count=${updatedRating.count}`);
if (updatedRating.count !== initialRating.count + 1) throw new Error("Review count did not increase!");

// 8. Admin CRUD Mã Giảm Giá
const newAdminCoupon = store.saveCoupon({
  code: "CHAMPION30",
  description: "Mã tri ân tân vô địch giải đấu",
  discount_type: "PERCENT",
  discount_value: 30,
  max_discount: 1000000,
  min_order_value: 3000000,
  expires_at: "2026-12-31",
  usage_limit: 50,
  status: "ACTIVE"
});
console.log(`[PASS] Admin tạo mã mới: ${newAdminCoupon.code} (ID: ${newAdminCoupon.id})`);

store.toggleCouponStatus(newAdminCoupon.id);
const toggled = store.getCouponById(newAdminCoupon.id);
console.log(`[PASS] Admin đổi trạng thái mã: ${toggled.status}`);
if (toggled.status !== "INACTIVE") throw new Error("Toggle status failed!");

store.deleteCoupon(newAdminCoupon.id);
const deleted = store.getCouponById(newAdminCoupon.id);
console.log(`[PASS] Admin xóa mã: tồn tại = ${Boolean(deleted)}`);
if (deleted) throw new Error("Delete coupon failed!");

console.log("=== ALL TESTS PASSED WITH 100% SUCCESS! ===");
