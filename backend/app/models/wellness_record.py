from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class WellnessRecord(Base):
    __tablename__ = 'wellness_records'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey('players.id', ondelete='CASCADE'), index=True)
    record_date: Mapped[date] = mapped_column(Date, index=True)
    heart_rate: Mapped[int] = mapped_column(Integer, default=0)
    fatigue_score: Mapped[float] = mapped_column(Float, default=0)
    sleep_quality: Mapped[float] = mapped_column(Float, default=0)
    hydration: Mapped[float] = mapped_column(Float, default=0)
    muscle_soreness: Mapped[float] = mapped_column(Float, default=0)
    recovery_score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
