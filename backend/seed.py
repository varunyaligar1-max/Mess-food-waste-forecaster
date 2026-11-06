from datetime import date, datetime, time, timedelta, timezone
import random
from typing import Dict
from sqlmodel import Session, select

from backend.auth import get_password_hash
from backend.database import engine, create_db_and_tables
from backend.models import Forecast, Meal, MealActual, Skip, User

STUDENT_NAMES = [
    ("Aarav Sharma", "21CS001", "A-101"),
    ("Ananya Iyer", "21CS002", "A-102"),
    ("Rohan Verma", "21CS003", "A-103"),
    ("Sneha Patel", "21CS004", "A-104"),
    ("Aditya Nair", "21CS005", "A-105"),
    ("Meera Kulkarni", "21CS006", "A-106"),
    ("Karthik Reddy", "21CS007", "B-201"),
    ("Pooja Gupta", "21CS008", "B-202"),
    ("Vikram Singh", "21CS009", "B-203"),
    ("Divya Joshi", "21CS010", "B-204"),
    ("Siddharth Rao", "21CS011", "B-205"),
    ("Tanvi Deshmukh", "21CS012", "B-206"),
    ("Arjun Menon", "21CS013", "C-301"),
    ("Ishita Sen", "21CS014", "C-302"),
    ("Nikhil Bhat", "21CS015", "C-303"),
    ("Rhea Kapoor", "21CS016", "C-304"),
    ("Varun Chopra", "21CS017", "C-305"),
    ("Kavya Pillai", "21CS018", "C-306"),
    ("Akash Banerjee", "21CS019", "D-401"),
    ("Shruti Saxena", "21CS020", "D-402"),
    ("Pranav Hegde", "21CS021", "D-403"),
    ("Anika Malhotra", "21CS022", "D-404"),
    ("Gaurav Mehta", "21CS023", "D-405"),
    ("Swati Agarwal", "21CS024", "D-406"),
    ("Harsh Vardhan", "21CS025", "E-501"),
    ("Bhavna Tiwari", "21CS026", "E-502"),
    ("Manish Pandey", "21CS027", "E-503"),
    ("Neha Singhania", "21CS028", "E-504"),
    ("Kunal Chauhan", "21CS029", "E-505"),
    ("Simran Gill", "21CS030", "E-506"),
    ("Abhishek Das", "21CS031", "F-601"),
    ("Tarun Nambiar", "21CS032", "F-602"),
    ("Preeti Mishra", "21CS033", "F-603"),
    ("Rahul Jain", "21CS034", "F-604"),
    ("Deepika Sundaram", "21CS035", "F-605"),
    ("Vivek Chawla", "21CS036", "F-606"),
    ("Sanya Sethi", "21CS037", "G-701"),
    ("Ayush Mathur", "21CS038", "G-702"),
    ("Kritika Roy", "21CS039", "G-703"),
    ("Samir Sheikh", "21CS040", "G-704"),
]

MENU_ROTATION = {
    "breakfast": [
        "Idli (3 pcs), Medu Vada (1 pc), Sambhar & Coconut Chutney",
        "Aloo Paratha (2 pcs), Fresh Curd, Mixed Pickle & Butter",
        "Kanda Poha with Roasted Peanuts, Sev & Ginger Cardamom Chai",
        "Masala Dosa with Potato Palya, Sambhar & Tomato Chutney",
        "Rava Upma with Vegetable Kesari Bath & Filter Coffee",
        "Chole Poori (3 pcs) with Onion-Chilli Salad & Sweet Lassi",
        "Uttapam with Sambar, Coconut Chutney & Boiled Eggs",
    ],
    "lunch": [
        "Rajma Masala, Steamed Basmati Rice, 3 Phulkas, Boondi Raita & Salad",
        "Paneer Butter Masala, Yellow Dal Tadka, Jeera Rice, Tawa Roti & Gulab Jamun",
        "Chole Bhature with Pickled Onions, Mint Raita & Roasted Papad",
        "South Indian Thali: Rice, Sambhar, Rasam, Beetroot Poriyal, Curd & Papad",
        "Kadhi Pakora, Steamed Rice, Aloo Gobi Masala & 3 Phulkas",
        "Dum Aloo Kashmiri, Dal Makhani, Veg Pulao & Tandoori Roti",
        "Veg Biryani, Mirchi Ka Salan, Onion Raita & Moong Dal Halwa",
    ],
    "snacks": [
        "Crispy Punjabi Samosa (2 pcs), Sweet & Mint Chutney with Masala Chai",
        "Mumbai Pav Bhaji (2 pavs) with Chopped Onions, Lemon & Cardamom Tea",
        "Mixed Vegetable Cutlets (2 pcs) with Tomato Ketchup & Ginger Tea",
        "Bhel Puri / Sev Puri with Hot Filter Coffee",
        "Onion Pakora (Pakoda) with Green Chutney & Adrak Chai",
        "Bun Maska & Irani Chai with Butter Biscuit",
        "Bread Pakora with Mint Chutney & Hot Tea",
    ],
    "dinner": [
        "Dal Makhani, Kadai Paneer, 3 Butter Rotis, Steamed Rice & Rice Kheer",
        "Veg Dum Biryani with Veg Raita, Salan & Double Ka Meetha",
        "Egg Curry (or Malai Kofta for veg), Jeera Rice, Chapati & Cucumber Salad",
        "Mixed Veg Korma, Dal Tadka, Steamed Rice, Tandoori Roti & Fruit Custard",
        "Palak Paneer, Rajma Gravy, Steamed Rice, 3 Rotis & Semiya Payasam",
        "Aloo Methi, Chana Dal, Steamed Rice, Chapati & Shahi Tukda",
        "Khichdi with Gujarati Kadhi, Begun Bhaja (Eggplant fry), Papad & Pickle",
    ],
}

MEAL_TIMES = {
    # (meal_start_time, cutoff_lead_hours)
    "breakfast": (time(7, 30), 3),   # Cutoff 04:30 AM
    "lunch": (time(12, 30), 3),       # Cutoff 09:30 AM
    "snacks": (time(17, 0), 3),       # Cutoff 14:00 PM
    "dinner": (time(19, 30), 3),      # Cutoff 16:30 PM
}


def compute_cutoff(meal_date: date, meal_type: str) -> datetime:
    meal_start, lead_hours = MEAL_TIMES[meal_type]
    meal_datetime = datetime.combine(meal_date, meal_start, tzinfo=timezone.utc)
    return meal_datetime - timedelta(hours=lead_hours)


def seed_database(session: Session) -> Dict[str, int]:
    # Set seed for reproducible demo data
    random.seed(42)

    # 1. Clear existing tables in correct order of foreign keys
    for row in session.exec(select(Forecast)).all():
        session.delete(row)
    for row in session.exec(select(MealActual)).all():
        session.delete(row)
    for row in session.exec(select(Skip)).all():
        session.delete(row)
    for row in session.exec(select(Meal)).all():
        session.delete(row)
    for row in session.exec(select(User)).all():
        session.delete(row)
    session.commit()

    # 2. Create Manager
    manager_pwd = get_password_hash("manager123")
    student_pwd = get_password_hash("student123")

    now = datetime.now(timezone.utc)

    manager = User(
        name="Ramesh Kumar (Mess Manager)",
        email="manager@mess.com",
        role="manager",
        student_id="MGR-01",
        room_no="Office-101",
        hashed_password=manager_pwd,
        created_at=now,
    )
    session.add(manager)

    # 3. Create 40 Students
    students = []
    for i, (name, roll, room) in enumerate(STUDENT_NAMES, start=1):
        stu = User(
            name=name,
            email=f"student{i}@hostel.com",
            role="student",
            student_id=roll,
            room_no=room,
            hashed_password=student_pwd,
            created_at=now,
        )
        session.add(stu)
        students.append(stu)

    session.commit()
    for s in students:
        session.refresh(s)

    total_students = len(students)

    # 4. Generate Meals
    # 14 days historical + today + 3 days upcoming = 18 days
    today = date.today()
    start_date = today - timedelta(days=14)
    end_date = today + timedelta(days=3)

    all_meals = []
    curr_date = start_date
    meal_types = ["breakfast", "lunch", "snacks", "dinner"]

    while curr_date <= end_date:
        day_idx = curr_date.weekday()  # 0=Monday, 6=Sunday
        for m_type in meal_types:
            menu = MENU_ROTATION[m_type][day_idx % len(MENU_ROTATION[m_type])]
            cutoff = compute_cutoff(curr_date, m_type)
            meal = Meal(
                date=curr_date,
                meal_type=m_type,
                menu_text=menu,
                cutoff_time=cutoff,
            )
            session.add(meal)
            all_meals.append(meal)
        curr_date += timedelta(days=1)

    session.commit()
    for m in all_meals:
        session.refresh(m)

    # 5. Populate Historical Data & Upcoming Skips
    total_skips_created = 0
    total_actuals_created = 0
    total_forecasts_created = 0

    for meal in all_meals:
        is_historical = meal.date < today
        day_of_week = meal.date.weekday()

        # Decide expected skip range based on meal type & day of week
        if meal.meal_type == "breakfast":
            skip_count = random.randint(14, 22) if day_of_week >= 5 else random.randint(8, 14)
        elif meal.meal_type == "lunch":
            skip_count = random.randint(6, 12)
        elif meal.meal_type == "snacks":
            skip_count = random.randint(12, 20)
        else:  # dinner
            skip_count = random.randint(4, 9)

        # Select students who skip
        skipping_students = random.sample(students, min(skip_count, total_students))

        # Always ensure student 1 has a predictable upcoming skip schedule
        if meal.date >= today:
            if meal.date == today + timedelta(days=1) and meal.meal_type == "breakfast":
                if students[0] not in skipping_students:
                    skipping_students.append(students[0])
            elif meal.date == today + timedelta(days=2) and meal.meal_type == "dinner":
                if students[0] not in skipping_students:
                    skipping_students.append(students[0])

        for stu in skipping_students:
            skip_record = Skip(
                user_id=stu.id,
                meal_id=meal.id,
                created_at=meal.cutoff_time - timedelta(hours=random.randint(4, 24)),
            )
            session.add(skip_record)
            total_skips_created += 1

        reg_skips = len(skipping_students)
        buffer_val = int(round(total_students * 0.05))  # 5% buffer = 2 plates
        baseline_predicted = total_students - reg_skips + buffer_val

        # If historical meal: generate actuals and historical forecast
        if is_historical:
            expected_eating = total_students - reg_skips
            no_shows = random.randint(1, max(1, int(expected_eating * 0.08)))
            served_plates = max(5, expected_eating - no_shows)

            days_ago = (today - meal.date).days
            if days_ago > 7:
                cooked_plates = 38 + random.randint(0, 2)
            else:
                cooked_plates = int(baseline_predicted * 1.05) + random.randint(0, 1)
                if cooked_plates < served_plates:
                    cooked_plates = served_plates + random.randint(0, 2)

            leftover_plates = max(0, cooked_plates - served_plates)
            leftover_kg = round(leftover_plates * 0.35, 1)

            actual = MealActual(
                meal_id=meal.id,
                cooked_plates=cooked_plates,
                served_plates=served_plates,
                leftover_kg=leftover_kg,
                notes=f"Normal service ({leftover_plates} plates remaining)",
                logged_at=datetime.combine(meal.date, MEAL_TIMES[meal.meal_type][0], tzinfo=timezone.utc) + timedelta(hours=3),
            )
            session.add(actual)
            total_actuals_created += 1

            forecast_rec = Forecast(
                meal_id=meal.id,
                registered_skips=reg_skips,
                predicted_headcount=baseline_predicted,
                suggested_cook_plates=int(round(baseline_predicted * 1.05)),
                method="baseline" if days_ago > 4 else "learned",
                created_at=meal.cutoff_time,
            )
            session.add(forecast_rec)
            total_forecasts_created += 1

    session.commit()

    return {
        "managers": 1,
        "students": total_students,
        "meals": len(all_meals),
        "skips": total_skips_created,
        "actuals": total_actuals_created,
        "forecasts": total_forecasts_created,
    }


def run_standalone_seed():
    create_db_and_tables()
    with Session(engine) as session:
        counts = seed_database(session)
        print("Database seeded successfully!")
        print(f"Summary: {counts}")


if __name__ == "__main__":
    run_standalone_seed()
