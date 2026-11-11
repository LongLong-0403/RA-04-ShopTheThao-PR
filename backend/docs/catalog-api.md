# API Danh mục — Gia Bảo

## Phạm vi

- CRUD môn thể thao, danh mục cha/con, thương hiệu.
- Tên duy nhất trong từng bảng (danh mục cũng duy nhất toàn bảng).
- Chuẩn hoá khoảng trắng trong tên; kiểm tra trùng không phân biệt hoa/thường.
- Slug bắt buộc, duy nhất; chỉ nhận chữ thường ASCII, số và dấu `-` giữa các từ.
- Không xoá khi còn sản phẩm, kể cả sản phẩm INACTIVE.
- Không xoá danh mục còn con; không tự tham chiếu hoặc tạo chu trình.
- Không xoá môn còn sân, bài ghép kèo hoặc yêu cầu thu mua tham chiếu.

## Endpoints

| Method | URL | Quyền |
| --- | --- | --- |
| GET | `/api/sports`, `/api/categories`, `/api/brands` | Công khai |
| GET | `/api/sports/{id}`, `/api/categories/{id}`, `/api/brands/{id}` | Công khai |
| POST | `/api/sports`, `/api/categories`, `/api/brands` | ADMIN ACTIVE |
| PUT | `/api/sports/{id}`, `/api/categories/{id}`, `/api/brands/{id}` | ADMIN ACTIVE |
| DELETE | `/api/sports/{id}`, `/api/categories/{id}`, `/api/brands/{id}` | ADMIN ACTIVE |
| GET | `/api/categories/tree` | Công khai |
| GET | `/api/menu` | Công khai |

Danh sách hỗ trợ `q`, `status=ACTIVE|INACTIVE`, `offset` (mặc định 0),
`limit` (mặc định 100, tối đa 500). `parent_id` chỉ có tác dụng với danh mục.
Danh sách phẳng mặc định trả cả ACTIVE và INACTIVE; frontend cửa hàng nên
truyền `status=ACTIVE` hoặc dùng `/api/menu`.
Cây danh mục hỗ trợ `status`; một nhánh có cha không khớp trạng thái sẽ bị ẩn toàn nhánh.
PUT chỉ cập nhật trường được gửi; `parent_id`, `description`, `logo_url` cho phép
null để xoá giá trị. `name`, `slug`, `status` không được null.

### Xác thực

Backend hiện chưa có dependency đăng nhập dùng chung. Module dùng HTTP Basic:
username là email, password được kiểm tra với bcrypt trong bảng users.
Chỉ tài khoản ADMIN có trạng thái ACTIVE được POST/PUT/DELETE.
Swagger `/docs` có nút Authorize. Không gửi mật khẩu qua HTTP trên môi trường
thật: phải dùng HTTPS. Không nhúng tài khoản quản trị trong frontend công khai.
Khi nhóm có JWT/session chung, thay dependency `require_catalog_admin` bằng
dependency chung; không cần sửa nghiệp vụ CRUD.

### Request mẫu

POST `/api/sports`:

```json
{"name":"Cầu lông","slug":"cau-long","description":"Dụng cụ cầu lông","status":"ACTIVE"}
```

POST `/api/categories`:

```json
{"name":"Vợt cầu lông","slug":"vot-cau-long","parent_id":null,"status":"ACTIVE"}
```

POST `/api/brands`:

```json
{"name":"Yonex","slug":"yonex","logo_url":null,"status":"ACTIVE"}
```

### Menu nhiều cột

GET `/api/menu?sport_id=1` (sport_id tuỳ chọn).

- Mỗi node là một danh mục với `children` và `brands`.
- Thương hiệu được suy ra qua products, không cần bảng quan hệ mới.
- Danh mục cha tổng hợp thương hiệu của các danh mục con đang hiển thị.
- Loại bỏ trùng thương hiệu; sắp xếp tên và ID để kết quả ổn định.
- Chỉ hiển thị danh mục, môn và thương hiệu ACTIVE.
- Sản phẩm ACTIVE hoặc OUT_OF_STOCK được tính vào menu; INACTIVE không được tính.
- Giữ danh mục trống với `brands: []`, `children: []` để frontend có thể quyết định bố cục.
- Một danh mục INACTIVE làm ẩn cả nhánh con trên menu.

```json
[
  {
    "id":1,"name":"Vợt","slug":"vot","parent_id":null,"status":"ACTIVE",
    "brands":[{"id":1,"name":"Yonex","slug":"yonex","logo_url":null,"status":"ACTIVE"}],
    "children":[]
  }
]
```

### Mã trả về

- 200: đọc/cập nhật thành công; 201: tạo thành công; 204: xoá thành công.
- 401: thiếu/sai thông tin xác thực; 403: không phải ADMIN ACTIVE.
- 404: không tìm thấy bản ghi/cha/môn lọc menu.
- 409: trùng tên/slug, đang được tham chiếu hoặc chu trình.
- 422: request không hợp lệ.

## Database đã tồn tại

`Base.metadata.create_all()` không thay đổi bảng cũ. Trước khi bật API ghi:

1. Sao lưu database, chọn đúng database trong MySQL client.
2. Kiểm tra dữ liệu trùng và cây danh mục hiện có; sửa trùng tên (bao gồm khác
   hoa/thường/khoảng trắng) và chu trình nếu có. Không tự động xoá dữ liệu.
3. Kiểm tra `SHOW CREATE TABLE categories`.
4. Chạy `sql/catalog_constraints.sql` một lần để thêm unique name và đổi FK cha
   từ SET NULL sang RESTRICT. Không chạy lại trên schema mới đã có các ràng buộc.

Database mới dùng model hiện tại sẽ có ràng buộc ngay từ khi tạo bảng.
MySQL mặc định của dự án dùng `utf8mb4_unicode_ci` để unique không phân biệt hoa/thường.
Thay đổi cây được khoá bằng SELECT FOR UPDATE theo thứ tự ID trong transaction.
Unique/FK ở database là lớp bảo vệ cuối khi có request đồng thời.
Chưa kiểm chứng tranh chấp đồng thời trên MySQL thật bằng bộ test tự động.

## Kiểm thử

Từ thư mục backend:

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
python -m uvicorn app.main:app --reload
```

Test HTTP dùng unittest, FastAPI TestClient và SQLite in-memory; không ghi vào
MySQL thật. Bao gồm CRUD, trùng tên/slug, cây, chặn xoá, menu, validation và quyền.
SQL migration phải được kiểm chứng riêng trên bản sao database MySQL của nhóm.