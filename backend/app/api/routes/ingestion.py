from io import StringIO
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.player import Player
from app.models.match_record import MatchRecord
from app.models.wellness_record import WellnessRecord
from app.schemas.ingestion import IngestionResult
from app.services.preprocessing import (
    preprocess_players,
    preprocess_match_records,
    preprocess_wellness_records,
)


router = APIRouter()


def _decode_csv(file: UploadFile) -> pd.DataFrame:
    raw = file.file.read()
    if not raw:
        raise ValueError('CSV file is empty')
    return pd.read_csv(StringIO(raw.decode('utf-8')))


def _read_local_csv(file_path: Path) -> pd.DataFrame:
        if not file_path.exists():
            raise ValueError(f'File not found: {file_path}')
        return pd.read_csv(file_path)


@router.post('/csv/players', response_model=IngestionResult)
def upload_players_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        df = preprocess_players(_decode_csv(file))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    inserted = 0
    for row in df.to_dict('records'):
        player = db.query(Player).filter(Player.external_id == row['external_id']).first()
        if player:
            for key, value in row.items():
                setattr(player, key, value)
        else:
            db.add(Player(**row))
            inserted += 1
    db.commit()
    return IngestionResult(dataset='players', inserted=inserted)


@router.post('/csv/match-records', response_model=IngestionResult)
def upload_match_records_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        df = preprocess_match_records(_decode_csv(file))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    players = {p.external_id: p.id for p in db.query(Player).all()}
    inserted = 0
    errors: list[str] = []

    for row in df.to_dict('records'):
        player_id = players.get(row['external_id'])
        if not player_id:
            errors.append(f"Unknown external_id: {row['external_id']}")
            continue

        db.add(MatchRecord(
            player_id=player_id,
            match_date=row['match_date'],
            opponent=row['opponent'],
            goals=int(row['goals']),
            assists=int(row['assists']),
            tackles=int(row['tackles']),
            distance_covered=float(row['distance_covered']),
            speed=float(row['speed']),
            shots=int(row['shots']),
            pass_accuracy=float(row['pass_accuracy']),
            minutes_played=int(row['minutes_played']),
        ))
        inserted += 1

    db.commit()
    return IngestionResult(dataset='match-records', inserted=inserted, errors=errors)


@router.post('/csv/wellness-records', response_model=IngestionResult)
def upload_wellness_records_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        df = preprocess_wellness_records(_decode_csv(file))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    players = {p.external_id: p.id for p in db.query(Player).all()}
    inserted = 0
    errors: list[str] = []

    for row in df.to_dict('records'):
        player_id = players.get(row['external_id'])
        if not player_id:
            errors.append(f"Unknown external_id: {row['external_id']}")
            continue

        db.add(WellnessRecord(
            player_id=player_id,
            record_date=row['record_date'],
            heart_rate=int(row['heart_rate']),
            fatigue_score=float(row['fatigue_score']),
            sleep_quality=float(row['sleep_quality']),
            hydration=float(row['hydration']),
            muscle_soreness=float(row['muscle_soreness']),
            recovery_score=float(row['recovery_score']),
        ))
        inserted += 1

    db.commit()
    return IngestionResult(dataset='wellness-records', inserted=inserted, errors=errors)


@router.post('/dummy/load-all')
def load_all_dummy_csv(db: Session = Depends(get_db)):
    base_dir = Path(__file__).resolve().parents[3] / 'data' / 'dummy_csv'

    players_df = preprocess_players(_read_local_csv(base_dir / 'players.csv'))
    for row in players_df.to_dict('records'):
        player = db.query(Player).filter(Player.external_id == row['external_id']).first()
        if player:
            for key, value in row.items():
                setattr(player, key, value)
        else:
            db.add(Player(**row))
    db.commit()

    match_df = preprocess_match_records(_read_local_csv(base_dir / 'match_records.csv'))
    players = {p.external_id: p.id for p in db.query(Player).all()}
    match_inserted = 0
    for row in match_df.to_dict('records'):
        player_id = players.get(row['external_id'])
        if not player_id:
            continue
        db.add(MatchRecord(
            player_id=player_id,
            match_date=row['match_date'],
            opponent=row['opponent'],
            goals=int(row['goals']),
            assists=int(row['assists']),
            tackles=int(row['tackles']),
            distance_covered=float(row['distance_covered']),
            speed=float(row['speed']),
            shots=int(row['shots']),
            pass_accuracy=float(row['pass_accuracy']),
            minutes_played=int(row['minutes_played']),
        ))
        match_inserted += 1
    db.commit()

    wellness_df = preprocess_wellness_records(_read_local_csv(base_dir / 'wellness_records.csv'))
    wellness_inserted = 0
    for row in wellness_df.to_dict('records'):
        player_id = players.get(row['external_id'])
        if not player_id:
            continue
        db.add(WellnessRecord(
            player_id=player_id,
            record_date=row['record_date'],
            heart_rate=int(row['heart_rate']),
            fatigue_score=float(row['fatigue_score']),
            sleep_quality=float(row['sleep_quality']),
            hydration=float(row['hydration']),
            muscle_soreness=float(row['muscle_soreness']),
            recovery_score=float(row['recovery_score']),
        ))
        wellness_inserted += 1
    db.commit()

    return {
        'players_upserted': len(players_df),
        'match_records_inserted': match_inserted,
        'wellness_records_inserted': wellness_inserted,
    }
