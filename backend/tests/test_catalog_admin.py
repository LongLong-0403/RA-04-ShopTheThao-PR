"""Isolated API regression tests; never connect to the real MySQL database."""
import base64
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import BigInteger, create_engine, event, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.mysql import TINYINT

from app import models
from app.core.deps import require_admin
from app.db.session import Base, get_db
from app.routers import catalog


@compiles(BigInteger, 'sqlite')
@compiles(TINYINT, 'sqlite')
def sqlite_integer(type_, compiler, **kwargs):
    return 'INTEGER'


class CatalogAdminTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        @event.listens_for(self.engine, 'connect')
        def foreign_keys(connection, _):
            connection.execute('PRAGMA foreign_keys=ON')
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, autoflush=False)
        self.db.add_all([
            models.Sport(id=1, name='Cầu lông', slug='cau-long'),
            models.Category(id=1, name='Vợt', slug='vot'),
            models.Category(id=2, name='Cầu', slug='cau'),
            models.Category(id=3, name='Giày', slug='giay'),
            models.Brand(id=1, name='Demo', slug='demo'),
        ])
        self.db.commit()
        app = FastAPI()
        app.include_router(catalog.router, prefix='/api')
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[require_admin] = lambda: object()
        self.app = app
        self.client = TestClient(app)
        self.temp = TemporaryDirectory()
        self.old_upload_dir = catalog.UPLOAD_DIR
        catalog.UPLOAD_DIR = Path(self.temp.name)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()
        catalog.UPLOAD_DIR = self.old_upload_dir
        self.temp.cleanup()

    def product(self, **changes):
        data = dict(sport_id=1, category_id=3, brand_id=1, name='Demo', status='INACTIVE')
        data.update(changes)
        result = self.client.post('/api/products', json=data)
        self.assertEqual(result.status_code, 201, result.text)
        return result.json()['id'], data

    def sku(self, pid, **changes):
        data = dict(sku_code='SKU-1', price='100000', stock=1, unit='CHIEC', quantity_per_lot=1)
        data.update(changes)
        return self.client.post(f'/api/products/{pid}/skus', json=data)

    def test_draft_activation_stock_and_hide(self):
        pid, data = self.product()
        data['status'] = 'ACTIVE'
        self.assertEqual(self.client.put(f'/api/products/{pid}', json=data).status_code, 409)
        sku = self.sku(pid).json()
        image = self.client.post(f'/api/products/{pid}/images', json={'image_url': 'https://example.com/a.png'}).json()
        self.assertTrue(image['is_primary'])
        self.assertEqual(self.client.put(f'/api/products/{pid}', json=data).json()['status'], 'ACTIVE')
        sku_data = {key: sku[key] for key in catalog.SkuInput.model_fields}
        sku_data['stock'] = 0
        self.assertEqual(self.client.put(f'/api/products/{pid}/skus/{sku["id"]}', json=sku_data).status_code, 200)
        self.assertEqual(self.client.get(f'/api/admin/products/{pid}').json()['product']['status'], 'OUT_OF_STOCK')
        self.client.delete(f'/api/products/{pid}')
        sku_data['stock'] = 2
        self.client.put(f'/api/products/{pid}/skus/{sku["id"]}', json=sku_data)
        self.assertEqual(self.client.get(f'/api/admin/products/{pid}').json()['product']['status'], 'INACTIVE')
        self.assertEqual(self.client.get(f'/api/products/{pid}').status_code, 404)

    def test_used_racket_and_ball(self):
        pid, _ = self.product(category_id=1, condition_type='CU', wear_description='Xước nhẹ')
        self.assertEqual(self.sku(pid, stock=2).status_code, 422)
        self.assertEqual(self.sku(pid).status_code, 201)
        self.assertEqual(self.sku(pid, sku_code='SKU-2', color='Đỏ').status_code, 422)
        ball, _ = self.product(category_id=2, condition_type='CU', wear_description='Đã tập')
        self.assertEqual(self.sku(ball, sku_code='BALL').status_code, 422)
        self.assertEqual(self.sku(ball, sku_code='BALL', unit='LO', quantity_per_lot=12, stock=3).status_code, 201)

    def test_duplicates_and_invalid_inputs(self):
        pid, _ = self.product()
        self.assertEqual(self.sku(pid, size=' M ', color='RED').status_code, 201)
        self.assertEqual(self.sku(pid, sku_code='OTHER', size='m', color=' red ').status_code, 409)
        self.assertEqual(self.sku(pid, unit='LO', quantity_per_lot=1).status_code, 422)
        self.assertEqual(self.sku(pid, stock=-1).status_code, 422)
        self.assertEqual(self.client.post('/api/products', json=dict(sport_id=1, category_id=1, brand_id=1, name=' ', condition_type='CU')).status_code, 422)

    def test_images_upload_and_primary(self):
        pid, data = self.product()
        self.sku(pid)
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        result = self.client.post(f'/api/products/{pid}/images/upload', content=png, headers={'Content-Type': 'image/png'})
        self.assertEqual(result.status_code, 201, result.text)
        self.assertEqual(len(list(catalog.UPLOAD_DIR.iterdir())), 1)
        self.assertEqual(self.client.post(f'/api/products/{pid}/images/upload', content=b'fake', headers={'Content-Type': 'image/png'}).status_code, 422)
        self.assertEqual(self.client.post(f'/api/products/{pid}/images/upload', content=b'x' * (5*1024*1024+1), headers={'Content-Type': 'image/png'}).status_code, 413)
        self.assertEqual(len(list(catalog.UPLOAD_DIR.iterdir())), 1)
        second = self.client.post(f'/api/products/{pid}/images', json={'image_url': 'https://example.com/b.jpg', 'is_primary': True}).json()
        images = self.client.get(f'/api/admin/products/{pid}').json()['images']
        self.assertEqual(sum(i['is_primary'] for i in images), 1)
        data['status'] = 'ACTIVE'
        self.client.put(f'/api/products/{pid}', json=data)
        self.assertEqual(self.client.delete(f'/api/products/{pid}/images/{second["id"]}').status_code, 409)

    def test_order_history_preserved(self):
        pid, _ = self.product()
        sku = self.sku(pid).json()
        user = models.User(id=1, email='test@example.com', password_hash='test', full_name='Test', phone='0900000000')
        order = models.Order(id=1, order_code='TEST-1', user_id=1, receiver_name='Test', receiver_phone='0900000000', shipping_address='Test', total_amount=100000)
        self.db.add(user)
        self.db.flush()
        self.db.add(order)
        self.db.flush()
        self.db.add(models.OrderItem(id=1, order_id=1, product_sku_id=sku['id'], quantity=1, price_at_order=100000, condition_at_order='MOI'))
        self.db.commit()
        self.assertEqual(self.client.delete(f'/api/products/{pid}/skus/{sku["id"]}').status_code, 409)
        self.assertEqual(self.client.delete(f'/api/products/{pid}').status_code, 200)
        self.assertIsNotNone(self.db.get(models.Product, pid))
        self.assertEqual(self.db.scalar(select(models.OrderItem)).price_at_order, 100000)

    def test_admin_auth_required(self):
        self.app.dependency_overrides.pop(require_admin)
        self.assertEqual(self.client.get('/api/admin/products').status_code, 401)
        self.assertEqual(self.client.post('/api/products', json={}).status_code, 401)


if __name__ == '__main__':
    unittest.main()