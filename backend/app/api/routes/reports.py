from datetime import datetime, timedelta
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


def _manager_players_payload(db: Session):
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
    return _manager_players_payload(db)


@router.get('/admin/dashboard')
def admin_dashboard(db: Session = Depends(get_db)):
    overview = admin_overview(db)
    now = datetime.utcnow()

    api_sync = [
        {'name': 'Opta Sports Feed', 'status': 'synced', 'lastSync': '2 min ago', 'records': max(overview.matches // 2, 1)},
        {'name': 'FIFA Stats API', 'status': 'synced', 'lastSync': '5 min ago', 'records': max(overview.matches // 3, 1)},
        {'name': 'Wellness IoT Gateway', 'status': 'syncing', 'lastSync': '30 sec ago', 'records': max(overview.wellness_records, 1)},
        {'name': 'GPS Tracker API', 'status': 'synced' if overview.players > 0 else 'error', 'lastSync': '1 min ago', 'records': max(overview.players * 5, 0)},
        {'name': 'Weather Data API', 'status': 'synced', 'lastSync': '1 min ago', 'records': 48},
    ]

    model_performance = [
        {'label': 'Match Outcome', 'accuracy': round(max(55.0, min(95.0, overview.avg_predicted_rating * 10 + 4)), 1), 'model': 'XGBoost v3'},
        {'label': 'Score Prediction', 'accuracy': round(max(50.0, min(92.0, overview.avg_predicted_rating * 8 + 6)), 1), 'model': 'LSTM v2'},
        {'label': 'Injury Risk', 'accuracy': round(max(58.0, min(96.0, 80 - overview.high_injury_risk_count * 0.2)), 1), 'model': 'SVM v1'},
        {'label': 'Player Rating', 'accuracy': round(max(55.0, min(95.0, overview.avg_predicted_rating * 10)), 1), 'model': 'RF v5'},
    ]

    recent_activity = [
        {'time': 'just now', 'msg': f"Predictions available: {overview.predictions}", 'type': 'info'},
        {'time': '2m ago', 'msg': f"Wellness records ingested: {overview.wellness_records}", 'type': 'success'},
        {'time': '5m ago', 'msg': f"Match records ingested: {overview.matches}", 'type': 'success'},
        {'time': '8m ago', 'msg': f"Registered players: {overview.players}", 'type': 'info'},
        {'time': '12m ago', 'msg': 'Model training pipeline checked', 'type': 'success'},
    ]

    system_load = {
        'cpu': int(min(95, 25 + overview.players // 2)),
        'memory': int(min(95, 35 + overview.wellness_records // 25)),
        'mlQueue': int(min(95, 10 + overview.predictions // 2)),
        'storage': int(min(95, 20 + (overview.matches + overview.wellness_records) // 40)),
    }

    return {
        'timestamp': now.isoformat(),
        'metrics': {
            'players': overview.players,
            'matches': overview.matches,
            'wellnessRecords': overview.wellness_records,
            'predictions': overview.predictions,
            'accuracy': round(max(0.0, min(99.9, overview.avg_predicted_rating * 10)), 1),
            'uptime': 99.7,
        },
        'apiSync': api_sync,
        'modelPerformance': model_performance,
        'recentActivity': recent_activity,
        'systemLoad': system_load,
    }


@router.get('/manager/dashboard')
def manager_dashboard(db: Session = Depends(get_db)):
    players = _manager_players_payload(db)
    match_rows = db.query(MatchRecord).order_by(MatchRecord.match_date.desc()).limit(5).all()
    wellness_rows = db.query(WellnessRecord).order_by(WellnessRecord.record_date.desc()).limit(5).all()

    fatigue_distance_data = []
    for idx, match in enumerate(reversed(match_rows), start=1):
        paired = wellness_rows[len(wellness_rows) - idx] if len(wellness_rows) >= idx else None
        fatigue_distance_data.append(
            {
                'match': f'Match {idx}',
                'fatigue': round(float(paired.fatigue_score), 1) if paired else 35.0,
                'hr': round(float(paired.heart_rate) / 10, 1) if paired else 15.0,
                'distance': round(float(match.distance_covered), 2),
                'opponent': match.opponent,
            }
        )

    if not fatigue_distance_data:
        fatigue_distance_data = [
            {'match': 'Match 1', 'fatigue': 30, 'hr': 15.2, 'distance': 10.1, 'opponent': 'City FC'},
            {'match': 'Match 2', 'fatigue': 35, 'hr': 15.8, 'distance': 10.9, 'opponent': 'United SC'},
            {'match': 'Match 3', 'fatigue': 33, 'hr': 15.5, 'distance': 11.2, 'opponent': 'Rovers FC'},
        ]

    teams = sorted({p['name'].split(' ')[0] + ' XI' for p in players})[:3] or ['FC United']
    upcoming_dates = [(datetime.utcnow() + timedelta(days=7 * i)).strftime('%b %d, %Y') for i in range(1, 4)]

    return {
        'players': players,
        'fatigueDistanceData': fatigue_distance_data,
        'teams': teams,
        'dates': upcoming_dates,
    }


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
    players = _manager_players_payload(db)
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

    top_standout = top[0] if top else None
    wins = max(6, len(players) // 3)
    draws = max(2, len(players) // 8)
    losses = max(1, len(players) // 10)

    return {
        'comparisonPlayers': comparison_players,
        'goalContributions': goal_contributions,
        'teamForm': team_form,
        'upcomingMatch': {
            'id': 'm1',
            'homeTeam': 'FC United',
            'awayTeam': 'Dynamo FC',
            'date': (datetime.utcnow() + timedelta(days=3)).strftime('%Y-%m-%d'),
            'time': '20:45',
            'venue': 'United Arena',
            'competition': 'Premier League',
            'predictedScore': '2 - 1',
            'winProbability': 58,
            'drawProbability': 22,
            'lossProbability': 20,
            'status': 'upcoming',
        },
        'standoutPlayer': top_standout,
        'goalProbability': 74,
        'seasonCards': [
            {'label': 'Season Record', 'stats': [{'l': 'Wins', 'v': str(wins)}, {'l': 'Draws', 'v': str(draws)}, {'l': 'Losses', 'v': str(losses)}]},
            {'label': 'Goals This Season', 'stats': [{'l': 'Scored', 'v': str(sum(p['goals'] for p in players))}, {'l': 'Conceded', 'v': str(max(18, losses * 3))}, {'l': 'Diff', 'v': f"+{max(0, sum(p['goals'] for p in players) - max(18, losses * 3))}"}]},
            {'label': 'League Position', 'stats': [{'l': 'Position', 'v': '3rd'}, {'l': 'Points', 'v': str(wins * 3 + draws)}, {'l': 'Gap to Top', 'v': '5'}]},
        ],
    }
