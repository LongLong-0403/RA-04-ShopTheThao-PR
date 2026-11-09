# Chạy backend trên Windows

Tạo database `ban_do_the_thao` trong MySQL. Từ thư mục gốc của repo, chạy trong terminal VS Code:

```powershell
cd BE
python -m pip install fastapi uvicorn sqlalchemy pymysql cryptography python-dotenv
Copy-Item .env.example .env
```

Điền thông tin MySQL của máy vào `.env`, sau đó chạy:

```powershell
python -m uvicorn main:app --env-file .env --reload
```

Mở http://127.0.0.1:8000/docs để thử API.
