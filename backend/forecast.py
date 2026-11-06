import math
from typing import Dict, List, Optional, Tuple
from backend.config import BUFFER_PERCENTAGE


def calculate_baseline(total_students: int, registered_skips: int, buffer_pct: float = BUFFER_PERCENTAGE) -> int:
    """
    Baseline formula:
    predicted = total_students - registered_skips + buffer
    (buffer default = 5% of total_students)
    """
    buffer_val = int(round(total_students * buffer_pct))
    predicted = total_students - registered_skips + buffer_val
    return max(0, min(total_students, predicted))


def predict_headcount(
    total_students: int,
    registered_skips: int,
    day_of_week: int,
    meal_type: str,
    past_records: Optional[List[Dict]] = None,
    buffer_pct: float = BUFFER_PERCENTAGE,
) -> Tuple[int, int, str]:
    """
    Predicts headcount for a meal slot:
    1. Computes baseline: total_students - registered_skips + 5% buffer.
    2. If past_records has >= 10 rows:
       Learned correction: computes the moving average no-show rate per (day_of_week, meal_type)
       from past MealActual data.
    3. Return (predicted_headcount, suggested_cook_plates, method)
       suggested_cook_plates is predicted * 1.05 rounded up.
    """
    baseline_pred = calculate_baseline(total_students, registered_skips, buffer_pct)
    expected_eating = max(1, total_students - registered_skips)

    if not past_records or len(past_records) < 10:
        suggested = int(math.ceil(baseline_pred * 1.05))
        return baseline_pred, suggested, "baseline"

    # Compute moving average no-show rate
    slot_no_show_rates = []
    overall_no_show_rates = []

    for r in past_records:
        rec_total = r.get("total_students", total_students)
        rec_skips = r.get("registered_skips", 0)
        rec_served = r.get("served_plates", 0)
        rec_expected = max(1, rec_total - rec_skips)

        # No show count = students who said they'd eat but didn't show up
        no_shows = max(0, rec_expected - rec_served)
        no_show_rate = min(0.5, no_shows / rec_expected)

        overall_no_show_rates.append(no_show_rate)

        if r.get("day_of_week") == day_of_week and str(r.get("meal_type", "")).lower() == meal_type.lower():
            slot_no_show_rates.append(no_show_rate)

    # Use slot-specific moving average if available; otherwise overall moving average
    if len(slot_no_show_rates) >= 2:
        effective_no_show_rate = sum(slot_no_show_rates) / len(slot_no_show_rates)
    elif overall_no_show_rates:
        effective_no_show_rate = sum(overall_no_show_rates) / len(overall_no_show_rates)
    else:
        effective_no_show_rate = 0.05

    # Apply learned correction
    learned_predicted = int(round(expected_eating * (1.0 - effective_no_show_rate)))
    predicted_headcount = max(1, min(total_students, learned_predicted))
    suggested_cook_plates = int(math.ceil(predicted_headcount * 1.05))

    return predicted_headcount, suggested_cook_plates, "learned"


def evaluate_forecasts(history_records: List[Dict]) -> Dict:
    """
    Evaluates forecast accuracy and food waste reduction over logged meals:
    - Computes MAE (Mean Absolute Error) and MAPE (% error) of predicted vs served_plates.
    - Computes food waste (cooked - served) before vs after using the system.
    """
    if not history_records or len(history_records) < 3:
        return {
            "insufficient_data": True,
            "message": "Fewer than 3 logged meals. Insufficient data to evaluate performance.",
            "total_logged_meals": len(history_records) if history_records else 0,
            "mae": 0.0,
            "mape": 0.0,
            "waste_comparison": None,
            "series": [],
        }

    errors = []
    pct_errors = []
    series = []

    system_cooked_total = 0
    system_served_total = 0
    system_wasted_plates = 0
    system_wasted_kg = 0.0

    # Baseline counterfactual: without forecaster, hostel mess cooks flat 95% capacity
    baseline_cooked_total = 0

    for rec in history_records:
        predicted = rec["predicted_headcount"]
        cooked = rec["cooked_plates"]
        served = rec["served_plates"]
        total_stu = rec.get("total_students", 40)
        leftover_kg = rec.get("leftover_kg", 0.0)

        abs_err = abs(predicted - served)
        pct_err = (abs_err / served * 100.0) if served > 0 else 0.0

        errors.append(abs_err)
        pct_errors.append(pct_err)

        wasted = max(0, cooked - served)
        system_cooked_total += cooked
        system_served_total += served
        system_wasted_plates += wasted
        system_wasted_kg += leftover_kg

        # Counterfactual without system: mess kitchen prepares standard ~95% of capacity
        est_static_cook = int(round(total_stu * 0.95))
        baseline_cooked_total += est_static_cook

        series.append({
            "date": rec["date"],
            "meal_type": rec["meal_type"],
            "predicted_headcount": predicted,
            "suggested_cook_plates": rec.get("suggested_cook_plates", int(math.ceil(predicted * 1.05))),
            "cooked_plates": cooked,
            "served_plates": served,
            "leftover_plates": wasted,
            "leftover_kg": leftover_kg,
            "absolute_error": abs_err,
            "percentage_error": round(pct_err, 1),
            "method": rec.get("method", "baseline"),
        })

    mae = sum(errors) / len(errors)
    mape = sum(pct_errors) / len(pct_errors)

    baseline_wasted_plates = max(0, baseline_cooked_total - system_served_total)
    baseline_wasted_kg = round(baseline_wasted_plates * 0.35, 1)  # standard ~350g/plate

    plates_saved = max(0, baseline_wasted_plates - system_wasted_plates)
    kg_saved = max(0.0, round(baseline_wasted_kg - system_wasted_kg, 1))

    reduction_pct = 0.0
    if baseline_wasted_plates > 0:
        reduction_pct = round((plates_saved / baseline_wasted_plates) * 100.0, 1)

    waste_comparison = {
        "system_cooked_plates": system_cooked_total,
        "system_served_plates": system_served_total,
        "system_wasted_plates": system_wasted_plates,
        "system_wasted_kg": round(system_wasted_kg, 1),
        "baseline_cooked_plates": baseline_cooked_total,
        "baseline_wasted_plates": baseline_wasted_plates,
        "baseline_wasted_kg": baseline_wasted_kg,
        "plates_saved": plates_saved,
        "kg_saved": kg_saved,
        "waste_reduction_percentage": reduction_pct,
    }

    return {
        "insufficient_data": False,
        "message": None,
        "total_logged_meals": len(history_records),
        "mae": round(mae, 2),
        "mape": round(mape, 2),
        "waste_comparison": waste_comparison,
        "series": series,
    }
