import os
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, Float, String, Date, desc, BigInteger
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic import BaseModel, ValidationError
from datetime import date

# --- КОНФИГ БД (Абсолютний шлях) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "salary.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

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
            "total_salary": self.total_salary
        }


Base.metadata.create_all(bind=engine)


# --- Pydantic SCHEMAS (Для валідації) ---
class SettingsUpdate(BaseModel):
    cost_per_point: int
    departure_fee: int
    price_per_tone: float


class WorkDayCreate(BaseModel):
    date: date
    record_type: str
    points: int = 0
    additional_points: int = 0
    weight: float = 0.0
    manual_payment: float = 0.0
    distance_km: float = 0.0
    price_per_km: float = 0.0


# --- APP ---
app = Flask(__name__)
# Максимально "широка" конфігурація CORS
CORS(app, 
     origins=[
         "https://salery-metter-40ujtluxf-devevges-projects.vercel.app", 
         "http://localhost:3000"
     ], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "X-Telegram-ID", "Authorization", "X-Requested-With"],
     supports_credentials=True
)


# --- Helper ---
def get_header_user_id():
    """Отримуємо ID з хедера або ставимо 1 для тестів"""
    try:
        return int(request.headers.get("X-Telegram-ID", 1))
    except ValueError:
        return 1


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
            total_salary=salary
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