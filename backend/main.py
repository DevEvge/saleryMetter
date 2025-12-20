from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, Float, String, Date, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- КОНФИГ БД ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./salary.db"
# check_same_thread=False нужно для SQLite
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- МОДЕЛИ ДАННЫХ (ТАБЛИЦЫ) ---

class Settings(Base):
    """Настройки тарифов (по умолчанию)"""
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    cost_per_point = Column(Integer, default=0)  # Цена за точку (Город)
    departure_fee = Column(Integer, default=0)  # Ставка за выезд (Город - Основной)
    price_per_tone = Column(Float, default=0.0)  # Цена за тонну (Город)


class WorkDay(Base):
    """Единая таблица для всех видов работ"""
    __tablename__ = "work_days"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)

    # Тип записи:
    # 'CITY_MAIN' (Город осн.), 'CITY_EXTRA' (Город доп.), 'INTERCITY' (Межгород)
    record_type = Column(String)

    # --- Поля для ГОРОДА ---
    points = Column(Integer, default=0)  # Точки
    additional_points = Column(Integer, default=0)  # Доп. точки
    weight = Column(Float, default=0.0)  # Вес
    fixed_payment = Column(Float, default=0.0)  # Фикса (ставка или ручной ввод)

    # --- Поля для МЕЖГОРОДА ---
    distance_km = Column(Float, default=0.0)  # Километры
    price_per_km = Column(Float, default=0.0)  # Цена за км (вводится руками)

    # ИТОГ (Считаем сразу при сохранении)
    total_salary = Column(Float, default=0.0)


# Создаем таблицы, если их нет
Base.metadata.create_all(bind=engine)


# --- PYDANTIC СХЕМЫ (Для общения с Фронтом) ---

class SettingsUpdate(BaseModel):
    cost_per_point: int
    departure_fee: int
    price_per_tone: float


class WorkDayCreate(BaseModel):
    date: date
    record_type: str  # 'CITY_MAIN', 'CITY_EXTRA', 'INTERCITY'

    # Опциональные поля (зависят от типа)
    points: Optional[int] = 0
    additional_points: Optional[int] = 0
    weight: Optional[float] = 0.0
    manual_payment: Optional[float] = 0.0  # Ввод для CITY_EXTRA

    distance_km: Optional[float] = 0.0  # Для INTERCITY
    price_per_km: Optional[float] = 0.0  # Для INTERCITY


# --- ПРИЛОЖЕНИЕ ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- API ---

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    """Получить текущие настройки. Если нет - создать нули."""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(cost_per_point=0, departure_fee=0, price_per_tone=0.0)
        db.add(settings)
        db.commit()
    return settings


@app.put("/api/settings")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    """Обновить настройки"""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)

    settings.cost_per_point = data.cost_per_point
    settings.departure_fee = data.departure_fee
    settings.price_per_tone = data.price_per_tone
    db.commit()
    return {"status": "ok"}


@app.post("/api/days")
def add_work_day(data: WorkDayCreate, db: Session = Depends(get_db)):
    """Сохранение рабочего дня (Любой тип)"""
    settings = db.query(Settings).first()

    salary = 0.0
    fixed_part = 0.0

    # 1. ЛОГИКА ГОРОДА (ОСНОВНОЙ)
    if data.record_type == 'CITY_MAIN':
        fixed_part = settings.departure_fee  # Берем из настроек
        salary = fixed_part + \
                 (settings.cost_per_point * (data.points + data.additional_points)) + \
                 (data.weight * settings.price_per_tone)

    # 2. ЛОГИКА ГОРОДА (ДОПОЛНИТЕЛЬНЫЙ)
    elif data.record_type == 'CITY_EXTRA':
        fixed_part = data.manual_payment  # Берем то, что ввел папа
        salary = fixed_part + \
                 (settings.cost_per_point * (data.points + data.additional_points)) + \
                 (data.weight * settings.price_per_tone)

    # 3. ЛОГИКА МЕЖГОРОД
    elif data.record_type == 'INTERCITY':
        # Простая формула: КМ * Цена
        salary = data.distance_km * data.price_per_km

    # Создаем запись
    new_day = WorkDay(
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
def get_stats(year: int, month: int, db: Session = Depends(get_db)):
    """Статистика за месяц + список дней"""

    # Фильтруем по году и месяцу (SQLite style)
    # Месяц приходит числом (1-12), форматируем в 01-12
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-31"

    days = db.query(WorkDay) \
        .filter(WorkDay.date.between(start_date, end_date)) \
        .order_by(desc(WorkDay.date)) \
        .all()

    total_salary = sum(d.total_salary for d in days)
    # Считаем отдельно межгород и город для красоты, если надо
    total_km = sum(d.distance_km for d in days)

    return {
        "total_salary": total_salary,
        "total_km": total_km,
        "history": days
    }


@app.delete("/api/days/{day_id}")
def delete_day(day_id: int, db: Session = Depends(get_db)):
    """Удалить запись (если ошибся)"""
    record = db.query(WorkDay).filter(WorkDay.id == day_id).first()
    if record:
        db.delete(record)
        db.commit()
    return {"status": "deleted"}


# Раздача фронта (в самом конце)
try:
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
except:
    pass