import datetime as dt
from enum import Enum
from typing import Any, Dict, List, Optional
import email_validator
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Disable live DNS deliverability lookups for ultra-fast local validation
email_validator.TEST_ENVIRONMENT = True


class UserRole(str, Enum):
    STUDENT = "student"
    MANAGER = "manager"


class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    SNACKS = "snacks"
    DINNER = "dinner"


# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password must be at least 6 characters")
    name: str = Field(min_length=1)
    student_id: Optional[str] = None
    room_no: Optional[str] = None
    role: UserRole = UserRole.STUDENT


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    student_id: Optional[str] = None
    room_no: Optional[str] = None
    role: str
    created_at: dt.datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# --- Meal & Skip Schemas ---
class MealUpcomingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: dt.date
    meal_type: str
    menu_text: str
    cutoff_time: dt.datetime
    is_skipped: bool = False
    can_toggle: bool = True
    seconds_until_cutoff: int = 0


class SkipResponse(BaseModel):
    status: str
    meal_id: int
    is_skipped: bool
    message: str


# --- Actuals & Forecasting Schemas ---
class MealActualCreate(BaseModel):
    meal_id: int
    cooked_plates: int = Field(ge=0, description="Plates prepared/cooked")
    served_plates: int = Field(ge=0, description="Plates actually consumed by students")
    leftover_kg: float = Field(default=0.0, ge=0.0, description="Estimated leftover food weight in kg")
    notes: Optional[str] = None


class MealActualRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meal_id: int
    cooked_plates: int
    served_plates: int
    leftover_kg: float
    notes: Optional[str] = None
    logged_at: dt.datetime


class MealForecastItem(BaseModel):
    meal_id: int
    date: dt.date
    meal_type: str
    menu_text: str
    cutoff_time: dt.datetime
    total_students: int
    registered_skips: int
    predicted_headcount: int
    suggested_cook_plates: int
    method: str
    actual_logged: bool = False
    actual: Optional[MealActualRead] = None


class DailyForecastResponse(BaseModel):
    date: dt.date
    total_students: int
    meals: List[MealForecastItem]


class ReportSeriesItem(BaseModel):
    date: dt.date
    meal_type: str
    predicted_headcount: int
    suggested_cook_plates: int
    cooked_plates: int
    served_plates: int
    leftover_kg: float
    leftover_plates: int
    absolute_error: int
    percentage_error: float
    method: str


class WasteComparison(BaseModel):
    system_cooked_plates: int
    system_served_plates: int
    system_wasted_plates: int
    system_wasted_kg: float
    baseline_cooked_plates: int
    baseline_wasted_plates: int
    baseline_wasted_kg: float
    plates_saved: int
    kg_saved: float
    waste_reduction_percentage: float


class ReportResponse(BaseModel):
    insufficient_data: bool
    message: Optional[str] = None
    total_logged_meals: int
    mae: float
    mape: float
    waste_comparison: Optional[WasteComparison] = None
    history_series: List[ReportSeriesItem] = []


# --- Seed Response ---
class SeedResponse(BaseModel):
    status: str
    message: str
    counts: Dict[str, int]
