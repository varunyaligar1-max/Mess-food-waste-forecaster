# 🍲 Mess Food-Waste Forecaster

> A data-driven, machine-learning-powered headcount forecasting and meal planning system for hostel messes to reduce avoidable food waste.

---

## 📌 Problem Statement

Hostel messes usually cook for nearly all registered students, because the kitchen has no advance information about who will actually eat. In practice, many students skip meals for reasons like sleeping in, going out, studying or eating elsewhere. The extra food is thrown away, which wastes money, ingredients, labour, and energy. Neither the kitchen nor the students have a simple way to share this information in advance, so the mess can’t plan its quantities properly.

### Target Users:
1. **Hostel Students**: Need a quick, frictionless way to mark which meals they’ll skip in advance.
2. **Mess Managers and Kitchen Staff**: Need a reliable, aggregated estimate of how many plates to cook without risking shortages.

> **Note on Data**: The estimate of *15–35% student skip rate* is an empirical operational estimate based on hostel patterns. Before using it in an official pitch or presentation, replace it with a recorded number from your specific mess (e.g. headcount vs plates cooked over a representative week), or label it explicitly as an estimate.

---

## 🎯 Main Objective

Build a system that reduces food waste in hostel messes by predicting meal-wise turnout from student skip declarations and past attendance patterns.

### Specific Objectives:
1. **Collect skip information in advance**: Let students mark meals they won't eat, with **"eating" as the strict default** so silence is never treated as a skip.
2. **Give the kitchen a planning window**: Lock changes a fixed time before each meal (**3 hours before service** in the current build) so the mess manager gets a firm, reliable count.
3. **Forecast the real headcount**: Combine registered skips with weekday and meal-type no-show trends (using baseline buffer + learned moving average corrections) to suggest how many plates to cook.
4. **Record actual outcomes**: Let the mess manager log plates cooked, plates served, and leftover food weight (kg) after each meal.
5. **Measure performance honestly**: Report prediction error (MAE/MAPE) and waste before versus after, and show **"insufficient data"** when fewer than 3 meals have been logged.
6. **Protect student privacy**: Show managers **only aggregate counts**, never individual names or roll numbers of who skipped, and restrict manager features through role-based access control (RBAC).
7. **Keep improving**: Use every logged meal to dynamically adapt the no-show moving average, making the next prediction more accurate over time.

---

## 📊 Expected Outcomes

- **A working web app** with dedicated Student and Manager views.
- **A forecast that beats the "cook for everyone" approach**, supported by logged historical data.
- **A report showing predicted vs. actual plates and food waste reduced**.
- **A clear statement of limitations**, including dependence on students marking skips in advance and sample size constraints before machine-learning models reach full statistical power.

---

## 🖼️ Condensed Slide Deck Version (For Pitch & Presentations)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      MESS FOOD-WASTE FORECASTER                          │
│                                                                          │
│  PROBLEM:                                                                │
│  Hostel messes cook for 100% capacity due to zero advance visibility,    │
│  causing massive food, labor, and financial waste daily.                 │
│                                                                          │
│  3 CORE OBJECTIVES:                                                      │
│  1. COLLECT : Students mark skips with a strict 3-hour cutoff.           │
│  2. PREDICT : ML model forecasts turnout combining skips & no-show trends│
│  3. MEASURE : Managers log actuals; audit metrics report waste reduction.│
│                                                                          │
│  EXPECTED IMPACT:                                                        │
│  • 20–35% food waste reduction.                                          │
│  • Hundreds of plates & kilograms of food saved per month.               │
│  • Zero student privacy compromise (aggregates only).                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLModel (SQLite with Foreign Keys), Pydantic v2, JWT Auth (`python-jose` + `passlib[bcrypt]`), CORS enabled.
- **Forecasting & ML**: `backend/forecast.py` (baseline buffer + moving average no-show rate per `(day_of_week, meal_type)`, MAE & MAPE evaluation, counterfactual waste reduction).
- **Frontend**: React 18, Vite 6, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
- **Testing**: Pytest unit test suite covering Auth, Cutoff Rule, Forecasting Algorithms, and Manager Privacy.

---

## 🚀 Quick Run Guide

### Terminal 1: Backend API
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```
- API URL: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Terminal 2: Frontend Web App
```powershell
cd frontend
npm run dev
```
- Web Application: **[http://localhost:5173](http://localhost:5173)**

### Terminal 3: Automated Pytest Suite
```powershell
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Mess Manager** | `manager@mess.com` | `manager123` | Kitchen Headcount Forecast, Cook Guidance, Log Actuals, Waste Analytics |
| **Student** | `student1@hostel.com` | `student123` | View next 3 days of meals, toggle Skip/Eat, view cutoff countdown |

*(The login page at `http://localhost:5173` features instant 1-click **"Student Demo"** and **"Manager Demo"** buttons).*

---

## ⚠️ System Limitations & Honest Disclosures

1. **Dependence on Student Participation**: The accuracy of the baseline forecast depends on students actively marking their skips. The default of "eating" prevents undercooking, while the learned correction mitigates silent no-shows.
2. **Cold Start & Sample Size**: On a fresh deployment without history, the model operates in "baseline buffer" mode. It unlocks the "learned correction" method once 10+ meals have been logged, and requires at least 3 logged meals before reporting waste reduction statistics.
3. **Unexpected Events**: Extreme weather, unannounced campus holidays, or festival days may cause sudden turnout shifts that historical patterns cannot foresee.
