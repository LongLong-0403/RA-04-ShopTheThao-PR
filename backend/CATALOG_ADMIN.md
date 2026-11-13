# Quản trị sản phẩm

## Chạy

1. Cấu hình MySQL trong `.env` theo README backend, chạy `python -m uvicorn app.main:app --reload`.
2. Chạy HTTP server tĩnh cho frontend; mở trang `pages/products.html` qua HTTP, không qua `file://`.
3. Đăng nhập bằng tài khoản ADMIN hiện có. Token chỉ lưu trong sessionStorage của tab; API kiểm tra quyền ở máy chủ.
4. Tạo sản phẩm INACTIVE → thêm một hoặc nhiều SKU → thêm ảnh URL hoặc upload → lưu ACTIVE.

## Quy tắc

- Hàng CU luôn cần mô tả hao mòn. Loại dụng cụ nhận diện từ tên/slug danh mục và tổ tiên, nên cần đặt danh mục rõ nghĩa (Vợt, Cầu, Bóng).
- Vợt cũ bán CHIEC, tổng tồn của tất cả SKU tối đa 1 (cho phép 0 sau khi bán). Cầu/bóng cũ bán LO.
- CHIEC có quantity_per_lot = 1; LO có quantity_per_lot > 1. Giá và tồn tính theo đơn vị bán, không phải số vật lý trong lô.
- Không trùng mã SKU hoặc bộ size/màu/đơn vị/quy cách lô sau chuẩn hóa.
- Kích hoạt yêu cầu ít nhất một SKU và đúng một ảnh chính. Không có tồn chuyển OUT_OF_STOCK; nhập tồn lại chuyển ACTIVE, nhưng không tự mở sản phẩm INACTIVE.
- DELETE sản phẩm luôn ẩn, kể cả khi chưa có đơn (giữ chính sách an toàn sẵn có). SKU có đơn không được xóa hoặc đổi đơn vị/quy cách lô. Giá chốt trong order_items giữ nguyên.
- Ảnh đầu tiên tự là ảnh chính; có thể đổi ảnh chính và thứ tự. Không xóa ảnh chính của sản phẩm đang hiển thị.
- Upload nhận raw body PNG/JPEG/WebP, không phải multipart. Kiểm tra MIME, chữ ký tệp và tối đa 5 MB; đây không phải bộ giải mã/kiểm tra toàn vẹn ảnh hay bộ quét mã độc. Không nhận SVG. Tên tệp do server sinh.
- Tệp lưu tại thư mục uploads/products của backend, phục vụ qua /uploads/products. Cần sao lưu thư mục này cùng database khi triển khai. Xóa liên kết ảnh không tự xóa tệp vật lý để tránh làm hỏng ảnh đang dùng lại.

## API bổ sung (đều yêu cầu ADMIN)

- GET /api/admin/products?q=...
- GET /api/admin/products/{id}
- PUT /api/products/{id}/images/{image_id}
- DELETE /api/products/{id}/images/{image_id}
- POST /api/products/{id}/images/upload (Content-Type: image/png, image/jpeg hoặc image/webp)

Các API sản phẩm/SKU/ảnh URL hiện có được giữ nguyên. Không thay đổi schema database.

## Kiểm thử

Trong thư mục backend:

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

Test sử dụng SQLite in-memory, bật khóa ngoại, không kết nối hoặc sửa MySQL thật. Bao phủ phân quyền chưa đăng nhập, kích hoạt, đồng bộ tồn, ẩn, hàng cũ, trùng biến thể, quy cách lô, upload và ảnh chính, giữ lịch sử đơn hàng. Cần kiểm thử thêm trên MySQL thật cho khóa dòng và cạnh tranh giao dịch, và kiểm thử giao diện bằng trình duyệt.