"""Persistent local token revocation, shared by workers on the same host."""
import hashlib
import sqlite3
import time
from pathlib import Path

PATH = Path(__file__).resolve().parents[2] / '.runtime' / 'revoked_tokens.sqlite3'

def connection():
    PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(PATH, timeout=10)
    conn.execute('CREATE TABLE IF NOT EXISTS revoked (token_hash TEXT PRIMARY KEY, expires REAL NOT NULL)')
    conn.execute('DELETE FROM revoked WHERE expires < ?', (time.time(),))
    conn.commit()
    return conn

def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()

def is_revoked(token):
    conn = connection()
    try:
        return conn.execute('SELECT 1 FROM revoked WHERE token_hash=?', (digest(token),)).fetchone() is not None
    finally:
        conn.close()

def revoke(token, expires):
    conn = connection()
    try:
        conn.execute('INSERT OR IGNORE INTO revoked VALUES (?,?)', (digest(token), expires))
        conn.commit()
    finally:
        conn.close()
