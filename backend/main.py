import os
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, Float, String, Date, desc, BigInteger
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- КОНФИГ БД ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./salary.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- МОДЕЛИ ДАННЫХ ---
class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, index=True)
    cost_per_point = Column(Integer, default=0)
    departure_fee = Column(Integer, default=0)
    price_per_tone = Column(Float, default=0.0)

class WorkDay(Base):
    __tablename__ = "work_days"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, index=True)
    date = Column(Date, index=True)
    record_type = Column(String)
    points = Column(Integer, default=0)
    additional_points = Column(Integer, default=0)
    weight = Column(Float, default=0.0)
    fixed_payment = Column(Float, default=0.0)
    distance_km = Column(Float, default=0.0)
    price_per_km = Column(Float, default=0.0)
    total_salary = Column(Float, default=0.0)

Base.metadata.create_all(bind=engine)

# --- SCHEMAS ---
class SettingsUpdate(BaseModel):
    cost_per_point: int
    departure_fee: int
    price_per_tone: float

class WorkDayCreate(BaseModel):
    date: date
    record_type: str
    points: Optional[int] = 0
    additional_points: Optional[int] = 0
    weight: Optional[float] = 0.0
    manual_payment: Optional[float] = 0.0
    distance_km: Optional[float] = 0.0
    price_per_km: Optional[float] = 0.0

# --- APP ---
app = FastAPI()

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Telegram-ID"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API ---
@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    settings = db.query(Settings).filter(Settings.telegram_id == x_telegram_id).first()
    if not settings:
        settings = Settings(telegram_id=x_telegram_id)
        db.add(settings)
        db.commit()
    return settings

@app.put("/api/settings")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    settings = db.query(Settings).filter(Settings.telegram_id == x_telegram_id).first()
    if not settings:
        settings = Settings(telegram_id=x_telegram_id)
        db.add(settings)
    settings.cost_per_point = data.cost_per_point
    settings.departure_fee = data.departure_fee
    settings.price_per_tone = data.price_per_tone
    db.commit()
    return {"status": "ok"}

@app.post("/api/days")
def add_work_day(data: WorkDayCreate, db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    settings = db.query(Settings).filter(Settings.telegram_id == x_telegram_id).first()
    if not settings:
        settings = Settings(telegram_id=x_telegram_id)
        db.add(settings)
        db.commit()

    salary = 0.0
    fixed_part = 0.0

    if data.record_type == 'CITY_MAIN':
        fixed_part = settings.departure_fee
        salary = fixed_part + (settings.cost_per_point * (data.points + data.additional_points)) + (data.weight * settings.price_per_tone)
    elif data.record_type == 'CITY_EXTRA':
        fixed_part = data.manual_payment
        salary = fixed_part + (settings.cost_per_point * (data.points + data.additional_points)) + (data.weight * settings.price_per_tone)
    elif data.record_type == 'INTERCITY':
        salary = data.distance_km * data.price_per_km

    new_day = WorkDay(
        telegram_id=x_telegram_id,
        date=data.date,
        record_type=data.record_type,
        points=data.points,
        additional_points=data.additional_points,
        weight=data.weight,
        fixed_payment=fixed_part,
        distance_km=data.distance_km,
        price_per_km=data.price_per_km,
        total_salary=salary
    )
    db.add(new_day)
    db.commit()
    return {"status": "saved", "salary": salary}

@app.get("/api/stats/{year}/{month}")
def get_stats(year: int, month: int, db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-31"
    days = db.query(WorkDay).filter(WorkDay.telegram_id == x_telegram_id).filter(WorkDay.date.between(start_date, end_date)).order_by(desc(WorkDay.date)).all()
    total_salary = sum(d.total_salary for d in days)
    total_km = sum(d.distance_km for d in days)
    return {"total_salary": total_salary, "total_km": total_km, "history": days}

@app.delete("/api/days/{day_id}")
def delete_day(day_id: int, db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    record = db.query(WorkDay).filter(WorkDay.id == day_id, WorkDay.telegram_id == x_telegram_id).first()
    if record:
        db.delete(record)
        db.commit()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Record not found")

@app.delete("/api/wipe")
def wipe_all_user_data(db: Session = Depends(get_db), x_telegram_id: int = Header(1)):
    """Полностью удаляет все данные пользователя (настройки и историю)."""
    
    db.query(WorkDay).filter(WorkDay.telegram_id == x_telegram_id).delete()
    db.query(Settings).filter(Settings.telegram_id == x_telegram_id).delete()
    
    db.commit()
    
    return {"status": "all user data wiped"}

# --- СТАТИКА (Front-End) ---
script_dir = os.path.dirname(os.path.abspath(__file__))
static_directory = os.path.join(script_dir, "static")

if os.path.exists(static_directory):
    app.mount("/", StaticFiles(directory=static_directory, html=True), name="static")
else:
    print(f"\n⚠️  ВНИМАНИЕ: Папка static не найдена по пути: {static_directory}")
    print("⚠️  Сайт не откроется. Сначала сделай 'npm run build' и перенеси файлы!\n")

# --- ЗАПУСК ---
if __name__ == "__main__":
    try:
        from pyngrok import ngrok
        
        # Простое подключение без лишних параметров
        public_url = ngrok.connect(8000).public_url
        print("\n" + "="*60)
        print(f"🚀 ТВОЯ ССЫЛКА ДЛЯ ТЕЛЕГРАМА: {public_url}")
        print("="*60 + "\n")
    except Exception as e:
        print(f"⚠️ Ошибка запуска Ngrok: {e}")
        print("Запускаю только локальный сервер...")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)