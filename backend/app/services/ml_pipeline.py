from __future__ import annotations

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sqlalchemy.orm import Session

from app.models.player import Player
from app.models.match_record import MatchRecord
from app.models.wellness_record import WellnessRecord

MODEL_DIR = Path('models')
RF_MODEL_PATH = MODEL_DIR / 'rating_rf.joblib'
SVM_MODEL_PATH = MODEL_DIR / 'injury_svm.joblib'
SCALER_PATH = MODEL_DIR / 'feature_scaler.joblib'
FEATURES_PATH = MODEL_DIR / 'features.joblib'

FEATURE_COLUMNS = [
    'goals', 'assists', 'tackles', 'distance_covered', 'speed', 'shots', 'pass_accuracy',
    'minutes_played', 'heart_rate', 'fatigue_score', 'sleep_quality', 'hydration',
    'muscle_soreness', 'recovery_score'
]


def _build_training_frame(db: Session) -> pd.DataFrame:
    rows = (
        db.query(Player.name, MatchRecord, WellnessRecord)
        .join(MatchRecord, MatchRecord.player_id == Player.id)
        .join(WellnessRecord, WellnessRecord.player_id == Player.id)
        .all()
    )

    out_rows = []
    for _, match, wellness in rows:
        rating = (
            6.0
            + 0.12 * match.goals
            + 0.07 * match.assists
            + 0.02 * match.pass_accuracy
            + 0.01 * wellness.recovery_score
            - 0.015 * wellness.fatigue_score
            - 0.01 * wellness.muscle_soreness
        )
        rating = float(np.clip(rating, 1, 10))

        injury_prob = (
            0.002 * wellness.heart_rate
            + 0.01 * wellness.fatigue_score
            + 0.008 * wellness.muscle_soreness
            - 0.005 * wellness.sleep_quality
            - 0.005 * wellness.hydration
            - 0.006 * wellness.recovery_score
        )
        injury_label = 1 if injury_prob >= 0.5 else 0

        out_rows.append({
            'player_id': match.player_id,
            'goals': match.goals,
            'assists': match.assists,
            'tackles': match.tackles,
            'distance_covered': match.distance_covered,
            'speed': match.speed,
            'shots': match.shots,
            'pass_accuracy': match.pass_accuracy,
            'minutes_played': match.minutes_played,
            'heart_rate': wellness.heart_rate,
            'fatigue_score': wellness.fatigue_score,
            'sleep_quality': wellness.sleep_quality,
            'hydration': wellness.hydration,
            'muscle_soreness': wellness.muscle_soreness,
            'recovery_score': wellness.recovery_score,
            'target_rating': rating,
            'target_injury': injury_label,
            'target_injury_score': float(injury_prob),
        })

    if not out_rows:
        return pd.DataFrame(columns=['player_id', *FEATURE_COLUMNS, 'target_rating', 'target_injury', 'target_injury_score'])

    df = pd.DataFrame(out_rows)
    grouped = df.groupby('player_id', as_index=False).mean(numeric_only=True)

    cutoff = float(grouped['target_injury_score'].median())
    grouped['target_injury'] = (grouped['target_injury_score'] >= cutoff).astype(int)
    return grouped


def train_models(db: Session) -> dict:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    df = _build_training_frame(db)
    if df.empty or len(df) < 8:
        raise ValueError('Not enough training data. Ingest more CSV rows first.')

    X = df[FEATURE_COLUMNS]
    y_rating = df['target_rating']
    y_injury = (df['target_injury'] > 0.5).astype(int)
    if y_injury.nunique() < 2:
        sorted_idx = np.argsort(df['target_injury_score'].values)
        half = len(sorted_idx) // 2
        y_injury = pd.Series(0, index=df.index)
        y_injury.iloc[sorted_idx[half:]] = 1

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    rf = RandomForestRegressor(n_estimators=250, random_state=42)
    rf.fit(X, y_rating)

    svm = SVC(kernel='rbf', probability=True, C=2.0, gamma='scale', random_state=42)
    svm.fit(X_scaled, y_injury)

    joblib.dump(rf, RF_MODEL_PATH)
    joblib.dump(svm, SVM_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(FEATURE_COLUMNS, FEATURES_PATH)

    return {
        'trained_rows': int(len(df)),
        'features': FEATURE_COLUMNS,
        'models_saved': [str(RF_MODEL_PATH), str(SVM_MODEL_PATH), str(SCALER_PATH)],
    }


def _latest_player_features(db: Session, player_id: int) -> dict | None:
    match = (
        db.query(MatchRecord)
        .filter(MatchRecord.player_id == player_id)
        .order_by(MatchRecord.match_date.desc())
        .first()
    )
    wellness = (
        db.query(WellnessRecord)
        .filter(WellnessRecord.player_id == player_id)
        .order_by(WellnessRecord.record_date.desc())
        .first()
    )
    if not match or not wellness:
        return None

    return {
        'goals': match.goals,
        'assists': match.assists,
        'tackles': match.tackles,
        'distance_covered': match.distance_covered,
        'speed': match.speed,
        'shots': match.shots,
        'pass_accuracy': match.pass_accuracy,
        'minutes_played': match.minutes_played,
        'heart_rate': wellness.heart_rate,
        'fatigue_score': wellness.fatigue_score,
        'sleep_quality': wellness.sleep_quality,
        'hydration': wellness.hydration,
        'muscle_soreness': wellness.muscle_soreness,
        'recovery_score': wellness.recovery_score,
    }


def predict_for_player(db: Session, player_id: int) -> dict:
    if not RF_MODEL_PATH.exists() or not SVM_MODEL_PATH.exists() or not SCALER_PATH.exists() or not FEATURES_PATH.exists():
        raise ValueError('Models not trained yet. Call /api/predictions/train first.')

    rf: RandomForestRegressor = joblib.load(RF_MODEL_PATH)
    svm: SVC = joblib.load(SVM_MODEL_PATH)
    scaler: StandardScaler = joblib.load(SCALER_PATH)
    features: list[str] = joblib.load(FEATURES_PATH)

    feature_dict = _latest_player_features(db, player_id)
    if not feature_dict:
        raise ValueError('No match/wellness records found for this player.')

    x = np.array([[feature_dict[f] for f in features]], dtype=float)
    rating = float(rf.predict(pd.DataFrame(x, columns=features))[0])
    risk_prob = float(svm.predict_proba(scaler.transform(x))[0][1])
    risk_label = 'High' if risk_prob >= 0.65 else 'Medium' if risk_prob >= 0.4 else 'Low'

    importances = rf.feature_importances_
    top_idx = np.argsort(importances)[::-1][:5]
    top_factors = [
        {
            'feature': features[int(i)],
            'importance': float(importances[int(i)]),
            'value': float(x[0][int(i)]),
        }
        for i in top_idx
    ]

    return {
        'predicted_rating': rating,
        'injury_risk_probability': risk_prob,
        'injury_risk_label': risk_label,
        'feature_snapshot': feature_dict,
        'top_factors': top_factors,
    }
