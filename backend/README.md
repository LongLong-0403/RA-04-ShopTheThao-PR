# Backend FastAPI + MySQL

Từ thư mục gốc, chạy trong PowerShell sau khi bật MySQL:

```powershell
cd backend
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Điền tài khoản và mật khẩu MySQL trong `.env`. Dùng database của backend chung (mặc định `app_db`) hoặc database mới. Schema của database `BE` cũ khác với schema chung; cần chuyển dữ liệu trước nếu muốn dùng dữ liệu sân cũ.

```powershell
python -m uvicorn app.main:app --reload
```

Mở http://127.0.0.1:8000/docs. Danh sách sân và ca sân ở `/api/courts/` và `/api/slots/`. Các URL cũ `/courts/` và `/slots/` vẫn hoạt động.

## API sản phẩm cho khách

Danh sách chỉ trả sản phẩm đang bán, có SKU và hình ảnh hợp lệ. Các tham số bộ lọc được kết hợp đồng thời:

```text
GET /api/products
  ?q=vot
  &sport_id=1
  &category_id=2
  &brand_id=3
  &condition_type=MOI
  &min_price=500000
  &max_price=5000000
  &sort=price_asc
  &page=1&page_size=20
```

`sort` nhận `newest`, `price_asc` hoặc `price_desc`. Giá trong danh sách là `min_price`, tính từ SKU rẻ nhất của sản phẩm. `category_id` bao gồm cả các danh mục con. Chi tiết sản phẩm xem tại `GET /api/products/{product_id}`.
