"""Shared test fixtures — in-memory SQLite, mock auth, test client."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

# Import all models so SQLModel.metadata knows about them
from app.models.user import User
from app.models.exercise import Exercise  # noqa: F401
from app.models.session import WorkoutSession, SessionExercise, ExerciseSet  # noqa: F401
from app.models.routine import Routine, RoutineExercise  # noqa: F401

from app.main import app
from app.database import get_session
from app.auth.supabase import ensure_user_exists

TEST_USER_ID = "test-user-00000000-0000-0000-0000-000000000001"


@pytest.fixture(name="client")
def client_fixture():
    # Single in-memory SQLite with StaticPool so all connections share the same DB
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as setup_session:
        setup_session.add(User(id=TEST_USER_ID))
        setup_session.commit()

    def override_get_session():
        with Session(engine) as session:
            yield session

    def override_ensure_user_exists():
        return TEST_USER_ID

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[ensure_user_exists] = override_ensure_user_exists

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
