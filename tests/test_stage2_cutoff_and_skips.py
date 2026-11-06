import datetime as dt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from backend.auth import create_access_token
from backend.database import get_session
from backend.main import app
from backend.models import Meal, Skip, User


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="student_user")
def student_user_fixture(session: Session):
    user = User(
        name="Test Student",
        email="test_student@hostel.com",
        student_id="CS100",
        role="student",
        hashed_password="hash",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="student_token")
def student_token_fixture(student_user: User):
    return create_access_token(
        data={"sub": str(student_user.id), "email": student_user.email, "role": student_user.role}
    )


def test_upcoming_meals_default_status_is_eating(client: TestClient, session: Session, student_token: str):
    today = dt.date.today()
    future_cutoff = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=5)

    meal = Meal(
        date=today,
        meal_type="dinner",
        menu_text="Paneer Butter Masala & Roti",
        cutoff_time=future_cutoff,
    )
    session.add(meal)
    session.commit()

    resp = client.get(
        "/api/meals/upcoming?days=3",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    found = next((m for m in items if m["id"] == meal.id), None)
    assert found is not None
    assert found["is_skipped"] is False  # Default MUST be eating
    assert found["can_toggle"] is True


def test_toggle_skip_before_cutoff_succeeds(client: TestClient, session: Session, student_token: str):
    today = dt.date.today()
    future_cutoff = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=4)

    meal = Meal(
        date=today,
        meal_type="lunch",
        menu_text="Rajma Chawal",
        cutoff_time=future_cutoff,
    )
    session.add(meal)
    session.commit()

    # Mark as skipped
    skip_res = client.post(
        f"/api/meals/{meal.id}/skip",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert skip_res.status_code == 200
    assert skip_res.json()["is_skipped"] is True

    # Verify in upcoming
    resp = client.get(
        "/api/meals/upcoming",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    found = next(m for m in resp.json() if m["id"] == meal.id)
    assert found["is_skipped"] is True

    # Unmark skip (back to eating)
    unskip_res = client.delete(
        f"/api/meals/{meal.id}/skip",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert unskip_res.status_code == 200
    assert unskip_res.json()["is_skipped"] is False


def test_cutoff_rule_enforced_strictly(client: TestClient, session: Session, student_token: str):
    today = dt.date.today()
    # Cutoff was 1 hour ago
    past_cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=1)

    meal = Meal(
        date=today,
        meal_type="breakfast",
        menu_text="Poha",
        cutoff_time=past_cutoff,
    )
    session.add(meal)
    session.commit()

    # Attempt to skip after cutoff must fail with 400
    skip_res = client.post(
        f"/api/meals/{meal.id}/skip",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert skip_res.status_code == 400
    assert "Cutoff time" in skip_res.json()["detail"]

    # Attempt to unskip after cutoff must also fail with 400
    unskip_res = client.delete(
        f"/api/meals/{meal.id}/skip",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert unskip_res.status_code == 400
    assert "Cutoff time" in unskip_res.json()["detail"]

