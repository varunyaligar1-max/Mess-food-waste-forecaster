import datetime as dt
from typing import Optional
from sqlmodel import Field, SQLModel, UniqueConstraint


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    student_id: Optional[str] = Field(default=None, index=True, description="Student roll number or ID")
    room_no: Optional[str] = Field(default=None)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: str = Field(default="student", index=True, description="student or manager")
    created_at: dt.datetime = Field(default_factory=utc_now)


class Meal(SQLModel, table=True):
    __tablename__ = "meal"
    __table_args__ = (
        UniqueConstraint("date", "meal_type", name="unique_meal_per_date_slot"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt.date = Field(index=True)
    meal_type: str = Field(index=True, description="breakfast, lunch, snacks, dinner")
    menu_text: str
    cutoff_time: dt.datetime = Field(index=True, description="Cutoff timestamp for toggling skips")


class Skip(SQLModel, table=True):
    __tablename__ = "skip"
    __table_args__ = (
        UniqueConstraint("user_id", "meal_id", name="unique_user_meal_skip"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    meal_id: int = Field(foreign_key="meal.id", index=True)
    created_at: dt.datetime = Field(default_factory=utc_now)


class MealActual(SQLModel, table=True):
    __tablename__ = "meal_actual"

    id: Optional[int] = Field(default=None, primary_key=True)
    meal_id: int = Field(foreign_key="meal.id", unique=True, index=True)
    cooked_plates: int
    served_plates: int
    leftover_kg: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None)
    logged_at: dt.datetime = Field(default_factory=utc_now)


class Forecast(SQLModel, table=True):
    __tablename__ = "forecast"

    id: Optional[int] = Field(default=None, primary_key=True)
    meal_id: int = Field(foreign_key="meal.id", index=True)
    registered_skips: int
    predicted_headcount: int
    suggested_cook_plates: int
    method: str = Field(default="baseline", description="baseline or learned")
    created_at: dt.datetime = Field(default_factory=utc_now)
