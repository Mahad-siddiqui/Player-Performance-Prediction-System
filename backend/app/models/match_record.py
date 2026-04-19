from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class MatchRecord(Base):
    __tablename__ = 'match_records'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey('players.id', ondelete='CASCADE'), index=True)
    match_date: Mapped[date] = mapped_column(Date, index=True)
    opponent: Mapped[str] = mapped_column(String(120), nullable=False)
    goals: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    tackles: Mapped[int] = mapped_column(Integer, default=0)
    distance_covered: Mapped[float] = mapped_column(Float, default=0)
    speed: Mapped[float] = mapped_column(Float, default=0)
    shots: Mapped[int] = mapped_column(Integer, default=0)
    pass_accuracy: Mapped[float] = mapped_column(Float, default=0)
    minutes_played: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
