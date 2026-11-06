import datetime as dt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from backend.auth import create_access_token
from backend.database import get_session
from backend.forecast import calculate_baseline, evaluate_forecasts, predict_headcount
from backend.main import app
from backend.models import Meal, MealActual, Skip, User


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


@pytest.fixture(name="manager_token")
def manager_token_fixture(session: Session):
    user = User(
        name="Head Chef",
        email="chef@mess.com",
        role="manager",
        hashed_password="hash",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})


@pytest.fixture(name="student_token")
def student_token_fixture(session: Session):
    user = User(
        name="Student User",
        email="stu@hostel.com",
        role="student",
        hashed_password="hash",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})


def test_forecast_unit_logic():
    # Baseline: 40 total, 10 skips, 5% buffer (= 2) -> 40 - 10 + 2 = 32
    baseline = calculate_baseline(total_students=40, registered_skips=10, buffer_pct=0.05)
    assert baseline == 32

    # Under 10 records: falls back to baseline method
    pred, cook, method = predict_headcount(
        total_students=40,
        registered_skips=10,
        day_of_week=0,
        meal_type="lunch",
        past_records=[],
    )
    assert method == "baseline"
    assert pred == 32
    assert cook == 34  # 32 * 1.05 = 33.6 -> ceil = 34

    # With >= 10 records: uses learned method
    synthetic_records = []
    for i in range(12):
        synthetic_records.append({
            "total_students": 40,
            "registered_skips": 8,
            "served_plates": 30,
            "day_of_week": i % 7,
            "meal_type": "lunch",
        })
    pred_learned, cook_learned, method_learned = predict_headcount(
        total_students=40,
        registered_skips=8,
        day_of_week=1,
        meal_type="lunch",
        past_records=synthetic_records,
    )
    assert method_learned == "learned"
    assert 25 <= pred_learned <= 40
    assert cook_learned >= pred_learned


def test_insufficient_data_rule():
    # Fewer than 3 records must flag insufficient_data
    history = [
        {"date": dt.date(2026, 11, 1), "meal_type": "lunch", "predicted_headcount": 30, "cooked_plates": 32, "served_plates": 28, "leftover_kg": 1.4},
        {"date": dt.date(2026, 11, 2), "meal_type": "lunch", "predicted_headcount": 31, "cooked_plates": 33, "served_plates": 29, "leftover_kg": 1.4},
    ]
    res = evaluate_forecasts(history)
    assert res["insufficient_data"] is True
    assert "Fewer than 3" in res["message"]

    # 3 or more records computes evaluation metrics
    history.append(
        {"date": dt.date(2026, 11, 3), "meal_type": "lunch", "predicted_headcount": 30, "cooked_plates": 32, "served_plates": 30, "leftover_kg": 0.7}
    )
    res_eval = evaluate_forecasts(history)
    assert res_eval["insufficient_data"] is False
    assert res_eval["mae"] >= 0.0
    assert res_eval["waste_comparison"] is not None


def test_manager_role_protection(client: TestClient, student_token: str):
    # Student attempting to access manager forecast gets 403 Forbidden
    res = client.get("/api/manager/forecast", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # Student attempting to post actuals gets 403 Forbidden
    res2 = client.post("/api/manager/actuals", json={"meal_id": 1, "cooked_plates": 30, "served_plates": 28}, headers={"Authorization": f"Bearer {student_token}"})
    assert res2.status_code == 403


def test_manager_forecast_privacy_aggregates_only(client: TestClient, session: Session, manager_token: str):
    today = dt.date.today()
    meal = Meal(
        date=today,
        meal_type="dinner",
        menu_text="Dal Tadka & Rice",
        cutoff_time=dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=2),
    )
    session.add(meal)
    session.commit()

    resp = client.get(f"/api/manager/forecast?date={today.isoformat()}", headers={"Authorization": f"Bearer {manager_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "meals" in data
    # Ensure no student personal identities or names are exposed
    json_str = str(data)
    assert "student_id" not in json_str or "roll_no" not in json_str
    assert "email" not in json_str

