# 🍲 Mess Food-Waste Forecaster

> A data-driven, machine-learning-powered head-count forecasting and meal planning system for university and hostel messes to slash avoidable food waste.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLModel](https://img.shields.io/badge/ORM-SQLModel%20%28SQLite%29-blue?style=flat)](https://sqlmodel.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem & Impact

Hostel and university dining facilities routinely cook for **95–100% of enrolled students**, assuming static full attendance. In reality:
- Students regularly skip meals due to late sleep schedules, exams, classes, or eating out.
- **20–35% of cooked food is thrown directly into trash bins daily**, costing millions in food expenses while causing severe environmental impact.
- **The Core Barrier**: Mess managers cannot risk running out of food, so without advance skip signals and headcount forecasting, they overcook by default.

---

## 💡 The Solution

1. **Student Skip-Declaration Portal**:
   - Default status is **"Eating"** (never assumes silence is skipping).
   - Students mark which meals they will **SKIP** in advance.
   - **Enforced Cutoff Rule**: Skips lock 3 hours before meal service so the kitchen has guaranteed lead time.
2. **Manager Forecast & Cook Guidance**:
   - Privacy-Preserving: Managers see **aggregate counts only**, never individual student names.
   - **Baseline + Learned ML Model**: Predicts true turnout factoring in registered skips, day-of-week, meal slot, and historical no-show rates.
   - Recommends exact plates to cook with a safety buffer (5%).
3. **Actuals Logging & Waste Audit**:
   - Kitchen managers log cooked plates, served plates, and leftover kg after each meal.
   - **Audit Rule**: Never claims food waste was reduced without verified data (requires at least 3 logged meals).
   - Shows MAE forecast accuracy and compares plates saved vs traditional static cooking.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLModel (SQLite with WAL/Foreign Keys), Pydantic v2, JWT Authentication (`python-jose` + `passlib[bcrypt]`), CORS enabled.
- **Forecasting & ML**: `backend/forecast.py` (Moving average no-show correction & scikit-learn Linear Regression, MAE & MAPE evaluation, counterfactual waste reduction analysis).
- **Frontend**: React 18, Vite 6, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
- **Testing**: Pytest unit test suite covering auth, cutoff rule enforcement, forecasting algorithms, and manager privacy.

---

## 📂 Project Structure

```text
Mess food-waste forecaster/
├── backend/
│   ├── main.py              # FastAPI application, CORS, lifespan startup
│   ├── models.py            # SQLModel entities: User, Meal, Skip, MealActual, Forecast
│   ├── schemas.py           # Pydantic v2 validation & response models
│   ├── auth.py              # JWT tokens, password hashing, role-based dependencies
│   ├── database.py          # SQLite engine & session generator
│   ├── config.py            # Environment configurations
│   ├── forecast.py          # ML headcount prediction & waste evaluation
│   ├── seed.py              # 14 days of realistic historical demo data
│   ├── requirements.txt     # Python backend dependencies
│   └── routers/
│       ├── auth.py          # /api/auth (register, login, me)
│       ├── meals.py         # /api/meals (upcoming, skip, unskip)
│       ├── manager.py       # /api/manager (forecast, actuals, report)
│       └── admin.py         # /api/admin/seed
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Axios client with JWT interceptors
│   │   ├── context/         # AuthContext & state management
│   │   ├── components/      # Navbar, Toast notifications
│   │   └── pages/
│   │       ├── Login.jsx            # 1-click demo login
│   │       ├── Register.jsx         # New student/manager registration
│   │       ├── StudentDashboard.jsx # Upcoming meals, cutoff timers, skip toggles
│   │       ├── ManagerDashboard.jsx # Aggregate forecasts, cook guidance, log actuals
│   │       └── ManagerReport.jsx    # Waste reduction analytics & Recharts graphs
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── tests/
│   ├── test_stage1_auth.py
│   ├── test_stage2_cutoff_and_skips.py
│   └── test_stage3_forecast_and_manager.py
├── pytest.ini
├── requirements.txt
└── README.md
```

---

## 🚀 Quickstart & Running Instructions

### 1. Prerequisites
- **Python**: 3.11+ (installed with virtualenv)
- **Node.js**: v18+ and `npm`

---

### 2. Run the Backend API

Open a terminal in the project root:

```powershell
# Activate virtual environment or run via venv Python:
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

> **Backend API URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
> **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
> **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 3. Run the Frontend Application

Open a second terminal in the project root:

```powershell
cd frontend
npm run dev
```

> **Frontend Web App**: [http://localhost:5173](http://localhost:5173)

---

### 4. Run Automated Pytest Tests

```powershell
.\venv\Scripts\python.exe -m pytest tests/ -v
```

All 12 unit tests will execute and pass:
- Stage 1: Auth, duplicate protection, JWT verification.
- Stage 2: Cutoff rule enforcement, skip toggling, default eating status.
- Stage 3: Headcount forecasting, ML correction, insufficient data guard, manager privacy.

---

## 🔑 Demo Credentials

| Role | Email | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Mess Manager** | `manager@mess.com` | `manager123` | Full access to Forecasts, Actuals, Reports |
| **Sample Student 1** | `student1@hostel.com` | `student123` | Has pre-scheduled skips to explore |
| **Sample Student 2** | `student2@hostel.com` | `student123` | Default eating status |
| *(Students 3–40)* | `student3@hostel.com` ... `student40@hostel.com` | `student123` | 40 total simulated students |

> ⚡ *Tip: The Login page features **"1-Click Demo Fill"** buttons to log in instantly without typing.*

---

## 🎬 3-Minute Hackathon Demo Script

Follow this sequence for an engaging live demo to judges:

### Step 1: Login & The Problem (0:00 - 0:45)
1. Navigate to `http://localhost:5173`.
2. Click **"Student Demo"** and sign in as `student1@hostel.com`.
3. Point out the **Upcoming Meal Schedule**:
   - Notice that default status is **"Eating"** with a green badge.
   - Point out the **live countdown timers** showing hours until the 3-hour kitchen cutoff.
   - Show how easy it is to click **"Mark as Skip"** on tomorrow's breakfast. The badge flips to **"Skipping"** immediately with a toast notification.
   - Point out how past-cutoff meals are strictly **locked** to prevent last-minute kitchen disruptions.

### Step 2: Manager Forecast & Kitchen Guidance (0:45 - 1:45)
1. Click **Logout** and click **"Manager Demo"** to log in as `manager@mess.com`.
2. The **Daily Forecast Dashboard** loads:
   - Highlight the **Privacy Guarantee**: the manager sees **only aggregate numbers** (e.g. 14 skips for breakfast, 8 skips for lunch), never student names.
   - Explain the **Suggested Cook Plates**:
     $$\text{Predicted Headcount} = \text{Total Students} - \text{Skips} - \text{Learned No-Show Correction}$$
     $$\text{Suggested Cook Plates} = \lceil \text{Predicted Headcount} \times 1.05 \rceil$$
   - Show the **"Learned Correction" badge** indicating machine-learning adjustment from past no-show rates.
   - Click **"Log Actuals"** on a meal and enter: Cooked = 32 plates, Served = 30 plates, Leftover = 0.7 kg. Save it and watch the status update live.

### Step 3: Food Waste Reduction & Audit Analytics (1:45 - 2:45)
1. Click **"Waste Analytics & Reports"** in the top navigation bar.
2. Highlight the **Business Rule Compliance**:
   - If there are fewer than 3 logged meals, the platform displays an **"Insufficient Data"** shield banner.
   - With the 14 days of historical logs, it shows:
     - **35%+ Food Waste Reduction** achieved.
     - **Hundreds of Plates Saved** from being discarded.
     - **Food Weight Saved in KG** (diverted from municipal landfills).
     - **Low Forecast Error (MAE)** (~1.8 plates average error).
   - Walk through the interactive **Recharts graphs**:
     - *Chart 1*: Predicted vs Actual attendance tracking over time.
     - *Chart 2*: Before vs After comparison proving waste reduction against the static 95% cooking baseline.

### Step 4: 1-Click Demo Reset (2:45 - 3:00)
- Show the **"Reset Demo Data"** button in the top navbar. Click it to demonstrate that the entire SQLite database can be re-seeded with 72 meals and 840 realistic skips on the fly for repeat presentations.

