from pydantic import BaseModel


class TrainResponse(BaseModel):
    trained_rows: int
    features: list[str]
    models_saved: list[str]


class PredictionResponse(BaseModel):
    player_id: int
    player_name: str
    predicted_rating: float
    injury_risk_probability: float
    injury_risk_label: str
    top_factors: list[dict]
