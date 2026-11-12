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
