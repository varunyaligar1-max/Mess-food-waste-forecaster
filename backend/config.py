import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'mess_waste.db'}")
SECRET_KEY = os.getenv("SECRET_KEY", "mess-food-waste-forecaster-hackathon-secret-key-2026-supersecure!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ENV = os.getenv("ENV", "development")
BUFFER_PERCENTAGE = float(os.getenv("BUFFER_PERCENTAGE", "0.05"))

