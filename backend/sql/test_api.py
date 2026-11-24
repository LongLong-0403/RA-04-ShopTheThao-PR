"""HTTP integration tests against a disposable, SQL-seeded MySQL database."""
import sys
from pathlib import Path
from uuid import uuid4
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db
from app.core.config import settings
from test_srs_database import statements, KW
import pymysql

def main():
    name = 'api_verify_' + uuid4().hex
    conn = pymysql.connect(**KW)
    engine = None
    try:
        with conn.cursor() as cur:
            source = Path(__file__).with_name('sport_store_demo.sql').read_text(encoding='utf-8').replace('`sport_store_db`', f'`{name}`')
            for sql in statements(source):
                cur.execute(sql)
                while cur.nextset(): pass
        engine = create_engine(settings.database_url.rsplit('/', 1)[0] + '/' + name + '?charset=utf8mb4')
        factory = sessionmaker(engine)
        def db_override():
            with factory() as db: yield db
        app.dependency_overrides[get_db] = db_override
        client = TestClient(app)  # no lifespan: never seed or alter app database
        checks = []
        def request(method, path, status=200, **kwargs):
            response = client.request(method, '/api' + path, **kwargs)
            assert response.status_code == status, (method, path, response.status_code, response.text)
            checks.append(f'{method} {path} {status}')
            return response.json() if response.content else None
        request('GET', '/users', 401)
        admin = request('POST', '/auth/login', json={'email':'admin@sportstore.vn','password':'Admin@123'})
        ah = {'Authorization':'Bearer ' + admin['access_token']}
        payload = {'email':'test@example.com','password':'Customer@123','full_name':'Test Customer','phone':'0901234567','role':'ADMIN'}
        registered = request('POST','/auth/register',201,json=payload)
        assert registered['role'] == 'CUSTOMER' and 'password_hash' not in registered
        request('POST','/auth/register',409,json=payload)
        login = request('POST','/auth/login',json={'email':payload['email'],'password':payload['password']})
        h = {'Authorization':'Bearer ' + login['access_token']}
        request('GET','/auth/me',headers=h)
        request('GET','/users',403,headers=h)
        request('GET','/users',headers=ah)
        request('GET','/products')
        request('GET','/menu')
        request('POST','/sports',403,headers=h,json={'name':'Forbidden','slug':'forbidden'})
        sport = request('POST','/sports',201,headers=ah,json={'name':'Test sport','slug':'test-sport'})
        request('POST','/sports',409,headers=ah,json={'name':'Test sport','slug':'test-sport'})
        request('POST','/cart/items/1',headers=h,json={'quantity':1})
        request('POST','/cart/items/1',headers=h,json={'quantity':1})
        cart = request('GET','/cart',headers=h)
        assert cart['items'][0]['quantity'] == 2
        request('PUT','/cart/items/1',422,headers=h,json={'quantity':1.5})
        request('PUT','/cart/items/1',409,headers=h,json={'quantity':999999})
        order = request('POST','/orders',201,headers=h,json={'receiver_name':'Test','receiver_phone':'0901234567','shipping_address':'Test address'})
        assert Decimal(str(order['total_amount'])) == Decimal(str(cart['total_amount']))
        request('POST','/orders',409,headers=h,json={'receiver_name':'Test','receiver_phone':'0901234567','shipping_address':'Test address'})
        request('GET',f"/orders/{order['id']}",headers=h)
        other_payload = {**payload, 'email': 'other@example.com'}
        request('POST','/auth/register',201,json=other_payload)
        other = request('POST','/auth/login',json={'email':other_payload['email'],'password':other_payload['password']})
        other_headers = {'Authorization': 'Bearer ' + other['access_token']}
        request('GET',f"/orders/{order['id']}",404,headers=other_headers)
        request('PATCH',f"/orders/{order['id']}/status",404,headers=other_headers,json={'status':'CANCELLED'})
        assert all(o['id'] != order['id'] for o in request('GET','/orders',headers=other_headers))
        request('GET','/auth/me',401,headers={'Authorization':'Bearer invalid-token'})
        request('PATCH',f"/orders/{order['id']}/status",headers=h,json={'status':'CANCELLED'})
        request('PATCH',f"/orders/{order['id']}/status",409,headers=h,json={'status':'CANCELLED'})
        booking = request('POST','/bookings',201,headers=h,json={'court_id':1,'court_slot_id':1,'booking_date':'2099-01-01'})
        request('PATCH',f"/bookings/{booking['id']}/status",404,headers=other_headers,json={'status':'HUY'})
        assert all(b['id'] != booking['id'] for b in request('GET','/bookings',headers=other_headers))
        request('POST','/bookings',409,headers=h,json={'court_id':1,'court_slot_id':1,'booking_date':'2099-01-01'})
        request('PATCH',f"/bookings/{booking['id']}/status",headers=ah,json={'status':'XAC_NHAN'})
        request('PATCH',f"/bookings/{booking['id']}/status",409,headers=ah,json={'status':'XAC_NHAN'})
        request('PATCH',f"/bookings/{booking['id']}/status",headers=h,json={'status':'HUY'})
        request('POST','/bookings',201,headers=h,json={'court_id':1,'court_slot_id':1,'booking_date':'2099-01-01'})
        request('POST','/slots',409,headers=ah,json={'court_id':1,'slot_name':'Overlap','start_time':'07:00','end_time':'09:00','price':100})
        b = request('POST','/buyback-requests',201,headers=h,json={'brand_model':'Test','condition_detail':'Used','expected_price':100,'images':['https://example.com/test.png']})
        request('PATCH',f"/buyback-requests/{b['id']}/status",404,headers=other_headers,json={'status':'CANCELLED'})
        assert all(r['id'] != b['id'] for r in request('GET','/buyback-requests',headers=other_headers))
        request('PATCH',f"/buyback-requests/{b['id']}/status",headers=ah,json={'status':'OFFERED','offered_price':90})
        request('PATCH',f"/buyback-requests/{b['id']}/status",headers=h,json={'status':'ACCEPTED'})
        request('PATCH',f"/buyback-requests/{b['id']}/status",headers=ah,json={'status':'COMPLETED'})
        request('POST','/auth/logout',204,headers=h)
        request('GET','/auth/me',401,headers=h)
        print('\n'.join(checks))
        print(f'PASS: {len(checks)} API checks')
    finally:
        app.dependency_overrides.clear()
        if engine: engine.dispose()
        with conn.cursor() as cur: cur.execute(f'DROP DATABASE IF EXISTS `{name}`')
        conn.close()

if __name__ == '__main__':
    from decimal import Decimal
    main()
