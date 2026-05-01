# Soccer ML Backend (FastAPI + SQLAlchemy + NumPy + Pandas)

This backend powers the Player Performance Prediction System. It exposes ingestion, ML training, prediction, and reporting APIs with a lightweight FastAPI stack and a local SQL database by default.

## How the Backend Works (High-Level Flow)

1. CSV data is ingested into relational tables (`players`, `match_records`, `wellness_records`).
2. The training pipeline builds a per-player dataset, generates synthetic labels, and trains models.
3. Prediction endpoints load the saved artifacts and generate player-level outputs.
4. Report endpoints aggregate predictions and the latest match/wellness data for dashboards.

## Stack (What Each Part Does)

- FastAPI: REST endpoints and request validation.
- SQLAlchemy + SQLite (default): ORM models and persistence.
- NumPy + Pandas: preprocessing and feature construction.
- Scikit-learn: training and inference for rating and injury risk models.

## 1) Setup

1. Create and activate a virtualenv.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. (Optional) Copy env template:
   - `copy .env.example .env`
4. (Optional) Update `.env` with your database URL and CORS origins.
5. Start the API (database tables are created on startup).

## 2) Run API

- `uvicorn app.main:app --reload --port 8000`

On startup, the API will:
- Create database tables from the SQLAlchemy models.
- Seed demo users for admin, manager, and fan roles.

## 2.1) API Module Layout (Code Navigation)

- `app/main.py`
  - FastAPI app creation, CORS middleware, router registration, and startup hooks.
- `app/core/config.py`
  - Environment settings (`DATABASE_URL`, `BACKEND_CORS_ORIGINS`).
- `app/db/`
  - Session factory and database initialization helpers.
- `app/models/`
  - SQLAlchemy models for all tables.
- `app/schemas/`
  - Pydantic request/response models.
- `app/services/`
  - Data preprocessing and ML pipeline logic.
- `app/api/routes/`
  - API endpoints grouped by domain.

## 3) Environment Variables (What They Control)

The backend reads from `.env` in the `backend/` folder.

- `DATABASE_URL`
  - Default: `sqlite:///./soccer_ml.db`
  - Any SQLAlchemy-compatible database URL is supported.
- `BACKEND_CORS_ORIGINS`
  - Default: `http://localhost:5173`
  - Comma-separated list of allowed frontend origins.

## 4) Data Model (Tables and Fields)

The backend stores four core entities:

- `players`
  - `external_id`, `name`, `position`, `number`, `age`, `nationality`, `team`
- `match_records`
  - `player_id`, `match_date`, `opponent`, `goals`, `assists`, `tackles`, `distance_covered`, `speed`, `shots`, `pass_accuracy`, `minutes_played`
- `wellness_records`
  - `player_id`, `record_date`, `heart_rate`, `fatigue_score`, `sleep_quality`, `hydration`, `muscle_soreness`, `recovery_score`
- `predictions`
  - `player_id`, `model_type`, `predicted_rating`, `injury_risk_probability`, `injury_risk_label`, `shap_summary`, `feature_snapshot`

Each `match_records` and `wellness_records` row is linked to a `players` row by `player_id`.

### Data Lifecycle (From CSV to Prediction)

1. CSV rows are normalized and validated.
2. Players are upserted by `external_id`.
3. Match and wellness rows are inserted and linked to `player_id`.
4. Training builds a per-player dataset by joining and aggregating.
5. Predictions are written back to the `predictions` table.

## 5) CSV Ingestion (Full Logic)

### Accepted CSVs

- Players CSV
  - Required columns: `external_id`, `name`, `position`, `number`, `age`, `nationality`, `team`
- Match Records CSV
  - Required columns: `external_id`, `match_date`, `opponent`, `goals`, `assists`, `tackles`, `distance_covered`, `speed`, `shots`, `pass_accuracy`, `minutes_played`
- Wellness Records CSV
  - Required columns: `external_id`, `record_date`, `heart_rate`, `fatigue_score`, `sleep_quality`, `hydration`, `muscle_soreness`, `recovery_score`

### Preprocessing Rules

- Columns are normalized to lowercase and trimmed.
- Missing required columns raise a 400 error.
- Numeric fields are coerced to numbers (invalid values become 0 or median, depending on dataset).
- `external_id` is trimmed and used to map to a player.
- Duplicates in players CSV are removed by `external_id`.
- Dates (`match_date`, `record_date`) are parsed to `YYYY-MM-DD`.
- Match and wellness rows are skipped if `external_id` has no matching player.

### Ingestion Endpoints

- `POST /api/ingestion/csv/players`
- `POST /api/ingestion/csv/match-records`
- `POST /api/ingestion/csv/wellness-records`
- `POST /api/ingestion/dummy/load-all`

CSV uploads use multipart form-data with key `file`.
The dummy loader reads from `backend/data/dummy_csv/`.

### What Gets Updated vs Inserted

- `players`: existing records are updated by `external_id` (upsert).
- `match_records`: always inserted (no de-duplication).
- `wellness_records`: always inserted (no de-duplication).

## 6) ML Pipeline (Complete Logic)

The ML pipeline is intentionally deterministic and transparent. It builds synthetic labels from match and wellness data, then trains two models:

- Player rating regression: RandomForestRegressor
- Injury risk classification: Support Vector Classifier (RBF kernel)

### Features Used

The models use the same feature vector:

- `goals`, `assists`, `tackles`, `distance_covered`, `speed`, `shots`, `pass_accuracy`, `minutes_played`
- `heart_rate`, `fatigue_score`, `sleep_quality`, `hydration`, `muscle_soreness`, `recovery_score`

### Synthetic Rating Target

For each match + wellness pair, a rating is computed with a weighted formula:

```
rating = 6.0
  + 0.12 * goals
  + 0.07 * assists
  + 0.02 * pass_accuracy
  + 0.01 * recovery_score
  - 0.015 * fatigue_score
  - 0.01 * muscle_soreness
```

The rating is clipped to the range `1.0` to `10.0`.

### Synthetic Injury Target

An injury probability score is computed per row:

```
injury_prob =
  0.002 * heart_rate
  + 0.01 * fatigue_score
  + 0.008 * muscle_soreness
  - 0.005 * sleep_quality
  - 0.005 * hydration
  - 0.006 * recovery_score
```

- A binary label is first assigned as `1` if `injury_prob >= 0.5`.
- After grouping by player, the label is rebalanced using the median of `injury_prob` to reduce class imbalance.

### Training Dataset Assembly

- Rows are built by joining `players`, `match_records`, and `wellness_records`.
- Rows are averaged per player (`groupby player_id`) to get a per-player training sample.
- Training fails if fewer than 8 player rows are available.

### Class Balancing (Injury Risk)

If the initial labels contain only one class, the dataset is re-labeled by splitting at the median of the injury score so that both classes exist.

### Model Training

- **RandomForestRegressor**
  - `n_estimators=250`, `random_state=42`
  - Trained on raw feature values to predict rating.
- **SVC (RBF)**
  - `C=2.0`, `gamma=scale`, `probability=True`, `random_state=42`
  - Trained on standardized features (StandardScaler).

Artifacts are saved under `backend/models/`:

- `rating_rf.joblib`
- `injury_svm.joblib`
- `feature_scaler.joblib`
- `features.joblib`

## 7) Prediction Logic (Complete Flow)

### Latest Feature Snapshot

For a player, prediction uses the most recent:

- `match_record` by `match_date`
- `wellness_record` by `record_date`

If either is missing, the API returns a 400 error.

### Outputs

- Predicted rating from the Random Forest.
- Injury risk probability from the SVM.
- Injury label:
  - `High` if probability >= 0.65
  - `Medium` if probability >= 0.4
  - `Low` otherwise
- Top 5 feature importances from the Random Forest with current values.

Each prediction is stored in the `predictions` table with a `feature_snapshot` and `shap_summary` (top factors only).

### Feature Importance Explanation

The Random Forest model exposes `feature_importances_`. The API returns the top 5 features with:

- `feature`: the feature name
- `importance`: relative importance from the forest
- `value`: the player’s current value used for prediction

## 8) ML Endpoints

- Train models and auto-generate predictions for all players:
  - `POST /api/predictions/train`
- Predict for a single player:
  - `POST /api/predictions/player/{player_id}`
- Predict for all players with existing models:
  - `POST /api/predictions/generate-all`

### What the Train Endpoint Does Internally

1. Builds the training dataset by joining match + wellness + player rows.
2. Trains and saves the Random Forest and SVM models.
3. Generates predictions for every player and stores them.

## 9) Reporting Endpoints (What They Return)

- Admin overview: `GET /api/reports/admin/overview`
  - Counts of players, matches, wellness records, and predictions
  - Average predicted rating and high-risk count

- Admin dashboard: `GET /api/reports/admin/dashboard`
  - Summary metrics, model performance cards, API sync status, and system load (mocked from DB totals)

- Manager players: `GET /api/reports/manager/players`
  - Full player list with health labels, fitness score, fatigue, latest stats, and injury risk

- Manager dashboard: `GET /api/reports/manager/dashboard`
  - Player list plus recent fatigue vs distance chart data and upcoming fixtures

- Fan insights: `GET /api/reports/fan/insights`
  - Injury risk distribution and average predicted rating

- Fan dashboard: `GET /api/reports/fan/dashboard`
  - Comparison players, goal contribution data, team form, and upcoming match card

### How Report Values Are Computed

- Manager health is derived from fatigue and recovery scores.
- Injury risk uses the latest saved prediction label if available.
- Admin dashboard cards are derived from total counts and averages, with small UI-friendly transforms.

## 10) Auth Endpoints (Demo Login)

- `POST /api/auth/login`
  - Accepts email only, returns the user if found.
- `GET /api/auth/users`
  - Returns all demo users.

Seeded users are created at startup:

- `admin@soccerml.io`
- `manager@soccerml.io`
- `fan@soccerml.io`

## 11) Error Handling and Status Codes

- `400` for validation/training/prediction errors (bad CSV, missing features, insufficient training data).
- `404` when a player or user is not found.
- CSV ingestion returns a list of per-row errors for missing `external_id` mapping.

## 12) Suggested Run Order

1. Ingest players CSV.
2. Ingest match records CSV.
3. Ingest wellness records CSV.
4. Train models (`/api/predictions/train`).
5. Call predictions and reports from the frontend.

Quick alternative:

1. Generate dummy files: `python scripts/generate_dummy_data.py`.
2. Call `POST /api/ingestion/dummy/load-all`.
3. Call `POST /api/predictions/train`.

Path note:

- Generated CSV files are inside `backend/data/dummy_csv`.
- If your shell is at project root, check with `Test-Path backend/data/dummy_csv/players.csv`.
