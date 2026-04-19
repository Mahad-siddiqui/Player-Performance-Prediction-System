from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Prediction(Base):
    __tablename__ = 'predictions'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey('players.id', ondelete='CASCADE'), index=True)
    model_type: Mapped[str] = mapped_column(String(30), nullable=False)
    predicted_rating: Mapped[float] = mapped_column(Float, nullable=False)
    injury_risk_probability: Mapped[float] = mapped_column(Float, nullable=False)
    injury_risk_label: Mapped[str] = mapped_column(String(10), nullable=False)
    shap_summary: Mapped[dict] = mapped_column(JSON, default={})
    feature_snapshot: Mapped[dict] = mapped_column(JSON, default={})
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
