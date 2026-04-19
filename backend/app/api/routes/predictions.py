from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.player import Player
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionResponse, TrainResponse
from app.services.ml_pipeline import predict_for_player, train_models


router = APIRouter()


@router.post('/train', response_model=TrainResponse)
def train(db: Session = Depends(get_db)):
    try:
        return train_models(db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/player/{player_id}', response_model=PredictionResponse)
def predict_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail='Player not found')

    try:
        result = predict_for_player(db, player_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    db.add(Prediction(
        player_id=player_id,
        model_type='rf+svm',
        predicted_rating=result['predicted_rating'],
        injury_risk_probability=result['injury_risk_probability'],
        injury_risk_label=result['injury_risk_label'],
        shap_summary={'top_factors': result['top_factors']},
        feature_snapshot=result['feature_snapshot'],
    ))
    db.commit()

    return PredictionResponse(
        player_id=player_id,
        player_name=player.name,
        predicted_rating=result['predicted_rating'],
        injury_risk_probability=result['injury_risk_probability'],
        injury_risk_label=result['injury_risk_label'],
        top_factors=result['top_factors'],
    )
