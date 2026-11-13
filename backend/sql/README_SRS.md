# Đối chiếu dữ liệu SQL với SRS Shop Thể Thao

Đã đối chiếu `sport_store_demo.sql` với chương 3, 6 và TC-26 của tài liệu
`SRS_ShopTheThao (1).docx` ngày 11/11/2026. Bộ ban đầu có đủ 16 bảng và đủ số lượng
dữ liệu tối thiểu, nhưng chưa đáp ứng tính toàn vẹn và khả năng chạy seed nhiều lần.
Bản SQL đã được sửa và kiểm tra trên MySQL 8.0.46 trong một máy chủ thử riêng.

## Số lượng dữ liệu sau kiểm tra

| Nhóm | SRS mục 6.5 tối thiểu | SQL hiện tại |
| --- | --- | --- |
| Bảng nghiệp vụ | 16 | 16 |
| Người dùng | 1 ADMIN và 5 CUSTOMER | 1 ADMIN và 6 CUSTOMER |
| Giỏ hàng | Mỗi CUSTOMER một giỏ | 6 |
| Sản phẩm | 36, ít nhất 6 CU | 38, gồm 30 MOI và 8 CU |
| SKU | Mọi sản phẩm có SKU, đủ CHIEC và LO | 62, đủ hai đơn vị |
| Ảnh | Mọi sản phẩm có ảnh chính | 44 ảnh, mỗi sản phẩm đúng một ảnh chính |
| Sân và ca | 3 sân và 12 ca | 4 sân và 16 ca, không chồng giờ |
| Dữ liệu nền | Tham chiếu hợp lệ | 5 môn, 16 danh mục, 11 thương hiệu |
| Giao dịch minh họa | Không bắt buộc | 6 booking, 4 bài ghép kèo, 4 thu mua, 5 đơn và 6 dòng đơn |

Giữ các bản ghi bổ sung đang có vì mục 6.5 ghi mức tối thiểu. TC-26 lại liệt kê
36 sản phẩm, 3 sân và 12 ca mà không nhắc rõ đây là mức tối thiểu; khi chốt nghiệm
thu nên thống nhất cách diễn đạt này. Không xóa dữ liệu chỉ để đạt đúng số mẫu.

## Các phần đã sửa

- Booking id 3 dùng ca 13 của sân 3 nhưng trước đây lưu sân 4; đã sửa về sân 3.
- Tạo lại 7 hash bcrypt cost 12, mỗi tài khoản một salt; đã kiểm tra mật khẩu thực tế.
- Bổ sung CHECK cho mô tả hao mòn hàng CU, đơn vị CHIEC/LO, thứ tự ảnh, giờ ca,
  phí giao hàng bằng 0, số ảnh thu mua từ 1 đến 5 và giá đề nghị bắt buộc theo trạng thái.
- Bổ sung duy nhất bộ thuộc tính SKU sau chuẩn hóa NULL/rỗng/khoảng trắng/chữ thường,
  tối đa một ảnh chính mỗi sản phẩm, một dòng đơn cho mỗi SKU.
- Dùng khóa ngoại ghép để ca đặt luôn thuộc đúng sân.
- Thay trigger đếm booking bằng chỉ mục duy nhất có điều kiện qua cột sinh tự động.
  Cơ chế này chặn trùng ngay cả khi hai kết nối ghi đồng thời, vẫn cho đặt lại sau HUY/TU_CHOI.
- Ngăn xóa đơn hàng đã có chi tiết; bổ sung chỉ mục truy vấn theo mục 6.4.
- Seed toàn bộ trong transaction, rollback khi lỗi, luôn bật kiểm tra FK.
  Khi bất kỳ bảng nào đã có dữ liệu, bỏ qua toàn bộ seed để không ghi đè kho,
  mật khẩu, giỏ hoặc giao dịch. Không dùng INSERT IGNORE che lỗi dữ liệu.

Các cột `size_key`, `color_key`, `primary_marker`, `held_marker` là cột kỹ thuật
do MySQL tự tính; API không cần và không được gán giá trị cho chúng.

## Cách chạy

1. Dùng MySQL từ 8.0.16 trở lên để CHECK được thực thi.
2. Trong MySQL Workbench, mở `sport_store_demo.sql` và Execute toàn bộ. Script tạo
   database `sport_store_db` nếu chưa tồn tại. Cần quyền tạo database, bảng và procedure.
3. Chọn `sport_store_db` làm schema mặc định rồi chạy `verify_srs.sql`.
   Các dòng `violations` phải bằng 0; số lượng phải đạt tối thiểu.
4. Có thể Execute lại file khởi tạo: dữ liệu đã có sẽ không thay đổi.

File này là bộ khởi tạo và seed cho database mới, **không phải migration**.
`CREATE TABLE IF NOT EXISTS` không nâng cấp các bảng cũ. Nếu đã có database theo
phiên bản trước, cần migration riêng sau khi kiểm tra dữ liệu thực tế bằng
`verify_srs.sql`; không xóa database hoặc chạy lại để kỳ vọng tự sửa schema cũ.
Seed cũng không tự lấp một database đang có dữ liệu dở dang: trường hợp đó được bỏ qua
để tránh trùng ID cố định với dữ liệu người dùng.

`init.sql` và `users.sql` là các bộ khởi tạo cũ của `app_db`, không thay thế bộ 16 bảng.
Backend mặc định đọc `app_db` và tự seed dữ liệu riêng khi khởi động; muốn kết nối
bộ dữ liệu này cần cấu hình `DB_NAME=sport_store_db` và rà soát cơ chế tự seed của
backend trước khi chạy. Việc đổi cấu hình ứng dụng chưa được thực hiện trong lần sửa SQL này.

Tài khoản chỉ dùng thử: `admin@sportstore.vn` / `Admin@123`;
khách `nguyen.vana@gmail.com` / `Customer@123`. Các CUSTOMER còn lại có cùng
mật khẩu thử nhưng hash và salt khác nhau. Không dùng các tài khoản này cho vận hành thật.

## Bằng chứng kiểm tra

Chạy từ thư mục `backend`:

```powershell
.venv/Scripts/python.exe sql/test_srs_database.py
```

Lệnh đọc kết nối từ `.env`, tạo database thử có tên ngẫu nhiên `srs_verify_...`,
chạy kiểm tra rồi xóa đúng database thử đó. Không dùng database ứng dụng.
Tài khoản kiểm thử cần quyền tạo/xóa database. Trên máy Windows có MySQL Server
tại đường dẫn mặc định, có thể dùng `--isolated-server` để tạo máy chủ thử ở cổng
13386, không dùng thông tin đăng nhập máy chủ hiện tại.

Đã đạt: tạo đủ bảng; kiểm tra quan hệ dữ liệu và tổng đơn; bcrypt 7 tài khoản;
chạy seed hai lần và so sánh toàn bộ bản ghi sau khi đổi tồn kho; 13 phép thử từ chối
dữ liệu sai; hai kết nối tranh cùng ca; hủy rồi đặt lại ca.

## Những điều không thể kết luận chỉ từ SQL

Các yêu cầu dưới đây vẫn thuộc triển khai và kiểm thử tầng dịch vụ; bộ bảng và
seed không chứng minh toàn bộ ứng dụng đã đạt SRS:

- Quyền sở hữu, vai trò, tài khoản ACTIVE, bảo vệ ADMIN cuối cùng và chuyển trạng thái.
- Checkout/trừ kho/xóa giỏ và hủy đơn/hoàn kho nguyên tử, chống gửi lặp, chốt giá và
  tình trạng, giữ dữ liệu chốt không đổi. Stock mẫu là tồn còn lại tại ảnh chụp dữ liệu;
  không chạy trừ kho lần nữa cho các đơn lịch sử được seed.
- Không tạo chu trình danh mục; không để ca ACTIVE chồng lấn khi thêm/sửa; không đổi
  giờ ca đang có booking tương lai; từ chối đặt sân đã bắt đầu hoặc bị ẩn.
- Yêu cầu ít nhất một SKU và đúng một ảnh chính trước khi mở bán; chỉ mục SQL chỉ
  bảo đảm tối đa một ảnh chính, phần “ít nhất một” cần transaction nghiệp vụ.
- Kiểm tra từng URL, quyền truy cập ảnh, nội dung tệp tải lên, giới hạn dung lượng.
  Ảnh Unsplash hiện là ảnh minh họa, chưa xác minh khả dụng và đúng mẫu sản phẩm.
- Các ngưỡng NFR và lựa chọn QD-01 đến QD-10 trong SRS cần nghiệm thu nghiệp vụ riêng.

Chưa kiểm tra hoặc thay đổi database ứng dụng đang chạy: kết nối bằng `.env` hiện tại
bị MySQL từ chối đăng nhập. Tài liệu Word gốc được giữ nguyên.
