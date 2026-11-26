# Chạy bản demo Tsport

Bản demo chạy frontend và FastAPI trên cùng một địa chỉ. MySQL dùng cơ sở dữ liệu riêng `tsport_demo`. Khách có thể tự đăng ký bằng dữ liệu giả lập, đặt hàng COD, đặt sân và thử ghép kèo hoặc thu mua. Quản trị viên dùng tài khoản được tạo riêng từ terminal.

Ưu tiên trải nghiệm quản trị qua đơn hàng, đặt sân, thu mua và tổng quan. Các thao tác sửa danh mục, sản phẩm và tồn kho từ giao diện admin vẫn lưu cục bộ. Biểu mẫu gửi hỗ trợ trên trang đăng nhập được ẩn trong bản demo.

## Chạy với Docker Compose

1. Tạo file `.env` ở thư mục gốc và điền hai giá trị ngẫu nhiên khác nhau.

   ```dotenv
   TSPORT_DEMO_DB_PASSWORD=
   TSPORT_DEMO_SECRET_KEY=
   ```

   Có thể tạo từng giá trị bằng `python -c "import secrets; print(secrets.token_urlsafe(32))"`. Giữ file này trên máy triển khai.

2. Khởi động ứng dụng.

   ```sh
   docker compose -f compose.demo.yaml up -d --build
   ```

3. Mở `http://127.0.0.1:8080/`. Kiểm tra kết nối MySQL ở `http://127.0.0.1:8080/api/health`.

4. Tạo tài khoản admin riêng. Lệnh sẽ hỏi mật khẩu trực tiếp trong terminal.

   ```sh
   docker compose -f compose.demo.yaml exec app python -m app.create_admin --email admin-demo@example.net --name "Quản trị demo" --phone 0900000001
   ```

## Chia sẻ qua Internet

Trên máy chủ có Docker, lấy mã từ GitHub và chạy cùng các bước trên. Dùng reverse proxy HTTPS chuyển tiếp đến cổng `8080` trên máy chủ. Frontend sẽ tự gọi API qua cùng tên miền. Chỉ chia sẻ URL HTTPS của bản demo. MySQL chạy trong mạng nội bộ của Compose và dữ liệu được giữ trong volume riêng.

Dừng bản demo bằng `docker compose -f compose.demo.yaml down`.
