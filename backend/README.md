# Backend FastAPI + MySQL

Hướng dẫn nhóm gắn xác thực, quyền Admin và quyền sở hữu vào API:
[AUTH_INTEGRATION.md](AUTH_INTEGRATION.md).

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

## Tài khoản kiểm thử cục bộ

File `.env.example` bật `ENABLE_LOCAL_TEST_ACCOUNTS=true` để backend tạo hai tài khoản khi khởi động với MySQL ở `localhost` hoặc `127.0.0.1`.

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin123@gmail.com` | `admin123@gmail.com` |
| Khách hàng | `user123@gmail.com` | `user123@gmail.com` |

Nếu đã có `.env` từ trước, thêm `ENABLE_LOCAL_TEST_ACCOUNTS=true` rồi khởi động lại backend. Ở chế độ này, mỗi lần khởi động sẽ khôi phục quyền, trạng thái và mật khẩu của đúng hai tài khoản kiểm thử nếu chúng đã tồn tại. Chỉ bật với cơ sở dữ liệu phát triển cục bộ. Giữ `ENABLE_LOCAL_TEST_ACCOUNTS=false` khi triển khai.
