# Gắn xác thực và phân quyền vào API

Dependency dùng chung đặt tại `app/core/deps.py`. Mỗi request xác minh JWT, kiểm tra
token đã logout, lấy User từ database và kiểm tra trạng thái ACTIVE. Role được đọc
từ database, không tin role trong body hoặc role cũ trong token.

## Chọn dependency

| Loại API | Cách gắn |
| --- | --- |
| Nội dung công khai như tìm kiếm, menu, sân | Không gắn dependency đăng nhập; chỉ trả trường công khai |
| Hồ sơ, giỏ, đơn, booking, thu mua cá nhân | `Depends(get_current_user)` và lọc chủ sở hữu |
| Quản trị người dùng, tạo/sửa danh mục, sản phẩm, sân | `Depends(require_admin)` |
| API có cả khách và Admin | `get_current_user`, sau đó kiểm tra role, chủ sở hữu và quyền của từng hành động |

`get_current_user` chỉ xác thực người gọi. Nó **không tự kiểm tra quyền sở hữu**
của order_id, booking_id hoặc các ID khác. Người viết endpoint phải lọc theo user_id.

## API cần người dùng đăng nhập

```python
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get('/example/me')
def current_profile(user: User = Depends(get_current_user)):
    return {'id': user.id, 'full_name': user.full_name}
```

Khi trả User, dùng `UserOut` làm response_model để không lộ password_hash.
Không trả trực tiếp User ORM ở endpoint mới nếu chưa có schema lọc dữ liệu.

## API chỉ Admin

Nếu cần biết Admin nào thực hiện:

```python
from app.core.deps import require_admin

@router.post('/admin/example')
def create_example(admin: User = Depends(require_admin)):
    return {'performed_by': admin.id}
```

Nếu không cần biến Admin, gắn vào decorator:

```python
@router.delete('/admin/example/{row_id}', dependencies=[Depends(require_admin)])
def delete_example(row_id: int):
    ...
```

Nếu toàn bộ router là quản trị, gắn một lần:

```python
router = APIRouter(prefix='/admin/examples', dependencies=[Depends(require_admin)])
```

Không gắn require_admin cho cả router có API công khai hoặc API cá nhân của khách.

## Danh sách thuộc người dùng

```python
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.order import Order

@router.get('/example/my-orders')
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(db.scalars(select(Order).where(Order.user_id == user.id)))
```

Không nhận user_id từ query/body để quyết định chủ giỏ hoặc người tạo giao dịch.
Khi tạo bản ghi, luôn gán `user_id=user.id` từ dependency. Schema đầu vào không nên
chứa user_id, role hoặc giá chốt do server quản lý.

## Chi tiết chỉ chủ sở hữu hoặc Admin

```python
from fastapi import HTTPException
from app.models.user import UserRole

@router.get('/example/orders/{order_id}')
def detail(order_id: int, db: Session = Depends(get_db),
           user: User = Depends(get_current_user)):
    query = select(Order).where(Order.id == order_id)
    if user.role != UserRole.ADMIN:
        query = query.where(Order.user_id == user.id)
    order = db.scalar(query)
    if order is None:
        raise HTTPException(404, 'Không tìm thấy đơn')
    return {'id': order.id, 'status': order.status}
```

Với dữ liệu riêng tư, trả 404 cho cả ID không tồn tại và ID của người khác để tránh
tiết lộ sự tồn tại của bản ghi. Đây là quy ước có chủ đích, không phải lỗi thiếu 403.

Với thao tác ghi, dùng cùng điều kiện sở hữu và `.with_for_update()` trong transaction.
Sau đó kiểm tra quyền của hành động và trạng thái hiện tại trước khi ghi; chỉ commit
một lần cho toàn bộ tác dụng như hủy đơn và hoàn kho. Không commit ở helper giữa chừng.
Admin có quyền xem không đồng nghĩa được làm thay mọi hành động của khách: bài ghép
kèo chỉ chủ bài sửa/đóng; phản hồi giá thu mua thuộc chủ yêu cầu theo luồng nghiệp vụ.

## Mã HTTP thống nhất

| Trường hợp | HTTP |
| --- | --- |
| Thiếu Bearer token, token sai/hết hạn/đã logout, User không còn tồn tại | 401, kèm `WWW-Authenticate: Bearer` |
| Token hợp lệ nhưng tài khoản INACTIVE/LOCKED | 403 |
| CUSTOMER gọi API chỉ Admin | 403 |
| Dữ liệu riêng của người khác hoặc ID không tồn tại | 404 |
| Đúng người nhưng chuyển trạng thái không hợp lệ hoặc dữ liệu xung đột | 409 |
| Body, enum hoặc kiểu dữ liệu không hợp lệ | 422 |

Dependency không trả 401 chỉ vì User không phải Admin; trường hợp đó phải là 403.
Frontend xử lý 401 bằng đăng nhập lại; 403 bằng thông báo thiếu quyền hoặc tài khoản
bị hạn chế, không lặp gửi request đăng nhập tự động.

## Gắn router và thử Swagger

Trong `app/main.py`, import router rồi `app.include_router(router, prefix='/api')`.
Không lặp dependency trong main nếu router đã có chính sách phù hợp.

1. Gọi POST `/api/auth/login` với email/password, lấy access_token.
2. Trong Swagger `/docs`, bấm Authorize, dán token. Trong Postman dùng Bearer Token.
3. Gọi `/api/auth/me` để xác minh người gọi.
4. Sau logout, token đó phải nhận 401. Đổi role/khóa tài khoản có hiệu lực theo database.

## Kiểm thử bắt buộc cho endpoint mới

- Không token hoặc token sai: 401 khi endpoint cần đăng nhập.
- CUSTOMER vào API Admin: 403; ADMIN hợp lệ: xử lý thành công theo nghiệp vụ.
- Tạo hai khách A/B; A tạo bản ghi rồi B thay ID để đọc/sửa/xóa: 404 hoặc 403 theo chính sách.
- Danh sách của B không chứa bản ghi cá nhân của A.
- Body giả user_id/role/status không được làm đổi chủ sở hữu hoặc nâng quyền.
- Tài khoản LOCKED/INACTIVE không dùng được token cũ.
- Token sau logout không dùng lại được; không trả password_hash hoặc JWT trong log/ảnh test.
- Quyền truy cập đúng vẫn phải kiểm tra trạng thái, thời gian và tính nguyên tử của giao dịch.

Chạy bộ kiểm thử chung từ thư mục backend:

```powershell
.venv/Scripts/python.exe -X utf8 sql/test_api.py
.venv/Scripts/python.exe -X utf8 sql/test_postman.py
```

Hai script tạo database tạm rồi xóa, cần quyền tạo/xóa database; không ghi giao dịch
thử vào database ứng dụng. TestClient override `get_db` để mọi dependency dùng cùng
database thử. Chưa có endpoint khách tự sửa hồ sơ trong phiên bản hiện tại;
`PUT /api/users/{id}` dành cho Admin, không dùng thay API hồ sơ cá nhân.

Kho thu hồi token hiện là `backend/.runtime/revoked_tokens.sqlite3`, dùng chung cho
các worker cùng máy. Triển khai nhiều máy chủ cần kho thu hồi dùng chung. SECRET_KEY
phải cấu hình ổn định và giống nhau giữa các worker; mặc định ngẫu nhiên theo tiến trình
không phù hợp để chạy nhiều worker. Không commit `.env` hoặc thư mục `.runtime`.
