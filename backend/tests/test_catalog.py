"""Isolated HTTP integration tests; never connect to the real MySQL database."""
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Integer, create_engine, delete, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import models
from app.core.security import hash_password
from app.db.session import Base, get_db
from app.models.catalog import Brand, Category, Product, Sport
from app.models.user import User, UserRole, UserStatus
from app.routers.catalog import router


class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = hash_password("Test-password-123")

    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})

        @event.listens_for(self.engine, "connect")
        def enable_foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")

        # SQLite requires INTEGER (not BIGINT) for auto-increment primary keys.
        self.metadata = Base.metadata.__class__()
        for table in Base.metadata.sorted_tables:
            copy = table.to_metadata(self.metadata)
            for column in copy.primary_key:
                if column.type.__class__.__name__ == "BigInteger":
                    column.type = Integer()
        self.metadata.create_all(self.engine)
        with Session(self.engine) as db:
            db.add_all([
                User(id=1, email="admin@test.vn", password_hash=self.password_hash,
                     full_name="Admin", phone="0900000000", role=UserRole.ADMIN, status=UserStatus.ACTIVE),
                User(id=2, email="customer@test.vn", password_hash=self.password_hash,
                     full_name="Customer", phone="0900000001", role=UserRole.CUSTOMER, status=UserStatus.ACTIVE),
            ])
            db.commit()
        app = FastAPI()
        app.include_router(router, prefix="/api")

        def override_db():
            with Session(self.engine) as db:
                yield db

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app)
        self.auth = ("admin@test.vn", "Test-password-123")

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def create(self, resource, name, slug, **extra):
        response = self.client.post(f"/api/{resource}", json={"name": name, "slug": slug, **extra}, auth=self.auth)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_crud_all_resources(self):
        for resource in ("sports", "categories", "brands"):
            with self.subTest(resource=resource):
                record = self.create(resource, "  Test   Name  ", "test-name")
                self.assertEqual(record["name"], "Test Name")
                path = f"/api/{resource}/{record['id']}"
                self.assertEqual(self.client.get(path).status_code, 200)
                self.assertEqual(len(self.client.get(f"/api/{resource}?q=Test&limit=1").json()), 1)
                updated = self.client.put(path, json={"name": "Updated"}, auth=self.auth)
                self.assertEqual(updated.status_code, 200, updated.text)
                self.assertEqual(updated.json()["slug"], "test-name")
                self.assertEqual(self.client.delete(path, auth=self.auth).status_code, 204)
                self.assertEqual(self.client.get(path).status_code, 404)

    def test_duplicate_names_slugs_and_update(self):
        for resource in ("sports", "categories", "brands"):
            self.create(resource, "First", "first")
            second = self.create(resource, "Second", "second")
            for payload in ({"name": "first", "slug": "third"}, {"name": "Third", "slug": "first"}):
                self.assertEqual(self.client.post(f"/api/{resource}", json=payload, auth=self.auth).status_code, 409)
            self.assertEqual(self.client.put(f"/api/{resource}/{second['id']}", json={"name": "FIRST"}, auth=self.auth).status_code, 409)
            self.assertEqual(self.client.put(f"/api/{resource}/{second['id']}", json={"name": "Second"}, auth=self.auth).status_code, 200)

    def test_hierarchy_and_delete_guards(self):
        root = self.create("categories", "Root", "root")
        child = self.create("categories", "Child", "child", parent_id=root["id"])
        grandchild = self.create("categories", "Leaf", "leaf", parent_id=child["id"])
        path = f"/api/categories/{root['id']}"
        for parent_id in (root["id"], grandchild["id"]):
            self.assertEqual(self.client.put(path, json={"parent_id": parent_id}, auth=self.auth).status_code, 409)
        self.assertEqual(self.client.delete(path, auth=self.auth).status_code, 409)
        self.assertEqual(self.client.get("/api/categories/tree").json()[0]["children"][0]["id"], child["id"])
        self.assertEqual(self.client.post("/api/categories", json={"name": "Missing", "slug": "missing", "parent_id": 999}, auth=self.auth).status_code, 404)
        self.assertEqual(self.client.put(f"/api/categories/{child['id']}", json={"parent_id": None}, auth=self.auth).status_code, 200)

    def seed_product(self, **extra):
        sport = self.create("sports", "Badminton", "badminton")
        category = self.create("categories", "Rackets", "rackets")
        brand = self.create("brands", "Yonex", "yonex")
        with Session(self.engine) as db:
            db.add(Product(id=1, name="Racket", sport_id=sport["id"], category_id=category["id"], brand_id=brand["id"], **extra))
            db.commit()
        return sport, category, brand

    def test_products_block_deletion_including_inactive(self):
        sport, category, brand = self.seed_product(status="INACTIVE")
        for resource, record in (("sports", sport), ("categories", category), ("brands", brand)):
            self.assertEqual(self.client.delete(f"/api/{resource}/{record['id']}", auth=self.auth).status_code, 409)

    def test_menu_brands_roll_up_and_are_distinct(self):
        sport, category, brand = self.seed_product()
        parent = self.create("categories", "Equipment", "equipment")
        self.client.put(f"/api/categories/{category['id']}", json={"parent_id": parent["id"]}, auth=self.auth)
        with Session(self.engine) as db:
            db.add(Product(id=2, name="Another racket", sport_id=sport["id"], category_id=category["id"], brand_id=brand["id"]))
            db.commit()
        tree = self.client.get(f"/api/menu?sport_id={sport['id']}").json()
        self.assertEqual([item["id"] for item in tree[0]["brands"]], [brand["id"]])
        self.assertEqual(len(tree[0]["children"][0]["brands"]), 1)
        self.client.put(f"/api/brands/{brand['id']}", json={"status": "INACTIVE"}, auth=self.auth)
        self.assertEqual(self.client.get("/api/menu").json()[0]["brands"], [])
        self.assertEqual(self.client.get("/api/menu?sport_id=999").status_code, 404)

    def test_authentication_and_authorization(self):
        payload = {"name": "Test", "slug": "test"}
        self.assertEqual(self.client.post("/api/sports", json=payload).status_code, 401)
        self.assertEqual(self.client.post("/api/sports", json=payload, auth=("admin@test.vn", "wrong")).status_code, 401)
        self.assertEqual(self.client.post("/api/sports", json=payload, auth=("customer@test.vn", "Test-password-123")).status_code, 403)
        with Session(self.engine) as db:
            db.get(User, 1).status = UserStatus.LOCKED
            db.commit()
        self.assertEqual(self.client.post("/api/sports", json=payload, auth=self.auth).status_code, 403)

    def test_validation(self):
        record = self.create("sports", "Sport", "sport")
        for payload in ({"name": "  ", "slug": "valid"}, {"name": "Name", "slug": "BAD SLUG"}, {"name": "x" * 101, "slug": "long"}):
            self.assertEqual(self.client.post("/api/sports", json=payload, auth=self.auth).status_code, 422)
        for field in ("name", "slug", "status"):
            self.assertEqual(self.client.put(f"/api/sports/{record['id']}", json={field: None}, auth=self.auth).status_code, 422)
        self.assertEqual(self.client.get("/api/sports?limit=501").status_code, 422)
        self.assertEqual(self.client.put("/api/brands/999", json={}, auth=self.auth).status_code, 404)

    def test_openapi(self):
        schema = self.client.get("/openapi.json").json()
        self.assertIn("/api/menu", schema["paths"])
        self.assertIn("security", schema["paths"]["/api/brands"]["post"])

    def test_database_constraints(self):
        parent = self.create("categories", "Parent", "parent")
        self.create("categories", "Child", "child", parent_id=parent["id"])
        with Session(self.engine) as db:
            with self.assertRaises(IntegrityError):
                db.execute(delete(Category).where(Category.id == parent["id"]))
                db.commit()
            db.rollback()
            db.add(Category(name="Parent", slug="different"))
            with self.assertRaises(IntegrityError):
                db.commit()
            db.rollback()

    def test_inactive_branches_and_products_hidden_from_menu(self):
        sport, category, brand = self.seed_product(status="INACTIVE")
        self.assertEqual(self.client.get("/api/menu").json()[0]["brands"], [])
        child = self.create("categories", "Child", "child", parent_id=category["id"])
        self.client.put(f"/api/categories/{category['id']}", json={"status": "INACTIVE"}, auth=self.auth)
        self.assertEqual(self.client.get("/api/menu").json(), [])
        self.assertEqual(self.client.get("/api/categories/tree?status=ACTIVE").json(), [])

    def test_sport_reference_guard(self):
        from app.models.court import Court

        sport = self.create("sports", "Football", "football")
        with Session(self.engine) as db:
            db.add(Court(id=1, sport_id=sport["id"], name="Court", address="Test", description=None))
            db.commit()
        self.assertEqual(self.client.delete(f"/api/sports/{sport['id']}", auth=self.auth).status_code, 409)


if __name__ == "__main__":
    unittest.main()