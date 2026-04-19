from statistics import mean
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.player import Player
from app.models.match_record import MatchRecord
from app.models.wellness_record import WellnessRecord
from app.models.prediction import Prediction
from app.schemas.reports import AdminOverview


router = APIRouter()


@router.get('/admin/overview', response_model=AdminOverview)
def admin_overview(db: Session = Depends(get_db)):
    players = db.query(func.count(Player.id)).scalar() or 0
    matches = db.query(func.count(MatchRecord.id)).scalar() or 0
    wellness_records = db.query(func.count(WellnessRecord.id)).scalar() or 0
    predictions = db.query(func.count(Prediction.id)).scalar() or 0
    avg_predicted_rating = db.query(func.avg(Prediction.predicted_rating)).scalar() or 0
    high_injury_risk_count = db.query(func.count(Prediction.id)).filter(Prediction.injury_risk_label == 'High').scalar() or 0

    return AdminOverview(
        players=int(players),
        matches=int(matches),
        wellness_records=int(wellness_records),
        predictions=int(predictions),
        avg_predicted_rating=float(round(avg_predicted_rating, 2)),
        high_injury_risk_count=int(high_injury_risk_count),
    )


@router.get('/manager/players')
def manager_players(db: Session = Depends(get_db)):
    players = db.query(Player).all()

    output = []
    for p in players:
        latest_wellness = (
            db.query(WellnessRecord)
            .filter(WellnessRecord.player_id == p.id)
            .order_by(WellnessRecord.record_date.desc())
            .first()
        )
        latest_match = (
            db.query(MatchRecord)
            .filter(MatchRecord.player_id == p.id)
            .order_by(MatchRecord.match_date.desc())
            .first()
        )
        latest_prediction = (
            db.query(Prediction)
            .filter(Prediction.player_id == p.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )

        fatigue = float(latest_wellness.fatigue_score) if latest_wellness else 45.0
        recovery = float(latest_wellness.recovery_score) if latest_wellness else 72.0
        fitness_score = max(1.0, min(99.0, 100 - fatigue * 0.6 + (recovery - 50) * 0.3))

        if fitness_score >= 80:
            health = 'Fit'
        elif fitness_score >= 62:
            health = 'Doubtful'
        else:
            health = 'Injured'

        injury_risk = latest_prediction.injury_risk_label if latest_prediction else ('Low' if health == 'Fit' else 'Medium' if health == 'Doubtful' else 'High')

        output.append(
            {
                'id': p.external_id,
                'name': p.name,
                'position': p.position,
                'number': p.number,
                'age': p.age,
                'nationality': p.nationality,
                'photo': ''.join([s[0] for s in p.name.split(' ')[:2]]).upper(),
                'health': health,
                'fitnessScore': round(fitness_score, 1),
                'fatigueLevel': round(fatigue, 1),
                'heartRate': int(latest_wellness.heart_rate) if latest_wellness else 68,
                'predictedRating': round(float(latest_prediction.predicted_rating), 2) if latest_prediction else 7.0,
                'goals': int(latest_match.goals) if latest_match else 0,
                'assists': int(latest_match.assists) if latest_match else 0,
                'passAccuracy': round(float(latest_match.pass_accuracy), 1) if latest_match else 80.0,
                'tackles': int(latest_match.tackles) if latest_match else 0,
                'distanceCovered': round(float(latest_match.distance_covered), 2) if latest_match else 9.1,
                'speed': round(float(latest_match.speed), 1) if latest_match else 29.0,
                'dribbles': int((int(latest_match.shots) if latest_match else 1) * 3),
                'shots': int(latest_match.shots) if latest_match else 0,
                'injuryRisk': injury_risk,
                'lastMatchRating': round(float(latest_prediction.predicted_rating), 2) if latest_prediction else 7.0,
                'weeklyTrainingLoad': round(fatigue * 1.1, 1),
                'sleepQuality': round(float(latest_wellness.sleep_quality), 1) if latest_wellness else 76.0,
                'hydration': round(float(latest_wellness.hydration), 1) if latest_wellness else 74.0,
                'muscleSoreness': round(float(latest_wellness.muscle_soreness), 1) if latest_wellness else 30.0,
            }
        )

    return output


@router.get('/fan/insights')
def fan_insights(db: Session = Depends(get_db)):
    latest_predictions = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )
    avg_rating = sum(p.predicted_rating for p in latest_predictions) / len(latest_predictions) if latest_predictions else 0

    low = sum(1 for p in latest_predictions if p.injury_risk_label == 'Low')
    medium = sum(1 for p in latest_predictions if p.injury_risk_label == 'Medium')
    high = sum(1 for p in latest_predictions if p.injury_risk_label == 'High')

    return {
        'avgPredictedRating': round(avg_rating, 2),
        'injuryRiskDistribution': {'Low': low, 'Medium': medium, 'High': high},
        'sampleSize': len(latest_predictions),
    }


@router.get('/fan/dashboard')
def fan_dashboard(db: Session = Depends(get_db)):
    players = manager_players(db)
    fit_players = [p for p in players if p['health'] == 'Fit']
    comparison_players = fit_players[:12] if fit_players else players[:12]

    top = sorted(players, key=lambda p: p['predictedRating'], reverse=True)[:5]
    goal_contributions = [
        {
            'player': f"{p['name'].split(' ')[0]} {p['name'].split(' ')[1][0]}." if len(p['name'].split(' ')) > 1 else p['name'],
            'predicted': round(max(0.1, p['predictedRating'] / 5), 1),
            'actual': int(p['goals']),
            'assists': round(max(0.0, p['assists'] * 0.5), 1),
        }
        for p in top
    ]

    form_source = [p['predictedRating'] for p in top] or [7.0]
    form_base = round(mean(form_source) * 10)
    team_form = [
        {'week': 'GW28', 'rating': max(55, form_base - 9), 'opponent': 'City FC'},
        {'week': 'GW29', 'rating': max(55, form_base - 3), 'opponent': 'United SC'},
        {'week': 'GW30', 'rating': max(55, form_base - 12), 'opponent': 'Rovers FC'},
        {'week': 'GW31', 'rating': min(96, form_base + 2), 'opponent': 'Athletic CF'},
        {'week': 'GW32', 'rating': min(96, form_base + 1), 'opponent': 'Valley FC'},
        {'week': 'GW33 (pred)', 'rating': min(96, form_base + 3), 'opponent': 'Dynamo FC'},
    ]

    return {
        'comparisonPlayers': comparison_players,
        'goalContributions': goal_contributions,
        'teamForm': team_form,
    }
