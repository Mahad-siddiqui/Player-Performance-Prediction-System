from pydantic import BaseModel


class AdminOverview(BaseModel):
    players: int
    matches: int
    wellness_records: int
    predictions: int
    avg_predicted_rating: float
    high_injury_risk_count: int
