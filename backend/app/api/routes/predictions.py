from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.player import Player
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionResponse, TrainResponse
from app.services.ml_pipeline import predict_for_player, train_models


router = APIRouter()


def _save_prediction(db: Session, player_id: int, result: dict) -> None:
    db.add(Prediction(
        player_id=player_id,
        model_type='rf+svm',
        predicted_rating=result['predicted_rating'],
        injury_risk_probability=result['injury_risk_probability'],
        injury_risk_label=result['injury_risk_label'],
        shap_summary={'top_factors': result['top_factors']},
        feature_snapshot=result['feature_snapshot'],
    ))


def _generate_predictions_for_all(db: Session) -> dict:
    players = db.query(Player).all()
    created = 0
    skipped = 0

    for player in players:
        try:
            result = predict_for_player(db, player.id)
            _save_prediction(db, player.id, result)
            created += 1
        except Exception:
            skipped += 1

    db.commit()
    return {'created': created, 'skipped': skipped}


@router.post('/train', response_model=TrainResponse)
def train(db: Session = Depends(get_db)):
    try:
        trained = train_models(db)
        generated = _generate_predictions_for_all(db)
        return {
            **trained,
            'predictions_created': generated['created'],
            'predictions_skipped': generated['skipped'],
        }
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

    _save_prediction(db, player_id, result)
    db.commit()

    return PredictionResponse(
        player_id=player_id,
        player_name=player.name,
        predicted_rating=result['predicted_rating'],
        injury_risk_probability=result['injury_risk_probability'],
        injury_risk_label=result['injury_risk_label'],
        top_factors=result['top_factors'],
    )


@router.post('/generate-all')
def predict_all_players(db: Session = Depends(get_db)):
    try:
        return _generate_predictions_for_all(db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
