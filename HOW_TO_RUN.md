# 🚀 How to Run the "Mess Food-Waste Forecaster" Project

This guide provides clear, step-by-step instructions to set up, run, test, and demo the entire project on Windows (PowerShell / Command Prompt).

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Python 3.11+** (virtual environment `venv/` is included in the project)
- **Node.js v18+** and **npm**

---

## ⚡ Quick Start (2 Commands)

Open two separate terminal windows in the project root (`d:\Mess food-waste forecaster`):

### Terminal 1: Backend API (FastAPI)
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```
- **Live URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Terminal 2: Frontend Web App (React + Vite)
```powershell
cd frontend
npm run dev
```
- **Web App URL**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests (Pytest)

To run the complete test suite (12 unit tests covering Auth, Cutoff Rules, Forecasting ML, Manager Privacy & Reports):

```powershell
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 🔄 Re-Seeding the Database (Demo Data)

If you ever want to reset the database and regenerate fresh data (1 Manager, 40 Students, 72 Meals across 18 days, 840 Skips, 56 Historical Actuals):

```powershell
.\venv\Scripts\python.exe -m backend.seed
```
*Alternatively, you can click the **"Reset Demo Data"** button directly inside the web app's top navigation bar.*

---

## 🔑 Login Credentials

The application includes pre-configured credentials for quick testing:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Mess Manager** | `manager@mess.com` | `manager123` | Kitchen Headcount Forecast, Cook Guidance, Log Actuals, Waste Analytics |
| **Student 1** | `student1@hostel.com` | `student123` | View next 3 days of meals, toggle Skip/Eat, view cutoff countdown |
| **Student 2** | `student2@hostel.com` | `student123` | Default "Eating" state, toggle meals |
| *(Students 3–40)* | `student3@hostel.com` ... `student40@hostel.com` | `student123` | 40 simulated hostel students |

> 💡 **Hackathon Tip**: On the `/login` page, click either the **"Student Demo"** or **"Manager Demo"** button to log in with 1 click without typing.

---

## 🛠️ Step-by-Step Walkthrough for Judges & Evaluation

### 1. Student Experience (`/student`)
1. Log in with **"Student Demo"** (`student1@hostel.com`).
2. See the next 3 days of scheduled meals (Breakfast, Lunch, Snacks, Dinner) with full menu details.
3. Observe that the default status is **"Eating"** (green checkmark badge).
4. Notice the **live countdown timer** (e.g., "Cutoff in 2h 45m").
5. Click **"Mark as Skip"** on tomorrow's breakfast:
   - Status instantly changes to **"Skipping"** with a toast alert.
   - You can click **"Cancel Skip (Eat)"** to return to eating.
6. Notice that meals whose cutoff time has passed are **locked** with a `🔒 Cutoff Passed` badge, strictly preventing late status modifications.

### 2. Manager Forecast Dashboard (`/manager`)
1. Log out and click **"Manager Demo"** (`manager@mess.com`).
2. Pick any date with the date selector (defaults to Today).
3. View the **guidance table**:
   - Shows total students (40) and aggregate skips per meal.
   - **Privacy Rule**: Student identities are completely anonymous; only aggregate numbers appear.
   - Shows **Predicted Headcount** and **Suggested Cook Plates** (which includes a 5% buffer).
   - Shows whether the prediction used the **Learned Correction** (moving average no-show model) or **Baseline Buffer**.
4. Click **"Log Actuals"** on any meal:
   - Enter cooked plates (e.g., `32`), served plates (e.g., `30`), leftover weight in kg (e.g., `0.7`), and optional notes.
   - Click **Save Actuals** &rarr; metrics update dynamically.

### 3. Waste Analytics & Audit Reports (`/manager/report`)
1. Click **"Waste Analytics & Reports"** in the top navigation bar.
2. Review the verified impact:
   - **Waste Reduction %**: Displays the percentage of food saved compared to static 95% cooking.
   - **Plates Saved**: Number of plates prevented from being trashed.
   - **Food Weight Saved (kg)**: Real kilograms diverted from waste bins.
   - **Mean Absolute Error (MAE)**: Measures accuracy between predicted headcount and actual plates served (~2–3 plates error).
3. Inspect the charts:
   - **Chart 1**: Line chart tracking Predicted vs Actual plates served over historical time series.
   - **Chart 2**: Bar chart comparing Total Cooked, Total Served, and Plates Wasted before vs after forecaster adoption.
4. **Audit Rule Verification**: If there are fewer than 3 logged meals, the page strictly displays an **"Insufficient Data"** shield, preventing unsubstantiated claims of waste reduction.

---

## 🔧 Troubleshooting

### Port 8000 or 5173 Already in Use
If a terminal was closed without stopping the background process, kill the existing process:
```powershell
# Check what is using port 8000
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# Check what is using port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### Python Virtual Environment Activation
If you prefer activating the virtual environment in your shell:
```powershell
.\venv\Scripts\Activate.ps1
# Then you can run bare commands:
uvicorn backend.main:app --reload --port 8000
pytest tests/ -v
```
*(If PowerShell blocks script execution, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

