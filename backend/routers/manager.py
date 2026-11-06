import datetime as dt
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from backend.auth import require_manager
from backend.database import get_session
from backend.forecast import evaluate_forecasts, predict_headcount
from backend.models import Forecast, Meal, MealActual, Skip, User
from backend.schemas import (
    DailyForecastResponse,
    MealActualCreate,
    MealActualRead,
    MealForecastItem,
    ReportResponse,
)

router = APIRouter(prefix="/manager", tags=["Manager Portal"])

MEAL_ORDER = {
    "breakfast": 1,
    "lunch": 2,
    "snacks": 3,
    "dinner": 4,
}


def _get_past_actuals_records(session: Session, before_date: Optional[dt.date] = None) -> List[dict]:
    """Helper to fetch past actuals formatted for forecasting model."""
    stmt = (
        select(MealActual, Meal)
        .join(Meal, MealActual.meal_id == Meal.id)
    )
    if before_date:
        stmt = stmt.where(Meal.date < before_date)

    rows = session.exec(stmt).all()
    records = []
    total_students = len(session.exec(select(User).where(User.role == "student")).all()) or 40

    for actual, meal in rows:
        skip_count = len(session.exec(select(Skip).where(Skip.meal_id == meal.id)).all())
        records.append({
            "meal_id": meal.id,
            "date": meal.date,
            "meal_type": meal.meal_type.lower(),
            "day_of_week": meal.date.weekday(),
            "total_students": total_students,
            "registered_skips": skip_count,
            "cooked_plates": actual.cooked_plates,
            "served_plates": actual.served_plates,
            "leftover_kg": actual.leftover_kg,
            "notes": actual.notes,
        })
    return records


@router.get("/forecast", response_model=DailyForecastResponse)
def get_daily_forecast(
    target_date: Optional[dt.date] = Query(default=None, alias="date", description="Date to get forecasts for (defaults to today)"),
    current_manager: User = Depends(require_manager),
    session: Session = Depends(get_session),
):
    """
    Manager endpoint: Returns aggregate forecast per meal for the given date.
    Strict privacy rule: returns ONLY aggregate counts, NEVER student names.
    """
    selected_date = target_date or dt.date.today()

    total_students = len(session.exec(select(User).where(User.role == "student")).all())
    if total_students == 0:
        total_students = 40  # Default fallback if student table is empty

    meals = session.exec(select(Meal).where(Meal.date == selected_date)).all()
    sorted_meals = sorted(meals, key=lambda m: MEAL_ORDER.get(m.meal_type.lower(), 99))

    past_records = _get_past_actuals_records(session, before_date=selected_date)

    items = []
    for meal in sorted_meals:
        # Aggregates only
        skips_count = len(session.exec(select(Skip).where(Skip.meal_id == meal.id)).all())

        predicted, suggested, method = predict_headcount(
            total_students=total_students,
            registered_skips=skips_count,
            day_of_week=meal.date.weekday(),
            meal_type=meal.meal_type.lower(),
            past_records=past_records,
        )

        # Upsert or save forecast row for record keeping
        forecast_rec = session.exec(select(Forecast).where(Forecast.meal_id == meal.id)).first()
        if not forecast_rec:
            forecast_rec = Forecast(
                meal_id=meal.id,
                registered_skips=skips_count,
                predicted_headcount=predicted,
                suggested_cook_plates=suggested,
                method=method,
                created_at=meal.cutoff_time,
            )
            session.add(forecast_rec)
            session.commit()
            session.refresh(forecast_rec)
        else:
            forecast_rec.registered_skips = skips_count
            forecast_rec.predicted_headcount = predicted
            forecast_rec.suggested_cook_plates = suggested
            forecast_rec.method = method
            session.add(forecast_rec)
            session.commit()

        actual = session.exec(select(MealActual).where(MealActual.meal_id == meal.id)).first()

        items.append(
            MealForecastItem(
                meal_id=meal.id,
                date=meal.date,
                meal_type=meal.meal_type,
                menu_text=meal.menu_text,
                cutoff_time=meal.cutoff_time,
                total_students=total_students,
                registered_skips=skips_count,
                predicted_headcount=predicted,
                suggested_cook_plates=suggested,
                method=method,
                actual_logged=actual is not None,
                actual=MealActualRead.model_validate(actual) if actual else None,
            )
        )

    return DailyForecastResponse(
        date=selected_date,
        total_students=total_students,
        meals=items,
    )


@router.post("/actuals", response_model=MealActualRead, status_code=status.HTTP_201_CREATED)
def record_actuals(
    payload: MealActualCreate,
    current_manager: User = Depends(require_manager),
    session: Session = Depends(get_session),
):
    """
    Manager logs actual plates cooked, plates served, leftover kg, and notes after a meal.
    """
    meal = session.get(Meal, payload.meal_id)
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal with ID {payload.meal_id} not found",
        )

    existing = session.exec(select(MealActual).where(MealActual.meal_id == payload.meal_id)).first()
    now_utc = dt.datetime.now(dt.timezone.utc)

    if existing:
        existing.cooked_plates = payload.cooked_plates
        existing.served_plates = payload.served_plates
        existing.leftover_kg = payload.leftover_kg
        existing.notes = payload.notes
        existing.logged_at = now_utc
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return MealActualRead.model_validate(existing)

    actual = MealActual(
        meal_id=payload.meal_id,
        cooked_plates=payload.cooked_plates,
        served_plates=payload.served_plates,
        leftover_kg=payload.leftover_kg,
        notes=payload.notes,
        logged_at=now_utc,
    )
    session.add(actual)
    session.commit()
    session.refresh(actual)
    return MealActualRead.model_validate(actual)


@router.get("/report", response_model=ReportResponse)
def get_performance_report(
    current_manager: User = Depends(require_manager),
    session: Session = Depends(get_session),
):
    """
    Compares predicted vs actual across all logged meals.
    Business rule: If fewer than 3 logged meals, returns insufficient_data=True.
    """
    total_students = len(session.exec(select(User).where(User.role == "student")).all()) or 40

    # Fetch all actuals with associated meal and forecast
    rows = session.exec(
        select(MealActual, Meal)
        .join(Meal, MealActual.meal_id == Meal.id)
    ).all()

    if len(rows) < 3:
        return ReportResponse(
            insufficient_data=True,
            message="Fewer than 3 logged meals. Insufficient data to calculate waste and accuracy metrics.",
            total_logged_meals=len(rows),
            mae=0.0,
            mape=0.0,
            waste_comparison=None,
            history_series=[],
        )

    history_records = []
    # Sort chronologically
    sorted_rows = sorted(rows, key=lambda pair: (pair[1].date, MEAL_ORDER.get(pair[1].meal_type.lower(), 99)))

    for actual, meal in sorted_rows:
        forecast = session.exec(select(Forecast).where(Forecast.meal_id == meal.id)).first()
        skips_count = len(session.exec(select(Skip).where(Skip.meal_id == meal.id)).all())

        if forecast:
            predicted = forecast.predicted_headcount
            suggested = forecast.suggested_cook_plates
            method = forecast.method
        else:
            # Fallback baseline calculation if forecast row missing
            buffer_val = int(round(total_students * 0.05))
            predicted = max(0, total_students - skips_count + buffer_val)
            suggested = int(round(predicted * 1.05))
            method = "baseline"

        history_records.append({
            "date": meal.date,
            "meal_type": meal.meal_type,
            "total_students": total_students,
            "predicted_headcount": predicted,
            "suggested_cook_plates": suggested,
            "cooked_plates": actual.cooked_plates,
            "served_plates": actual.served_plates,
            "leftover_kg": actual.leftover_kg,
            "method": method,
        })

    eval_result = evaluate_forecasts(history_records)

    return ReportResponse(
        insufficient_data=eval_result["insufficient_data"],
        message=eval_result["message"],
        total_logged_meals=eval_result["total_logged_meals"],
        mae=eval_result["mae"],
        mape=eval_result["mape"],
        waste_comparison=eval_result["waste_comparison"],
        history_series=eval_result["series"],
    )

