"""Build the single importable API test-data deliverable."""
import json
from pathlib import Path

items = []
def add(name, method, path, body=None, role='admin', expected=200, save=None, tests=None):
    request = {'method':method, 'header':[], 'url':'{{base_url}}'+path}
    if role:
        request['auth'] = {'type':'bearer','bearer':[{'key':'token','value':'{{'+role+'_token}}','type':'string'}]}
    else:
        request['auth'] = {'type':'noauth'}
    if body is not None:
        request['header'] = [{'key':'Content-Type','value':'application/json'}]
        request['body'] = {'mode':'raw','raw':json.dumps(body,ensure_ascii=False,indent=2),'options':{'raw':{'language':'json'}}}
    script = [f'pm.test("HTTP {expected}", () => pm.response.to.have.status({expected}));']
    if save:
        for variable, field in save.items():
            script.append(f'if (pm.response.code < 300) pm.collectionVariables.set("{variable}", pm.response.json().{field});')
    script += tests or []
    items.append({'name':f'{len(items)+1:02d} {name}', 'request':request,
                  'event':[{'listen':'test','script':{'type':'text/javascript','exec':script}}]})

add('Health','GET','/api/health',role=None)
add('Admin login','POST','/api/auth/login',{'email':'{{admin_email}}','password':'{{admin_password}}'},None,save={'admin_token':'access_token'})
user={'email':'test.{{run_id}}@example.com','password':'Test@12345','full_name':'Khách kiểm thử API','phone':'0901234567','address':'12 Nguyễn Trãi, Hà Nội'}
add('Register customer','POST','/api/auth/register',user,None,201,{'customer_id':'id'})
add('Duplicate email','POST','/api/auth/register',user,None,409)
add('Customer login','POST','/api/auth/login',{'email':user['email'],'password':user['password']},None,save={'customer_token':'access_token'})
add('Current customer','GET','/api/auth/me',role='customer')
add('Anonymous denied','GET','/api/users',role=None,expected=401)
add('Customer cannot list users','GET','/api/users',role='customer',expected=403)
add('Admin lists users','GET','/api/users')
add('Customer detail','GET','/api/users/{{customer_id}}')
admin_user={**user,'email':'managed.{{run_id}}@example.com','role':'CUSTOMER','status':'ACTIVE'}
add('Admin creates managed user','POST','/api/users',admin_user,expected=201,save={'managed_user_id':'id'})
add('Admin edits managed user','PUT','/api/users/{{managed_user_id}}',{'full_name':'Người dùng đã cập nhật'})
add('Admin removes managed user','DELETE','/api/users/{{managed_user_id}}',expected=204)
for plural,label in [('sports','Môn kiểm thử'),('categories','Loại kiểm thử'),('brands','Hãng kiểm thử')]:
    var={'sports':'sport_id','categories':'category_id','brands':'brand_id'}[plural]
    data={'name':label+' {{run_id}}','slug':plural+'-{{run_id}}','status':'ACTIVE'}
    if plural=='categories': data['parent_id']=None
    add('Create '+plural,'POST','/api/'+plural,data,expected=201,save={var:'id'})
    add('List '+plural,'GET','/api/'+plural,role=None)
    add('Update '+plural,'PUT','/api/'+plural+'/{{'+var+'}}',data)
product={'sport_id':'{{sport_id}}','category_id':'{{category_id}}','brand_id':'{{brand_id}}','name':'Vợt thử nghiệm {{run_id}}','description':'Dữ liệu test tự tạo, có thể ẩn sau kiểm thử','specifications':{'material':'Carbon','weight':'85g'},'condition_type':'CU','wear_description':'Xước nhẹ tại khung, không nứt','status':'INACTIVE'}
add('Create inactive product','POST','/api/products',product,expected=201,save={'product_id':'id'})
sku={'sku_code':'TEST-{{run_id}}','size':'4U','color':'Đen','price':250000,'stock':20,'unit':'CHIEC','quantity_per_lot':1}
add('Create SKU','POST','/api/products/{{product_id}}/skus',sku,expected=201,save={'sku_id':'id'})
add('Update SKU','PUT','/api/products/{{product_id}}/skus/{{sku_id}}',sku)
lot={**sku,'sku_code':'LOT-{{run_id}}','size':'Hộp 12','price':600000,'unit':'LO','quantity_per_lot':12}
add('Create lot SKU','POST','/api/products/{{product_id}}/skus',lot,expected=201,save={'lot_sku_id':'id'})
add('Product image','POST','/api/products/{{product_id}}/images',{'image_url':'https://example.com/test-racket.png','is_primary':True,'sort_order':0},expected=201)
add('Activate product','PUT','/api/products/{{product_id}}',{**product,'status':'ACTIVE'})
add('Product detail','GET','/api/products/{{product_id}}',role=None)
add('Search products','GET','/api/products?q=V%E1%BB%A3t&sport_id={{sport_id}}&category_id={{category_id}}&brand_id={{brand_id}}&condition_type=CU&min_price=0&max_price=1000000&sort=price_asc&page=1&page_size=20',role=None)
add('Menu','GET','/api/menu',role=None)
add('Reject referenced category delete','DELETE','/api/categories/{{category_id}}',expected=409)
add('Add SKU to cart','POST','/api/cart/items/{{sku_id}}',{'quantity':1},'customer')
add('Merge same SKU','POST','/api/cart/items/{{sku_id}}',{'quantity':1},'customer')
add('Change quantity','PUT','/api/cart/items/{{sku_id}}',{'quantity':3},'customer')
add('Reject overstock','PUT','/api/cart/items/{{sku_id}}',{'quantity':999999},'customer',409)
add('Reject fractional quantity','PUT','/api/cart/items/{{sku_id}}',{'quantity':1.5},'customer',422)
add('Add lot to cart','POST','/api/cart/items/{{lot_sku_id}}',{'quantity':2},'customer')
add('Cart with lot pricing','GET','/api/cart',role='customer',tests=['pm.test("Server total is 1950000", () => pm.expect(Number(pm.response.json().total_amount)).to.eql(1950000));'])
add('Remove lot from cart','DELETE','/api/cart/items/{{lot_sku_id}}',role='customer',expected=204)
checkout={'receiver_name':'Nguyễn Kiểm Thử','receiver_phone':'0901234567','shipping_address':'12 Nguyễn Trãi, Hà Nội'}
add('Checkout COD','POST','/api/orders',checkout,'customer',201,{'order_id':'id'},['pm.test("Server total is 750000", () => pm.expect(Number(pm.response.json().total_amount)).to.eql(750000));'])
add('Cannot checkout empty cart','POST','/api/orders',checkout,'customer',409)
add('My orders','GET','/api/orders',role='customer')
add('Order detail','GET','/api/orders/{{order_id}}',role='customer')
add('Cancel pending order','PATCH','/api/orders/{{order_id}}/status',{'status':'CANCELLED'},'customer')
add('Repeated cancel rejected','PATCH','/api/orders/{{order_id}}/status',{'status':'CANCELLED'},'customer',409)
add('Cannot delete SKU with order history','DELETE','/api/products/{{product_id}}/skus/{{sku_id}}',expected=409)
add('Delete unused lot SKU','DELETE','/api/products/{{product_id}}/skus/{{lot_sku_id}}')
court={'sport_id':'{{sport_id}}','name':'Sân test {{run_id}}','address':'12 Nguyễn Trãi, Hà Nội','description':'Sân dữ liệu kiểm thử','status':'ACTIVE'}
add('Create court','POST','/api/courts',court,expected=201,save={'court_id':'id'})
add('Update court','PUT','/api/courts/{{court_id}}',court)
slot={'court_id':'{{court_id}}','slot_name':'Ca sáng','start_time':'06:00:00','end_time':'08:00:00','price':150000,'status':'ACTIVE'}
add('Create slot','POST','/api/slots',slot,expected=201,save={'slot_id':'id'})
add('Update slot','PUT','/api/slots/{{slot_id}}',slot)
add('Reject overlapping slot','POST','/api/slots',{**slot,'start_time':'07:00:00','end_time':'09:00:00'},expected=409)
add('List courts','GET','/api/courts/',role=None)
add('List slots','GET','/api/slots/?court_id={{court_id}}',role=None)
add('Check availability','GET','/api/availability?court_id={{court_id}}&booking_date=2099-01-01',role=None)
booking={'court_id':'{{court_id}}','court_slot_id':'{{slot_id}}','booking_date':'2099-01-01'}
add('Create booking','POST','/api/bookings',booking,'customer',201,{'booking_id':'id'})
add('Reject duplicate booking','POST','/api/bookings',booking,'customer',409)
add('My bookings','GET','/api/bookings',role='customer')
add('Admin confirms booking','PATCH','/api/bookings/{{booking_id}}/status',{'status':'XAC_NHAN'})
add('Customer cancels before start','PATCH','/api/bookings/{{booking_id}}/status',{'status':'HUY'},'customer')
add('Rebook released slot','POST','/api/bookings',booking,'customer',201,{'booking_id':'id'})
add('Admin rejects booking','PATCH','/api/bookings/{{booking_id}}/status',{'status':'TU_CHOI'})
match={'sport_id':'{{sport_id}}','match_time':'2099-01-02T18:00:00','location':'Sân test','skill_level':'Trung bình','contact_info':'0901234567'}
add('Create match post','POST','/api/match-posts',match,'customer',201,{'match_id':'id'})
add('Edit match post','PUT','/api/match-posts/{{match_id}}',{**match,'skill_level':'Khá'},'customer')
add('List open matches','GET','/api/match-posts?sport_id={{sport_id}}',role=None)
add('Close match post','PATCH','/api/match-posts/{{match_id}}/status',{'status':'CLOSED'},'customer')
buyback={'sport_id':'{{sport_id}}','brand_model':'Vợt Carbon test','condition_detail':'Cũ 90%, không nứt','expected_price':200000,'images':['https://example.com/used-racket.png']}
add('Create buyback request','POST','/api/buyback-requests',buyback,'customer',201,{'buyback_id':'id'})
add('List own buyback requests','GET','/api/buyback-requests',role='customer')
add('Admin offers price','PATCH','/api/buyback-requests/{{buyback_id}}/status',{'status':'OFFERED','offered_price':180000})
add('Customer accepts price','PATCH','/api/buyback-requests/{{buyback_id}}/status',{'status':'ACCEPTED'},'customer')
add('Admin completes buyback','PATCH','/api/buyback-requests/{{buyback_id}}/status',{'status':'COMPLETED'})
add('Hide test product','DELETE','/api/products/{{product_id}}')
for plural in ('sports','categories','brands'):
    data={'name':'Dữ liệu xóa '+plural+' {{run_id}}','slug':'delete-'+plural+'-{{run_id}}'}
    add('Create disposable '+plural,'POST','/api/'+plural,data,expected=201,save={'delete_id':'id'})
    add('Delete disposable '+plural,'DELETE','/api/'+plural+'/{{delete_id}}')
add('Create sample item','POST','/api/items',{'name':'Item test {{run_id}}','description':'Test API mẫu','price':10000},expected=201,save={'item_id':'id'})
add('List sample items','GET','/api/items')
add('Read sample item','GET','/api/items/{{item_id}}')
add('Update sample item','PUT','/api/items/{{item_id}}',{'name':'Item đã sửa','price':12000})
add('Delete sample item','DELETE','/api/items/{{item_id}}',expected=204)
add('Logout customer','POST','/api/auth/logout',role='customer',expected=204)
add('Logged-out token denied','GET','/api/auth/me',role='customer',expected=401)
add('Root','GET','/',role=None)
variables={'base_url':'http://127.0.0.1:8000','admin_email':'admin@sportstore.vn','admin_password':'Admin@123','admin_token':'','customer_token':'','run_id':''}
for key in ('customer_id','managed_user_id','sport_id','category_id','brand_id','product_id','sku_id','lot_sku_id','order_id','court_id','slot_id','booking_id','match_id','buyback_id','delete_id','item_id'):
    variables[key]=''
collection={'info':{'name':'Shop Thể Thao — Toàn bộ dữ liệu kiểm thử API',
    'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    'description':'Chạy Collection Runner từ đầu theo thứ tự. Chỉ dùng database phát triển/test: bộ này tạo tài khoản, sản phẩm, đơn và giao dịch, có các ca lỗi mong đợi 401/403/409/422. Đổi admin_email/admin_password nếu cần. Token và ID tự lưu. Không dùng dữ liệu ID seed. Ảnh example.com chỉ là URL minh họa, không chứng minh upload ảnh. Các endpoint chưa triển khai không có trong collection. Test chưa chứng minh đồng thời hoặc hiệu năng. Dữ liệu lịch sử còn được giữ sau chạy theo quy tắc không xóa giao dịch.'},
    'variable':[{'key':key,'value':value,'type':'string'} for key,value in variables.items()],
    'event':[{'listen':'prerequest','script':{'type':'text/javascript','exec':[
        'if (pm.info.requestName.startsWith("01 ")) pm.collectionVariables.set("run_id", Date.now().toString()+Math.floor(Math.random()*10000));',
        '// Render numeric ID variables as JSON numbers before sending.',
        'if (pm.request.body && pm.request.body.mode === "raw") {',
        '  const raw = pm.variables.replaceIn(pm.request.body.raw);',
        '  pm.request.body.update(raw.replace(/"(\\d+)"(?=\\s*[,}])/g, "$1"));',
        '}']}}], 'item':items}
# Only ID fields are numeric: do not alter phone or password strings.
collection['event'][0]['script']['exec'][-2] = '  pm.request.body.update(raw.replace(/("(?:[a-z_]*_id)")\\s*:\\s*"(\\d+)"/g, "$1: $2"));'
out=Path(__file__).resolve().parents[2]/'ShopTheThao_API_Test.postman_collection.json'
out.write_text(json.dumps(collection,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(items)} requests -> {out}')
