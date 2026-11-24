"""Generate the detailed API testing guide from the Postman collection."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / 'ShopTheThao_API_Test.postman_collection.json'
collection = json.loads(path.read_text(encoding='utf-8'))
for variable in collection['variable']:
    if variable['key'] == 'admin_email': variable['value'] = 'longlong@gmail.com'
    if variable['key'] == 'admin_password': variable['value'] = 'longlong@gmail.com'
path.write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding='utf-8')

intro = '''# Hướng dẫn kiểm thử API Shop Thể Thao từ A đến Z

Ngày lập 12/11/2026. Tài liệu mô tả cách chạy và kết quả cần kiểm tra cho các API hiện có.
Kết quả mong đợi trong từng ca là tiêu chí kiểm tra, không tự đồng nghĩa với tất cả ca
đã được xác nhận trên database ứng dụng. Các ca kiểm thử mở rộng ở cuối cần chạy riêng.

## A Chuẩn bị

1. Backend phải chạy tại `http://127.0.0.1:8000`; mở `/docs` để xem Swagger.
2. Mở Postman, Import file `ShopTheThao_API_Test.postman_collection.json` ở thư mục gốc.
3. Trong Variables, đặt `base_url` theo địa chỉ backend. Không thêm `/api` vào base_url.
4. Tài khoản Admin đã được tạo và kiểm tra đăng nhập trên database ứng dụng:
   email `longlong@gmail.com`, mật khẩu `longlong@gmail.com`, role `ADMIN`, status `ACTIVE`.
5. Collection Runner chọn toàn bộ request và chạy từ đầu, một iteration. Không chạy song song
   vì các request sau dùng ID và token của request trước. Mỗi lần chạy đầu tạo `run_id` mới.
6. Xem tab Test Results: các ca lỗi cố ý nhận 401, 403, 409 hoặc 422 vẫn là PASS nếu đúng dự kiến.

Collection tạo tài khoản khách riêng, dữ liệu danh mục, sản phẩm và giao dịch riêng.
Đơn hàng, booking và thu mua thử có thể còn trong database sau chạy để giữ lịch sử.
Chỉ dùng môi trường phát triển hoặc kiểm thử. Không dùng ID bản ghi thật để thử DELETE.

## B Cách thực hiện bằng Swagger hoặc Postman

- Với Postman Runner, token và ID được tự lưu vào Collection Variables.
- Với Swagger, gọi `POST /api/auth/login`, lấy `access_token`, bấm Authorize và dán token.
  Đổi token Admin hoặc Customer theo quyền yêu cầu của từng ca.
- Chọn endpoint, bấm Try it out, điền các ID thực tế, nhập JSON rồi Execute.
- Header JSON là `Content-Type: application/json`.
- Header xác thực là `Authorization: Bearer <access_token>`; không công bố token trong ảnh chụp.
- Các biến `{{...}}` trong tài liệu là cú pháp Postman. Trong Swagger phải thay bằng giá trị thật.
- ID trong JSON phải là số: ví dụ `"sport_id": 6`, không phải chuỗi `"6"`.
  Script Postman đã tự thay biến ID thành số trước khi gửi.
- Ngày đặt sân và ghép kèo mẫu dùng năm 2099 để không bị lỗi thời điểm đã qua.
  Giờ được hiểu là giờ Việt Nam UTC+7, nhập datetime không kèm múi giờ.

## C Ý nghĩa biến và dữ liệu

| Biến | Ý nghĩa |
| --- | --- |
| admin_token | JWT lấy từ tài khoản Admin |
| customer_token | JWT của khách được tạo riêng trong lần chạy |
| run_id | Hậu tố duy nhất cho email, tên, slug và SKU |
| customer_id, managed_user_id | Người dùng được tạo trong ca kiểm thử |
| sport_id, category_id, brand_id | Dữ liệu danh mục mới, không phụ thuộc seed |
| product_id, sku_id, lot_sku_id | Sản phẩm CU và hai đơn vị CHIEC, LO |
| order_id | Đơn được tạo từ giỏ hàng |
| court_id, slot_id, booking_id | Sân, ca và booking của lần chạy |
| match_id, buyback_id | Bài ghép kèo và yêu cầu thu mua |
| delete_id, item_id | Bản ghi dùng riêng cho phép thử xóa |

Đọc tiền theo VND. SKU CHIEC có giá 250.000 và tồn đầu 20; SKU LO có giá 600.000
cho một lô 12 đơn vị vật lý. Ba CHIEC và hai LO có tổng 1.950.000; sau khi bỏ hai LO,
đơn ba CHIEC có tổng 750.000, phí giao hàng 0 và phương thức COD.
Kho không giảm khi thêm giỏ; giảm 3 khi checkout và tăng lại đúng 3 khi hủy đơn.

## D Các điểm cần kiểm tra theo chức năng

| Nhóm | Kiểm tra nội dung ngoài mã HTTP |
| --- | --- |
| Auth | Đăng ký luôn CUSTOMER; JSON không có password_hash; login có JWT; me đúng người; logout làm token bị từ chối |
| Users | Chỉ Admin đọc/sửa/xóa; tạo người dùng đúng role; email trùng không tạo bản ghi thứ hai |
| catalog-sports/categories/brands | ID mới được tạo; tên/slug đúng; danh sách ACTIVE; cập nhật đúng bản ghi; xóa dữ liệu đang được dùng trả 409 |
| catalog-products | Hàng CU có mô tả hao mòn; tạo INACTIVE trước; thêm SKU và ảnh chính rồi mới ACTIVE |
| catalog-skus | CHIEC có quantity_per_lot=1; LO >1; giá và tồn không âm; SKU có lịch sử đơn không được xóa |
| catalog-images | Ảnh gắn đúng sản phẩm, có is_primary=true; URL mẫu chỉ để kiểm tra liên kết, không xác nhận tải ảnh thật |
| catalog-menu | Có danh mục vừa tạo và thương hiệu theo dữ liệu sản phẩm ACTIVE |
| Search | Kết quả đúng các bộ lọc kết hợp; giá theo SKU còn tồn; total và total_pages đúng; sản phẩm INACTIVE không hiện |
| Cart | Dòng trùng SKU được gộp; quantity nguyên dương; không vượt stock; tổng do server tính theo đơn vị bán |
| Orders | Đúng chủ đơn; đủ dòng; tổng 750000; COD/ship=0; giỏ rỗng sau commit; hủy lặp không hoàn kho lần hai |
| Courts/slots | Đúng sport và sân; giờ bắt đầu < kết thúc; ca ACTIVE không chồng lấn |
| Bookings | Giá lấy từ ca; CHO_XAC_NHAN cũng giữ ca; xác nhận/hủy/từ chối đúng quyền; hủy hoặc từ chối giải phóng ca |
| Matches | Bài OPEN ở tương lai xuất hiện công khai; chủ bài sửa và đóng; CLOSED không còn trong danh sách mặc định |
| Buyback | Ảnh không rỗng; ADMIN đề nghị giá; chủ yêu cầu chấp nhận; ADMIN hoàn tất; không tự nhập kho |
| Items | CRUD API mẫu tách biệt với sản phẩm bán hàng |
| Health/root | Health database=connected; root trả thông báo dịch vụ |

## E Danh sách kiểm thử tuần tự

Mỗi ca dưới đây tương ứng một request trong Collection Runner. Ca không có JSON body
chỉ cần URL và header. Nếu ca trước thất bại, xử lý nguyên nhân trước khi chạy tiếp ca phụ thuộc.

'''
sections = [intro]
for item in collection['item']:
    req = item['request']
    script = '\n'.join(item['event'][0]['script']['exec'])
    expected = int(re.search(r'HTTP (\d+)', script)[1])
    auth = req.get('auth', {})
    if auth.get('type') == 'noauth': role = 'Không gửi token'
    else:
        role = 'CUSTOMER' if 'customer_token' in auth['bearer'][0]['value'] else 'ADMIN'
    sections += [f"### TC {item['name']}\n\n",
                 f"- **Gọi:** `{req['method']} {req['url']}`\n",
                 f"- **Quyền:** {role}.\n",
                 f"- **HTTP mong đợi:** `{expected}`.\n"]
    saves = re.findall(r'collectionVariables.set\("(\w+)", pm.response.json\(\).(\w+)\)', script)
    if saves:
        sections.append('- **Lưu cho ca sau:** ' + '; '.join(f'`{a}` lấy từ `{b}` trong response' for a,b in saves) + '.\n')
    meanings = {201:'Tạo thành công; kiểm tra ID và dữ liệu được lưu đúng.',
                204:'Thành công, response body rỗng.',
                401:'Không được xác thực; không trả dữ liệu riêng tư.',
                403:'Đã nhận diện người dùng nhưng không có quyền thực hiện.',
                409:'Xung đột nghiệp vụ; không có tác dụng ghi dữ liệu dở dang.',
                422:'Dữ liệu đầu vào bị từ chối; kiểm tra trường được nêu trong detail.'}
    sections.append('- **Đối chiếu:** ' + meanings.get(expected,'Kiểm tra JSON trả về theo chức năng trong bảng mục D.') + '\n\n')
    if 'body' in req:
        sections.append('**Body JSON**\n\n```json\n' + req['body']['raw'] + '\n```\n\n')
    for line in item['event'][0]['script']['exec']:
        if 'Server total' in line:
            sections.append('**Kiểm tra thêm:** ' + ('Tổng 1.950.000 VND.' if '1950000' in line else 'Tổng 750.000 VND.') + '\n\n')

sections.append('''## F Ma trận kiểm thử lỗi mở rộng

Các ca dưới đây bổ sung cho 87 request của collection; chưa được tự động hóa toàn bộ.
Ghi kết quả thực tế và bằng chứng trước khi đánh dấu PASS. Nếu hệ thống trả sai thì ghi FAIL,
không sửa tiêu chí chỉ để khớp response hiện tại.

| Mã | Chức năng và cách thử | Kết quả cần đạt |
| --- | --- | --- |
| EXT01 | Đăng ký lại email với chữ hoa hoặc khoảng trắng đầu/cuối | 409 sau chuẩn hóa; không thêm tài khoản |
| EXT02 | Login sai mật khẩu; token sai chữ ký/hết hạn | 401, không có token hoặc dữ liệu riêng |
| EXT03 | ADMIN khóa tài khoản khách rồi khách gọi me bằng token cũ | Bị từ chối |
| EXT04 | Đăng ký gửi thêm role ADMIN/status LOCKED | Không được tạo ADMIN; kết quả CUSTOMER ACTIVE hoặc từ chối trường |
| EXT05 | Khách gọi PUT/DELETE users | 403 |
| EXT06 | Hai kết nối đăng ký cùng email | Một thành công, một 409, chỉ một tài khoản |
| EXT07 | Danh mục A làm cha B rồi gán B làm cha A | 409, cây không có chu trình |
| EXT08 | Tạo trùng tên hoặc slug môn/loại/hãng | 409 |
| EXT09 | Kích hoạt sản phẩm không có SKU/ảnh chính | 409 |
| EXT10 | Tạo hàng CU thiếu mô tả hao mòn | 422 |
| EXT11 | SKU giá âm/tồn âm/LO=1/CHIEC=2 | 422 hoặc 409; không ghi dữ liệu sai |
| EXT12 | SKU khác mã nhưng trùng size/color/unit/quantity_per_lot sau chuẩn hóa | 409 |
| EXT13 | Thay ảnh chính | Sau commit đúng một ảnh chính, không trùng |
| EXT14 | Bộ lọc tìm kiếm min_price > max_price | 422 |
| EXT15 | page=0, page_size=101, sort không hợp lệ | 422 |
| EXT16 | Chuyển sản phẩm INACTIVE rồi tra cứu công khai | Không xuất hiện trong tìm kiếm; chi tiết 404 |
| EXT17 | Khách A tạo đơn; khách B dùng order_id của A | 404, không lộ địa chỉ/điện thoại |
| EXT18 | Hai khách cùng checkout SKU tồn 1 | Một thành công, một xung đột; tồn bằng 0 |
| EXT19 | Gửi hai checkout đồng thời trên cùng giỏ | Chỉ một đơn; lần còn lại giỏ rỗng hoặc xung đột |
| EXT20 | Hai yêu cầu hủy cùng một đơn đồng thời | Hoàn kho đúng một lần |
| EXT21 | Gây lỗi ghi chi tiết đơn giữa transaction | Không tồn tại đơn dở dang; kho và giỏ khôi phục |
| EXT22 | ADMIN đi PENDING → CONFIRMED → SHIPPING → COMPLETED | Đúng luồng; không trừ kho lại mỗi bước |
| EXT23 | Khách hủy CONFIRMED hoặc ADMIN hủy SHIPPING | 409 |
| EXT24 | Đặt ca trong quá khứ/sân bảo trì/ca INACTIVE | 409 |
| EXT25 | Gửi court_id không khớp court_slot_id | 422 |
| EXT26 | Hai khách đặt cùng sân/ca/ngày đồng thời | Chỉ một booking giữ chỗ, lần kia 409 |
| EXT27 | Hai ADMIN xác nhận cùng booking đồng thời | Chỉ một chuyển trạng thái có hiệu lực |
| EXT28 | Sửa giờ ca có booking tương lai giữ chỗ | 409 |
| EXT29 | Tạo hai ca liền kề 06–08 và 08–10 | Thành công; không coi là chồng giờ |
| EXT30 | Khách B sửa/đóng bài hoặc hủy booking của A | 404/403, dữ liệu của A giữ nguyên |
| EXT31 | Bài ghép kèo quá giờ/đã CLOSED | Không xuất hiện danh sách OPEN mặc định |
| EXT32 | Thu mua images=[] hoặc hơn 5 URL | 422 |
| EXT33 | Chuyển OFFERED không có offered_price | 422 |
| EXT34 | Khách B phản hồi giá thu mua của A | 404/403 |
| EXT35 | ADMIN hoàn tất yêu cầu PENDING/OFFERED/REJECTED | 409; chỉ ACCEPTED được COMPLETED |
| EXT36 | Khách gửi offered_price khi chấp nhận | 422; không thay đổi giá ADMIN đã đưa |

## G Kiểm tra database sau giao dịch

Dùng các ID của lần chạy trong Postman Variables; không dùng ID ví dụ cho database thật.

```sql
SELECT id, email, role, status FROM users WHERE email = 'longlong@gmail.com';
SELECT id, product_id, sku_code, stock, unit, quantity_per_lot FROM product_skus WHERE id = <sku_id>;
SELECT * FROM carts WHERE user_id = <customer_id>;
SELECT * FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = <customer_id>);
SELECT id, order_code, user_id, total_amount, shipping_fee, status FROM orders WHERE id = <order_id>;
SELECT * FROM order_items WHERE order_id = <order_id>;
SELECT id, court_id, court_slot_id, booking_date, price_at_booking, status FROM court_bookings WHERE court_id = <court_id>;
SELECT id, user_id, status, offered_price FROM buyback_requests WHERE id = <buyback_id>;
```

Các `<...>` là chỗ thay ID trước khi chạy SQL. Bộ truy vấn không chạy nguyên văn khi chưa thay.
Sau khi hủy đơn mẫu, tồn SKU phải trở về 20. Dòng đơn giữ nguyên giá chốt, tình trạng CU và số lượng 3.
Thu mua COMPLETED không tự tạo sản phẩm hoặc cộng tồn kho.

## H Cách ghi bằng chứng và xử lý lỗi

Với mỗi ca, ghi: mã TC, ngày chạy, người thực hiện, role, method/URL, body, HTTP thực tế,
nội dung response, PASS/FAIL và ghi chú. Chụp Swagger/Postman để thấy cả request và response;
che token, password_hash và thông tin ngoài bộ dữ liệu test. Export Run Results nếu phiên bản Postman hỗ trợ.

| Hiện tượng | Kiểm tra |
| --- | --- |
| Connection refused | Backend chưa chạy hoặc base_url sai |
| 401 ngoài ca dự kiến | Đăng nhập lại, kiểm tra token và tài khoản ACTIVE; restart có thể làm token cũ hết hiệu lực |
| 403 | Chọn đúng token Admin/Customer |
| 404 theo ID biến | Ca tạo trước chưa chạy hoặc thất bại |
| 409 ngoài ca dự kiến | Xem detail; email/slug trùng, dữ liệu tham chiếu hoặc giao dịch không còn đúng trạng thái |
| 422 | Xem detail; ID phải là số, quantity nguyên, enum đúng chữ và đủ trường bắt buộc |
| 500 | Ghi log backend, request và mã TC; không đánh dấu đạt |
| Health 503 | Kiểm tra MySQL và cấu hình backend/.env |

## I Phạm vi và trạng thái xác minh

Tài khoản Admin đã được xác minh bằng login và me trên API đang chạy.
Bộ 87 request đã được chạy lại theo chuỗi trên database MySQL tạm với tài khoản Admin
Long Long theo thông tin trong collection; toàn bộ mã HTTP mong đợi đều đạt.
Đây không phải chứng nhận mọi bất biến, đồng thời hoặc yêu cầu phi chức năng đều đạt.

Các ảnh example.com là URL minh họa; không có kiểm thử nội dung tệp, upload hoặc ảnh hiển thị thực tế.
API items là dữ liệu mẫu của ứng dụng, không thuộc 16 bảng SRS. Collection không tự sửa schema cũ.
Nhóm API trong Swagger dùng catalog-sports/categories/brands/products/skus/images/menu;
việc đổi tag không đổi URL hoặc payload.

Các hạn chế cần theo dõi khi nghiệm thu: chưa có bằng chứng tự động toàn bộ ca EXT;
thu hồi token dùng kho SQLite cục bộ nên cần kho dùng chung nếu triển khai nhiều máy chủ;
không suy ra đạt kiểm thử tải, bảo mật tệp hoặc toàn bộ SRS chỉ từ bộ ca này.
''')
out = root / 'HUONG_DAN_TEST_API_A_Z.md'
out.write_text(''.join(sections), encoding='utf-8')
print(f'Guide: {len(collection["item"])} detailed cases plus 36 extended cases -> {out}')
