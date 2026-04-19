# Soccer ML Backend (FastAPI + MySQL + NumPy + Pandas)

## Stack
- FastAPI
- MySQL + SQLAlchemy
- NumPy + Pandas preprocessing
- Scikit-learn (RandomForest + SVM)

## 1) Setup
1. Create and activate a virtualenv.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy env template:
   - `copy .env.example .env`
4. Update `.env` with your MySQL credentials.
5. Ensure your MySQL database exists (example `soccer_ml`).

## 2) Run API
- `uvicorn app.main:app --reload --port 8000`

## 3) Generate Dummy CSV Data
- `python scripts/generate_dummy_data.py`
- Files created in `data/dummy_csv/`:
  - `players.csv`
  - `match_records.csv`
  - `wellness_records.csv`

## 4) Data Ingestion Endpoints
- `POST /api/ingestion/csv/players`
- `POST /api/ingestion/csv/match-records`
- `POST /api/ingestion/csv/wellness-records`
- `POST /api/ingestion/dummy/load-all` (loads all files from `backend/data/dummy_csv`)

Use multipart form-data key: `file`.

## 5) ML Endpoints
- Train models:
  - `POST /api/predictions/train`
- Predict for player:
  - `POST /api/predictions/player/{player_id}`

## 6) Reporting Endpoints
- Admin overview: `GET /api/reports/admin/overview`
- Manager players: `GET /api/reports/manager/players`
- Fan insights: `GET /api/reports/fan/insights`

## 7) Auth Endpoints (role demo)
- `POST /api/auth/login`
- `GET /api/auth/users`

## 8) Suggested Run Order
1. Ingest players CSV.
2. Ingest match records CSV.
3. Ingest wellness records CSV.
4. Train models.
5. Call predictions + reports.

Quick alternative:
1. Generate dummy files.
2. Call `POST /api/ingestion/dummy/load-all`.
3. Call `POST /api/predictions/train`.

Path note:
- Generated CSV files are inside `backend/data/dummy_csv`.
- If your shell is at project root, check with `Test-Path backend/data/dummy_csv/players.csv`.
