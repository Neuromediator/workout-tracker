import sqlite3

from sqlmodel import SQLModel, Session, create_engine
from app.config import get_settings

engine = create_engine(
    get_settings().database_url,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def _run_migrations():
    """Add columns that were introduced after initial table creation."""
    url = get_settings().database_url.replace("sqlite:///", "")
    conn = sqlite3.connect(url)
    cursor = conn.cursor()

    # Check if image_url column exists on exercise table
    cursor.execute("PRAGMA table_info(exercise)")
    columns = {row[1] for row in cursor.fetchall()}
    if "image_url" not in columns:
        cursor.execute("ALTER TABLE exercise ADD COLUMN image_url TEXT")
        conn.commit()

    # Add rest_seconds column to exercise_set table
    cursor.execute("PRAGMA table_info(exercise_set)")
    set_columns = {row[1] for row in cursor.fetchall()}
    if "rest_seconds" not in set_columns:
        cursor.execute("ALTER TABLE exercise_set ADD COLUMN rest_seconds INTEGER DEFAULT 0")
        conn.commit()

    conn.close()


def get_session():
    with Session(engine) as session:
        yield session
