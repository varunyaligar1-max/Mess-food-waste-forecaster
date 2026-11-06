import datetime as dt
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from backend.auth import get_current_user
from backend.database import get_session
from backend.models import Meal, Skip, User
from backend.schemas import MealUpcomingRead, SkipResponse

router = APIRouter(prefix="/meals", tags=["Meals & Skips"])

MEAL_ORDER = {
    "breakfast": 1,
    "lunch": 2,
    "snacks": 3,
    "dinner": 4,
}


@router.get("/upcoming", response_model=List[MealUpcomingRead])
def get_upcoming_meals(
    days: int = Query(default=3, ge=1, le=14, description="Number of future days of meals to return"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Returns the next N days of meals.
    For each meal, indicates whether the authenticated student has marked it as skipped.
    Default status is eating (is_skipped=False).
    Includes cutoff time countdown and can_toggle flag.
    """
    today = dt.date.today()
    end_date = today + dt.timedelta(days=days)

    meals = session.exec(
        select(Meal)
        .where(Meal.date >= today, Meal.date <= end_date)
    ).all()

    # Sort by date, then meal slot sequence
    sorted_meals = sorted(
        meals,
        key=lambda m: (m.date, MEAL_ORDER.get(m.meal_type.lower(), 99)),
    )

    meal_ids = [m.id for m in sorted_meals if m.id is not None]

    # Query current student's registered skips
    user_skips = set()
    if meal_ids:
        skips = session.exec(
            select(Skip.meal_id)
            .where(
                Skip.user_id == current_user.id,
                col(Skip.meal_id).in_(meal_ids),
            )
        ).all()
        user_skips = set(skips)

    now_utc = dt.datetime.now(dt.timezone.utc)
    results = []

    for meal in sorted_meals:
        # Ensure cutoff_time has tzinfo for safe comparison
        cutoff = meal.cutoff_time
        if cutoff.tzinfo is None:
            cutoff = cutoff.replace(tzinfo=dt.timezone.utc)

        can_toggle = now_utc < cutoff
        seconds_left = max(0, int((cutoff - now_utc).total_seconds()))
        is_skipped = meal.id in user_skips

        results.append(
            MealUpcomingRead(
                id=meal.id,
                date=meal.date,
                meal_type=meal.meal_type,
                menu_text=meal.menu_text,
                cutoff_time=cutoff,
                is_skipped=is_skipped,
                can_toggle=can_toggle,
                seconds_until_cutoff=seconds_left,
            )
        )

    return results


@router.post("/{meal_id}/skip", response_model=SkipResponse)
def mark_meal_skip(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Student marks a meal to SKIP.
    Strictly enforced: students cannot change skip status after the meal's cutoff_time.
    """
    meal = session.get(Meal, meal_id)
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal with ID {meal_id} not found",
        )

    now_utc = dt.datetime.now(dt.timezone.utc)
    cutoff = meal.cutoff_time
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=dt.timezone.utc)

    if now_utc >= cutoff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cutoff time ({cutoff.strftime('%Y-%m-%d %H:%M UTC')}) has passed. You cannot change your skip status.",
        )

    # Check if skip row already exists
    existing_skip = session.exec(
        select(Skip).where(
            Skip.user_id == current_user.id,
            Skip.meal_id == meal.id,
        )
    ).first()

    if not existing_skip:
        new_skip = Skip(
            user_id=current_user.id,
            meal_id=meal.id,
            created_at=now_utc,
        )
        session.add(new_skip)
        session.commit()

    return SkipResponse(
        status="success",
        meal_id=meal.id,
        is_skipped=True,
        message="Meal successfully marked as SKIPPED",
    )


@router.delete("/{meal_id}/skip", response_model=SkipResponse)
def unmark_meal_skip(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Student cancels a skip (status returns to eating).
    Strictly enforced: students cannot change skip status after the meal's cutoff_time.
    """
    meal = session.get(Meal, meal_id)
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal with ID {meal_id} not found",
        )

    now_utc = dt.datetime.now(dt.timezone.utc)
    cutoff = meal.cutoff_time
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=dt.timezone.utc)

    if now_utc >= cutoff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cutoff time ({cutoff.strftime('%Y-%m-%d %H:%M UTC')}) has passed. You cannot change your skip status.",
        )

    existing_skip = session.exec(
        select(Skip).where(
            Skip.user_id == current_user.id,
            Skip.meal_id == meal.id,
        )
    ).first()

    if existing_skip:
        session.delete(existing_skip)
        session.commit()

    return SkipResponse(
        status="success",
        meal_id=meal.id,
        is_skipped=False,
        message="Skip cancelled. You are marked as EATING this meal.",
    )

