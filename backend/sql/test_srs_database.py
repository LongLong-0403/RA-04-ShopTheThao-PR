"""Integration checks in a unique disposable MySQL database, never the app DB.

Run from backend: .venv/Scripts/python.exe sql/test_srs_database.py
Reads connection settings from backend/.env without displaying credentials.
"""
from pathlib import Path
import sys
import uuid
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import bcrypt
import pymysql

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings

ROOT = Path(__file__).resolve().parent
DB = 'srs_verify_' + uuid.uuid4().hex
KW = dict(host=settings.DB_HOST, port=settings.DB_PORT, user=settings.DB_USER,
          password=settings.DB_PASSWORD, charset='utf8mb4', autocommit=True)


def statements(source):
    delimiter, buffer = ';', []
    for line in source.splitlines():
        if line.strip().startswith('--') or not line.strip():
            continue
        if line.startswith('DELIMITER '):
            assert not buffer
            delimiter = line.split()[1]
            continue
        buffer.append(line)
        if line.rstrip().endswith(delimiter):
            yield '\n'.join(buffer).rstrip()[:-len(delimiter)]
            buffer = []
    assert not buffer, 'Unterminated SQL statement'


def run(cur, source):
    for sql in statements(source):
        try:
            cur.execute(sql)
        except pymysql.MySQLError:
            print('Failed statement:', sql.splitlines()[0])
            raise
        while cur.nextset():
            pass


def rejected(cur, sql, code):
    try:
        cur.execute(sql)
    except pymysql.MySQLError as exc:
        assert exc.args[0] in code, (exc.args[0], sql)
    else:
        raise AssertionError('Invalid data accepted: ' + sql)


def main():
    conn = pymysql.connect(**KW)
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT VERSION()')
            print('MySQL:', cur.fetchone()[0])
            source = (ROOT / 'sport_store_demo.sql').read_text(encoding='utf-8').replace('`sport_store_db`', f'`{DB}`')
            run(cur, source)
            cur.execute('SHOW TABLES')
            tables = [r[0] for r in cur.fetchall()]
            assert len(tables) == 16
            snapshots = {}
            for table in tables:
                cur.execute(f'SELECT * FROM `{table}` ORDER BY id')
                snapshots[table] = cur.fetchall()
            counts = {t: len(rows) for t, rows in snapshots.items()}
            assert counts['users'] >= 6 and counts['products'] >= 36
            assert counts['courts'] >= 3 and counts['court_slots'] >= 12
            cur.execute("SELECT COUNT(*) FROM products WHERE condition_type='CU'")
            assert cur.fetchone()[0] >= 6
            cur.execute('SELECT role, password_hash FROM users ORDER BY id')
            hashes = cur.fetchall()
            assert len({h for _, h in hashes}) == len(hashes)
            for role, encoded in hashes:
                assert int(encoded.split('$')[2]) >= 12
                assert bcrypt.checkpw(b'Admin@123' if role == 'ADMIN' else b'Customer@123', encoded.encode())
            # Rerun after a realistic stock change: seed must not reset any rows.
            cur.execute('UPDATE product_skus SET stock=stock-1 WHERE id=1')
            cur.execute('SELECT * FROM product_skus ORDER BY id')
            snapshots['product_skus'] = cur.fetchall()
            run(cur, source)
            for table in tables:
                cur.execute(f'SELECT * FROM `{table}` ORDER BY id')
                assert cur.fetchall() == snapshots[table], table
            for sql in statements((ROOT / 'verify_srs.sql').read_text(encoding='utf-8')):
                cur.execute(sql)
                rows = cur.fetchall()
                if len(cur.description) == 2:
                    assert all(row[1] == 0 for row in rows), rows
            checks = [
                ("UPDATE product_skus SET stock=-1 WHERE id=1", [3819]),
                ("UPDATE product_skus SET quantity_per_lot=2 WHERE id=1", [3819]),
                ("UPDATE product_skus SET unit='LO',quantity_per_lot=1 WHERE id=1", [3819]),
                ("UPDATE product_images SET is_primary=1 WHERE id=2", [1062]),
                ("UPDATE products SET wear_description='' WHERE condition_type='CU' LIMIT 1", [3819]),
                ("UPDATE court_slots SET end_time=start_time WHERE id=1", [3819]),
                ("UPDATE court_bookings SET court_id=4 WHERE id=3", [1452]),
                ("UPDATE orders SET shipping_fee=100 WHERE id=1", [3819]),
                ("UPDATE buyback_requests SET images=JSON_ARRAY() WHERE id=1", [3819]),
                ("UPDATE buyback_requests SET offered_price=NULL WHERE id=1", [3819]),
                ("DELETE FROM orders WHERE id=1", [1451]),
                ("INSERT INTO order_items(order_id,product_sku_id,quantity,price_at_order,condition_at_order) SELECT order_id,product_sku_id,quantity,price_at_order,condition_at_order FROM order_items WHERE id=1", [1062]),
                ("INSERT INTO product_skus(product_id,sku_code,size,color,price,stock,unit,quantity_per_lot) SELECT product_id,'TEST-DUPLICATE',CONCAT(' ',size,' '),color,price,stock,unit,quantity_per_lot FROM product_skus WHERE id=1", [1062]),
            ]
            for sql, codes in checks:
                rejected(cur, sql, codes)
            barrier = Barrier(2)
            booking = "INSERT INTO court_bookings(user_id,court_id,court_slot_id,booking_date,price_at_booking) VALUES (2,1,1,'2099-01-01',160000)"

            def race():
                db = pymysql.connect(**KW, database=DB)
                try:
                    with db.cursor() as c:
                        barrier.wait(timeout=10)
                        try:
                            c.execute(booking)
                            return 'ok'
                        except pymysql.IntegrityError as exc:
                            assert exc.args[0] == 1062
                            return 'duplicate'
                finally:
                    db.close()

            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(lambda _: race(), range(2)))
            assert sorted(results) == ['duplicate', 'ok'], results
            cur.execute("UPDATE court_bookings SET status='HUY' WHERE booking_date='2099-01-01'")
            cur.execute(booking)
            print('Counts:', counts)
            print(f'PASS: bcrypt, full-row rerun preservation, data audit, {len(checks)} rejection checks, concurrent booking and rebooking')
    finally:
        # DB is generated above, never comes from settings or user input.
        with conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS `{DB}`')
        conn.close()


if __name__ == '__main__':
    if '--isolated-server' in sys.argv:
        binary = Path('C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe')
        data = Path(tempfile.mkdtemp(prefix='srs_mysql_'))
        command = [str(binary), '--no-defaults', f'--datadir={data}']
        subprocess.run(command + ['--initialize-insecure'], check=True,
                       creationflags=subprocess.CREATE_NO_WINDOW)
        KW.update(host='127.0.0.1', port=13386, user='root', password='')
        server = subprocess.Popen(command + ['--bind-address=127.0.0.1', '--port=13386',
                                  '--mysqlx=0'], creationflags=subprocess.CREATE_NO_WINDOW)
        own_server_ready = False
        try:
            for _ in range(60):
                if server.poll() is not None:
                    raise RuntimeError('Isolated MySQL exited; logs: ' + str(data))
                try:
                    probe = pymysql.connect(**KW)
                    try:
                        with probe.cursor() as cursor:
                            cursor.execute('SELECT @@datadir')
                            actual_data = Path(cursor.fetchone()[0]).resolve()
                            if not actual_data.samefile(data):
                                raise RuntimeError('Port 13386 is occupied by another MySQL server')
                            own_server_ready = True
                    finally:
                        probe.close()
                    break
                except pymysql.OperationalError:
                    time.sleep(0.5)
            else:
                raise RuntimeError('Isolated MySQL startup timed out')
            main()
        finally:
            if own_server_ready:
                shutdown = pymysql.connect(**KW)
                try:
                    with shutdown.cursor() as cursor:
                        cursor.execute('SHUTDOWN')
                finally:
                    shutdown.close()
                server.wait(timeout=30)
            if server.poll() is None:
                server.terminate()
                server.wait(timeout=30)
            print('Isolated server stopped; diagnostic files:', data)
    else:
        main()
