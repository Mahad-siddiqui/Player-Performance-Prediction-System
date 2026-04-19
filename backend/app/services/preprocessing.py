from __future__ import annotations

import pandas as pd


PLAYER_COLUMNS = [
    'external_id', 'name', 'position', 'number', 'age', 'nationality', 'team'
]
MATCH_COLUMNS = [
    'external_id', 'match_date', 'opponent', 'goals', 'assists', 'tackles',
    'distance_covered', 'speed', 'shots', 'pass_accuracy', 'minutes_played'
]
WELLNESS_COLUMNS = [
    'external_id', 'record_date', 'heart_rate', 'fatigue_score', 'sleep_quality',
    'hydration', 'muscle_soreness', 'recovery_score'
]


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def _assert_columns(df: pd.DataFrame, required: list[str]) -> None:
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f'Missing required columns: {missing}')


def preprocess_players(df: pd.DataFrame) -> pd.DataFrame:
    df = _normalize_columns(df)
    _assert_columns(df, PLAYER_COLUMNS)
    out = df[PLAYER_COLUMNS].copy()
    out['number'] = pd.to_numeric(out['number'], errors='coerce').fillna(0).astype(int)
    out['age'] = pd.to_numeric(out['age'], errors='coerce').fillna(out['age'].median()).astype(int)
    for col in ['external_id', 'name', 'position', 'nationality', 'team']:
        out[col] = out[col].astype(str).str.strip()
    return out.dropna(subset=['external_id', 'name']).drop_duplicates(subset=['external_id'])


def preprocess_match_records(df: pd.DataFrame) -> pd.DataFrame:
    df = _normalize_columns(df)
    _assert_columns(df, MATCH_COLUMNS)
    out = df[MATCH_COLUMNS].copy()
    out['match_date'] = pd.to_datetime(out['match_date'], errors='coerce').dt.date
    numeric_cols = ['goals', 'assists', 'tackles', 'distance_covered', 'speed', 'shots', 'pass_accuracy', 'minutes_played']
    for col in numeric_cols:
        out[col] = pd.to_numeric(out[col], errors='coerce').fillna(0)
    out['external_id'] = out['external_id'].astype(str).str.strip()
    return out.dropna(subset=['external_id', 'match_date'])


def preprocess_wellness_records(df: pd.DataFrame) -> pd.DataFrame:
    df = _normalize_columns(df)
    _assert_columns(df, WELLNESS_COLUMNS)
    out = df[WELLNESS_COLUMNS].copy()
    out['record_date'] = pd.to_datetime(out['record_date'], errors='coerce').dt.date
    numeric_cols = ['heart_rate', 'fatigue_score', 'sleep_quality', 'hydration', 'muscle_soreness', 'recovery_score']
    for col in numeric_cols:
        out[col] = pd.to_numeric(out[col], errors='coerce').fillna(out[col].median())
    out['external_id'] = out['external_id'].astype(str).str.strip()
    return out.dropna(subset=['external_id', 'record_date'])
