from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session, select

from backend.auth import security, get_current_user
from backend.config import ENV
from backend.database import get_session
from backend.models import User
from backend.schemas import SeedResponse
from backend.seed import seed_database

router = APIRouter(prefix="/admin", tags=["Admin & Dev"])


@router.post("/seed", response_model=SeedResponse)
def seed_data(
    force: bool = Query(default=False, description="Force re-seed in development mode"),
    session: Session = Depends(get_session),
):
    """
    Seed sample students, meals, and 14 days of realistic historical data.
    Allowed in development mode or with force=True flag.
    """
    # Check if database already has users and force is not set
    existing_users = session.exec(select(User)).first()
    if existing_users and not force and ENV != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database already contains data. Set force=true or run in development mode to re-seed.",
        )

    counts = seed_database(session)
    return SeedResponse(
        status="success",
        message="Demo database seeded with 1 manager, 40 students, 18 days of meals (14 historical + today + 3 upcoming), skips, actuals, and forecasts.",
        counts=counts,
    )

