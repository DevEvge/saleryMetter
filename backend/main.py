import os
import sqlite3
from typing import Optional
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, Float, String, Date, desc, BigInteger
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic import BaseModel, ValidationError
import datetime

# --- КОНФИГ БД (Абсолютний шлях) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "salary.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30} # <--- ОСЬ ЦЕ ВАЖЛИВО!
)
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

    def to_dict(self):
        return {
            "id": self.id,
            "telegram_id": self.telegram_id,
            "cost_per_point": self.cost_per_point,
            "departure_fee": self.departure_fee,
            "price_per_tone": self.price_per_tone
        }


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
    # --- Нові колонки: тарифи на момент створення запису ---
    saved_cost_per_point = Column(Float, default=0.0)
    saved_price_per_kg = Column(Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "telegram_id": self.telegram_id,
            "date": self.date.isoformat() if self.date else None,
            "record_type": self.record_type,
            "points": self.points,
            "additional_points": self.additional_points,
            "weight": self.weight,
            "fixed_payment": self.fixed_payment,
            "distance_km": self.distance_km,
            "price_per_km": self.price_per_km,
            "total_salary": self.total_salary,
            "saved_cost_per_point": self.saved_cost_per_point or 0,
            "saved_price_per_kg": self.saved_price_per_kg or 0,
        }


Base.metadata.create_all(bind=engine)

# --- АВТО-МІГРАЦІЯ (додає нові колонки якщо їх немає) ---
def run_migration():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    existing = [col[1] for col in cursor.execute("PRAGMA table_info(work_days)").fetchall()]
    if "saved_cost_per_point" not in existing:
        cursor.execute("ALTER TABLE work_days ADD COLUMN saved_cost_per_point FLOAT DEFAULT 0")
    if "saved_price_per_kg" not in existing:
        cursor.execute("ALTER TABLE work_days ADD COLUMN saved_price_per_kg FLOAT DEFAULT 0")
    conn.commit()
    conn.close()

run_migration()


# --- Pydantic SCHEMAS (Для валідації) ---
class SettingsUpdate(BaseModel):
    cost_per_point: int
    departure_fee: int
    price_per_tone: float


class WorkDayCreate(BaseModel):
    date: datetime.date
    record_type: str
    points: int = 0
    additional_points: int = 0
    weight: float = 0.0
    manual_payment: float = 0.0
    distance_km: float = 0.0
    price_per_km: float = 0.0


class BulkUpdateDepartureFee(BaseModel):
    date_from: datetime.date
    date_to: datetime.date
    new_departure_fee: float


class WorkDayUpdate(BaseModel):
    date: Optional[datetime.date] = None
    points: Optional[int] = None
    additional_points: Optional[int] = None
    weight: Optional[float] = None
    manual_payment: Optional[float] = None
    distance_km: Optional[float] = None
    price_per_km: Optional[float] = None
    fixed_payment: Optional[float] = None


# --- APP ---
app = Flask(__name__)
# Максимально "широка" конфігурація CORS
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["*", "X-Telegram-ID"])


# --- Helper ---
def get_header_user_id():
    """Отримуємо ID з хедера або ставимо 1 для тестів"""
    try:
        return int(request.headers.get("X-Telegram-ID", 1))
    except ValueError:
        return 1


def recalculate_salary(record, settings):
    """Перерахувати зарплату запису, використовуючи збережені тарифи (або fallback на поточні)."""
    cpp = record.saved_cost_per_point if record.saved_cost_per_point else float(settings.cost_per_point)
    ppkg = record.saved_price_per_kg if record.saved_price_per_kg else settings.price_per_tone

    if record.record_type == 'CITY_MAIN':
        record.total_salary = record.fixed_payment + (cpp * (record.points + record.additional_points)) + (record.weight * ppkg)
    elif record.record_type == 'CITY_EXTRA':
        record.total_salary = record.fixed_payment + (cpp * (record.points + record.additional_points)) + (record.weight * ppkg)
    elif record.record_type == 'INTERCITY':
        record.total_salary = record.distance_km * record.price_per_km


# --- API ---

@app.route("/api/settings", methods=["GET"])
def get_settings():
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()
        settings = db.query(Settings).filter(Settings.telegram_id == tg_id).first()

        if not settings:
            settings = Settings(telegram_id=tg_id)
            db.add(settings)
            db.commit()

        return jsonify(settings.to_dict())
    finally:
        db.close()


@app.route("/api/settings", methods=["PUT"])
def update_settings():
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()
        # Валідація даних через Pydantic
        try:
            data = SettingsUpdate(**request.json)
        except ValidationError as e:
            return jsonify({"error": e.errors()}), 422

        settings = db.query(Settings).filter(Settings.telegram_id == tg_id).first()
        if not settings:
            settings = Settings(telegram_id=tg_id)
            db.add(settings)

        settings.cost_per_point = data.cost_per_point
        settings.departure_fee = data.departure_fee
        settings.price_per_tone = data.price_per_tone

        db.commit()
        return jsonify({"status": "ok"})
    finally:
        db.close()


@app.route("/api/days", methods=["POST"])
def add_work_day():
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()

        # Перевіряємо налаштування (або створюємо)
        settings = db.query(Settings).filter(Settings.telegram_id == tg_id).first()
        if not settings:
            settings = Settings(telegram_id=tg_id)
            db.add(settings)
            db.commit()

        # Валідація вхідних даних
        try:
            data = WorkDayCreate(**request.json)
        except ValidationError as e:
            return jsonify({"error": e.errors()}), 422

        salary = 0.0
        fixed_part = 0.0

        if data.record_type == 'CITY_MAIN':
            fixed_part = float(settings.departure_fee)
            salary = fixed_part + (float(settings.cost_per_point) * (data.points + data.additional_points)) + (
                        data.weight * settings.price_per_tone)
        elif data.record_type == 'CITY_EXTRA':
            fixed_part = data.manual_payment
            salary = fixed_part + (float(settings.cost_per_point) * (data.points + data.additional_points)) + (
                        data.weight * settings.price_per_tone)
        elif data.record_type == 'INTERCITY':
            salary = data.distance_km * data.price_per_km

        new_day = WorkDay(
            telegram_id=tg_id,
            date=data.date,
            record_type=data.record_type,
            points=data.points,
            additional_points=data.additional_points,
            weight=data.weight,
            fixed_payment=fixed_part,
            distance_km=data.distance_km,
            price_per_km=data.price_per_km,
            total_salary=salary,
            # Зберігаємо тарифи на момент створення
            saved_cost_per_point=float(settings.cost_per_point),
            saved_price_per_kg=settings.price_per_tone,
        )
        db.add(new_day)
        db.commit()
        return jsonify({"status": "saved", "salary": salary})
    finally:
        db.close()


@app.route("/api/stats/<int:year>/<int:month>", methods=["GET"])
def get_stats(year, month):
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()
        # Формуємо дати
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{year}-{month:02d}-31"

        days = db.query(WorkDay).filter(
            WorkDay.telegram_id == tg_id,
            WorkDay.date.between(start_date, end_date)
        ).order_by(desc(WorkDay.date)).all()

        total_salary = sum(d.total_salary for d in days)
        total_km = sum(d.distance_km for d in days)
        total_points = sum(d.points + d.additional_points for d in days)
        total_weight = sum(d.weight for d in days)
        total_days = len(days)

        return jsonify({
            "total_salary": total_salary,
            "total_km": total_km,
            "total_points": total_points,
            "total_weight": total_weight,
            "total_days": total_days,
            "history": [d.to_dict() for d in days]
        })
    finally:
        db.close()


@app.route("/api/days/<int:day_id>", methods=["DELETE"])
def delete_day(day_id):
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()
        record = db.query(WorkDay).filter(WorkDay.id == day_id, WorkDay.telegram_id == tg_id).first()
        if record:
            db.delete(record)
            db.commit()
            return jsonify({"status": "deleted"})
        return jsonify({"detail": "Record not found"}), 404
    finally:
        db.close()


# --- НОВИЙ: Масове оновлення оплати за виїзд (метод різниці) ---
@app.route("/api/days/bulk-update-departure", methods=["PUT"])
def bulk_update_departure():
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()

        try:
            data = BulkUpdateDepartureFee(**request.json)
        except ValidationError as e:
            return jsonify({"error": e.errors()}), 422

        if data.date_from > data.date_to:
            return jsonify({"error": "date_from must be <= date_to"}), 422

        records = db.query(WorkDay).filter(
            WorkDay.telegram_id == tg_id,
            WorkDay.date.between(data.date_from.isoformat(), data.date_to.isoformat()),
            WorkDay.record_type == 'CITY_MAIN'
        ).all()

        count = 0
        for record in records:
            old_fixed = record.fixed_payment or 0
            record.total_salary = record.total_salary - old_fixed + data.new_departure_fee
            record.fixed_payment = data.new_departure_fee
            count += 1

        db.commit()
        return jsonify({"status": "updated", "count": count})
    finally:
        db.close()


# --- НОВИЙ: Редагування запису ---
@app.route("/api/days/<int:day_id>", methods=["PUT"])
def update_day(day_id):
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()

        record = db.query(WorkDay).filter(WorkDay.id == day_id, WorkDay.telegram_id == tg_id).first()
        if not record:
            return jsonify({"detail": "Record not found"}), 404

        try:
            data = WorkDayUpdate(**request.json)
        except ValidationError as e:
            return jsonify({"error": e.errors()}), 422

        # Завантажуємо налаштування (потрібні для fallback)
        settings = db.query(Settings).filter(Settings.telegram_id == tg_id).first()
        if not settings:
            settings = Settings(telegram_id=tg_id)
            db.add(settings)
            db.commit()

        # Оновлюємо тільки передані поля
        if data.date is not None:
            record.date = data.date
        if data.points is not None:
            record.points = data.points
        if data.additional_points is not None:
            record.additional_points = data.additional_points
        if data.weight is not None:
            record.weight = data.weight
        if data.distance_km is not None:
            record.distance_km = data.distance_km
        if data.price_per_km is not None:
            record.price_per_km = data.price_per_km

        # Оплата за виїзд
        if data.fixed_payment is not None:
            record.fixed_payment = data.fixed_payment
        elif data.manual_payment is not None and record.record_type == 'CITY_EXTRA':
            record.fixed_payment = data.manual_payment

        # Перерахунок зарплати
        recalculate_salary(record, settings)

        db.commit()
        return jsonify({"status": "updated", "salary": record.total_salary})
    finally:
        db.close()


@app.route("/api/wipe", methods=["DELETE"])
def wipe_all_user_data():
    db = SessionLocal()
    try:
        tg_id = get_header_user_id()
        db.query(WorkDay).filter(WorkDay.telegram_id == tg_id).delete()
        db.query(Settings).filter(Settings.telegram_id == tg_id).delete()
        db.commit()
        return jsonify({"status": "all user data wiped"})
    finally:
        db.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)