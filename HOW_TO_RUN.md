# 🚀 How to Run the "Mess Food-Waste Forecaster" Project

---

## 📌 Project Overview

### Problem Statement
Hostel messes usually cook for nearly all registered students, because the kitchen has no advance information about who will actually eat. In practice, many students skip meals for reasons like sleeping in, going out, studying or eating elsewhere. The extra food is thrown away, which wastes money, ingredients, labour, and energy. Neither the kitchen nor the students have a simple way to share this information in advance, so the mess can’t plan its quantities properly.

### Target Users
- **Hostel students**: Need a quick way to say which meals they’ll skip.
- **Mess managers and kitchen staff**: Need a reliable estimate of how many plates to cook.

> *Note: The “15-35% of students skip” figure is an estimate based on operational patterns. Before using it in an official pitch, replace it with a recorded number from your specific mess or label it as an estimate.*

### Main Objective
Build a system that reduces food waste in hostel messes by predicting meal-wise turnout from student skip declarations and past attendance patterns.

### Specific Objectives
1. **Collect skip information in advance**: Let students mark meals they won't eat, with **"eating" as the default** so silence is never treated as a skip.
2. **Give the kitchen a planning window**: Lock changes a fixed time before each meal (**3 hours** in the current build) so the manager gets a firm count.
3. **Forecast the real headcount**: Combine registered skips with weekday and meal-type no-show trends to suggest how many plates to cook.
4. **Record actual outcomes**: Let the manager log plates cooked, plates served and leftover food after each meal.
5. **Measure performance honestly**: Report prediction error (MAE) and waste before versus after, and show **"insufficient data"** when too little has been logged (< 3 meals).
6. **Protect privacy**: Show managers **only aggregate counts**, never who skipped, and restrict manager features through role-based access control.
7. **Keep improving**: Use every logged meal to make the next prediction more accurate.

### Expected Outcomes
- A working web app with student and manager views.
- A forecast that beats the “cook for everyone” approach, supported by logged data.
- A report showing predicted vs. actual plates and waste reduced.
- A clear statement of limitations, such as dependence on students marking skips and sample size.

---

## ⚡ Step-by-Step Running Commands

### 1. Start the Backend API (FastAPI)
Open Terminal 1 in the project root:
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```
- **Backend URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 2. Start the Frontend Web App (React + Vite)
Open Terminal 2 in the project root:
```powershell
cd frontend
npm run dev
```
- **Web App URL**: **[http://localhost:5173](http://localhost:5173)**

---

### 3. Run Automated Tests (Pytest)
Open Terminal 3 in the project root:
```powershell
.\venv\Scripts\python.exe -m pytest tests/ -v
```
Runs all 12 tests:
- Auth, registration, token verification
- Cutoff rule enforcement (cannot change status within 3 hours)
- Default "eating" status and skip toggles
- Headcount forecasting algorithms (baseline & learned)
- Manager privacy rules (aggregate counts only)
- "Insufficient data" guard (< 3 meals)

---

### 4. Re-Seed Database with Realistic Demo Data (Optional)
```powershell
.\venv\Scripts\python.exe -m backend.seed
```
*Populates 1 Manager, 40 Students, 72 Meals across 18 days (14 historical + today + 3 upcoming), 840 Skips, and 56 Historical Actuals.*

---

## 🔑 Login Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Mess Manager** | `manager@mess.com` | `manager123` | Kitchen Headcount Forecast, Cook Guidance, Log Actuals, Waste Analytics |
| **Student** | `student1@hostel.com` | `student123` | View next 3 days of meals, toggle Skip/Eat, view cutoff countdown |

*(On the login screen at `http://localhost:5173`, click **"Student Demo"** or **"Manager Demo"** to log in instantly in 1 click).*

---

## 🎤 30-Second Elevator Pitch & Slide Summary

- **One-Sentence Problem**: Hostel messes cook for 100% capacity due to zero advance visibility on who will eat, resulting in massive food, financial, and environmental waste every single day.
- **Three Core Pillars**:
  1. **COLLECT**: Students declare skips in advance with a strict 3-hour cutoff.
  2. **PREDICT**: Machine learning predicts true headcount combining skips with historical no-show rates.
  3. **MEASURE**: Managers record actuals to audit forecast accuracy (MAE) and food waste reduction.
- **Expected Impact**: **20% to 35% reduction in mess food waste**, saving hundreds of kilograms of food and significant budget monthly, without compromising student meal availability or privacy.
