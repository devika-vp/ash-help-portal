import sqlite3
from pathlib import Path

SCHEMA = '''
CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    location TEXT NOT NULL,
    email TEXT NOT NULL,
    request TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
'''


def init_db(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(SCHEMA)


def save_help_request(path: Path, record: dict) -> int:
    with sqlite3.connect(path) as connection:
        cursor = connection.execute(
            'INSERT INTO help_requests (name, age, location, email, request) VALUES (?, ?, ?, ?, ?)',
            (record['name'], record['age'], record['location'], record['email'], record['request']),
        )
        return int(cursor.lastrowid)
