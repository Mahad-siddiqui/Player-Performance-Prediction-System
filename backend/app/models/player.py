from datetime import datetime
from sqlalchemy import DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Player(Base):
    __tablename__ = 'players'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    position: Mapped[str] = mapped_column(String(20), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    nationality: Mapped[str] = mapped_column(String(80), nullable=False)
    team: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
