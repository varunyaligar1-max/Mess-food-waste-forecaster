import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from backend.database import get_session
from backend.main import app

# In-memory SQLite for isolated fast unit testing
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


def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "mess-food-waste-forecaster"


def test_register_student(client: TestClient):
    payload = {
        "email": "freshman@hostel.com",
        "password": "password123",
        "name": "Freshman Tester",
        "student_id": "22CS999",
        "room_no": "Z-999",
        "role": "student",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "freshman@hostel.com"
    assert data["user"]["role"] == "student"


def test_register_duplicate_email_fails(client: TestClient):
    payload = {
        "email": "dup@hostel.com",
        "password": "password123",
        "name": "Duplicate Tester",
        "role": "student",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_flow(client: TestClient):
    # Register first
    reg_payload = {
        "email": "login_test@hostel.com",
        "password": "mysecretpassword",
        "name": "Login Tester",
        "role": "manager",
    }
    client.post("/api/auth/register", json=reg_payload)

    # Wrong password
    wrong_login = client.post(
        "/api/auth/login",
        json={"email": "login_test@hostel.com", "password": "wrongpassword"},
    )
    assert wrong_login.status_code == 401

    # Right password
    good_login = client.post(
        "/api/auth/login",
        json={"email": "login_test@hostel.com", "password": "mysecretpassword"},
    )
    assert good_login.status_code == 200
    data = good_login.json()
    assert "access_token" in data
    token = data["access_token"]

    # Access /api/auth/me with Bearer token
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    user_info = me_resp.json()
    assert user_info["email"] == "login_test@hostel.com"
    assert user_info["role"] == "manager"


def test_unauthorized_me_endpoint(client: TestClient):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401

