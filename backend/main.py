from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from backend.database import create_db_and_tables
from backend.routers.admin import router as admin_router
from backend.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables on startup
    create_db_and_tables()
    yield


app = FastAPI(
    title="Mess Food-Waste Forecaster API",
    description="""
API for Mess Food-Waste Forecaster.
Reduces hostel mess food waste through student meal-skip declarations and ML-based headcount prediction.

### Key Roles:
- **Student**: Mark meals to skip in advance (before cutoff), view upcoming menus.
- **Mess Manager**: View aggregate forecast headcount, record actual plates served & leftover kg, analyze waste reports.

### Swagger Authentication:
Click **Authorize** (top right) and enter your JWT Bearer token obtained from `/api/auth/login` or `/api/auth/register`.
""",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "mess-food-waste-forecaster",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }
