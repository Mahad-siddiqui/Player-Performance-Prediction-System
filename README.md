		# Player Performance Prediction System

End-to-end soccer analytics platform for ingesting match and wellness data, training ML models, and delivering role-based insights through a modern web UI.

## What This Project Does

- Ingests CSV data for players, match performance, and wellness metrics
- Trains ML models for rating prediction and injury risk classification
- Generates predictions per player and stores them in a relational database
- Serves admin, manager, and fan dashboards through a React frontend

## Roles and User Journeys

- Admin: uploads CSVs, triggers training, checks system health and overview reports
- Manager: reviews squad readiness, fatigue trends, and injury risk summaries
- Fan: explores match insights, team form, and player comparisons

## Architecture (End-to-End Flow)

1. CSV data is uploaded from the Admin dashboard or loaded from local dummy CSV files.
2. Backend validates, normalizes, and stores rows in SQL tables.
3. Training endpoint builds a per-player dataset and trains two models.
4. Prediction endpoints generate ratings and injury risk outputs.
5. Report endpoints aggregate data for role-specific dashboards.
6. Frontend renders role-specific analytics and charts.

## Repository Structure

```text
Player-Performance-Prediction-System/
	backend/
		app/
			api/routes/         # FastAPI route modules
			core/               # Settings and configuration
			db/                 # SQLAlchemy base/session/init
			models/             # ORM entities
			schemas/            # Pydantic request/response models
			services/           # Preprocessing + ML training/inference
		data/dummy_csv/       # Generated sample CSV files
		scripts/              # Utility scripts (dummy data generation)

<!-- refresh contributors cache -->
	frontend/
		src/
			components/         # Reusable UI components
			contexts/           # Auth context
			pages/              # Admin/Manager/Fan/Login pages
			services/           # API client
			data/               # Mock data and shared constants
			types/              # Shared TypeScript types
```

## Quick Start (Local)

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

- Windows PowerShell:

```powershell
\.\.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Startup behavior:

- Creates database tables automatically
- Seeds demo users: admin@soccerml.io, manager@soccerml.io, fan@soccerml.io

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server is usually available at http://localhost:5173.

## Environment Variables

### Backend (.env)

- `DATABASE_URL`
	- Default: `sqlite:///./soccer_ml.db`
	- Any SQLAlchemy-compatible database URL is supported
- `BACKEND_CORS_ORIGINS`
	- Default: `http://localhost:5173`
	- Comma-separated list of allowed frontend origins
- `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`
	- Optional helpers for MySQL setups

### Frontend (.env)

- `VITE_API_BASE_URL`
	- Optional absolute API base URL
	- Default: empty string (uses relative `/api/*` paths)
- `VITE_API_PROXY_TARGET`
	- Proxy target in `vite.config.ts`
	- Default: `http://localhost:8000`

Recommended local dev settings:

- Leave `VITE_API_BASE_URL` unset
- Run the backend on port `8000`
- Let Vite proxy `/api` calls to the backend

## Backend Overview

### Tech Stack

- FastAPI
- SQLAlchemy 2.x
- SQLite (default) or MySQL via `DATABASE_URL`
- Pandas + NumPy for preprocessing
- Scikit-learn for ML models
- Joblib for model serialization

### Core Tables

- `users`
	- id, name, email, role, avatar
- `players`
	- external_id, name, position, number, age, nationality, team
- `match_records`
	- player_id, match_date, opponent, goals, assists, tackles, distance_covered, speed, shots, pass_accuracy, minutes_played
- `wellness_records`
	- player_id, record_date, heart_rate, fatigue_score, sleep_quality, hydration, muscle_soreness, recovery_score
- `predictions`
	- player_id, model_type, predicted_rating, injury_risk_probability, injury_risk_label, shap_summary, feature_snapshot

## Frontend Overview

### Tech Stack

- React 18
- TypeScript 5
- Vite 5
- React Router
- Tailwind CSS
- Recharts
- Lucide React

### Auth Behavior

- Login is email-based against `POST /api/auth/login`
- Session stored in localStorage key `soccer_prediction_user`
- Role-based routes: `/admin`, `/manager`, `/fan`

## API Reference (Local Base URL)

Default base URL: http://localhost:8000

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/login` with `{ "email": "manager@soccerml.io" }`
- `GET /api/auth/users`

### Ingestion

- `POST /api/ingestion/csv/players`
- `POST /api/ingestion/csv/match-records`
- `POST /api/ingestion/csv/wellness-records`
- `POST /api/ingestion/dummy/load-all`

CSV uploads use `multipart/form-data` with key `file`.

Typical ingestion response:

```json
{
	"dataset": "players",
	"inserted": 40,
	"errors": []
}
```

### Predictions and Training

- `POST /api/predictions/train`
	- Trains models and generates predictions for all players
- `POST /api/predictions/player/{player_id}`
	- Generates and stores prediction for one player
- `POST /api/predictions/generate-all`
	- Generates predictions for all players using trained models

### Reports

- `GET /api/reports/admin/overview`
- `GET /api/reports/admin/dashboard`
- `GET /api/reports/manager/players`
- `GET /api/reports/manager/dashboard`
- `GET /api/reports/fan/insights`
- `GET /api/reports/fan/dashboard`

## CSV Data Contracts

All CSV columns are normalized to lowercase and validated.

### players.csv required columns

- external_id
- name
- position
- number
- age
- nationality
- team

### match_records.csv required columns

- external_id
- match_date
- opponent
- goals
- assists
- tackles
- distance_covered
- speed
- shots
- pass_accuracy
- minutes_played

### wellness_records.csv required columns

- external_id
- record_date
- heart_rate
- fatigue_score
- sleep_quality
- hydration
- muscle_soreness
- recovery_score

Validation behavior:

- Missing required columns cause a 400 error
- Numeric fields are coerced; invalid values become defaults/medians
- Unknown external_id rows in match/wellness ingestion are skipped and returned in errors

## Admin CSV Upload Naming Rules

The Admin upload flow selects the ingestion endpoint by filename. Your CSV name must contain one of:

- `player` -> `/api/ingestion/csv/players`
- `match` -> `/api/ingestion/csv/match-records`
- `wellness` -> `/api/ingestion/csv/wellness-records`

If the filename does not include one of these keywords, the upload is rejected.

## ML Pipeline (Complete Logic)

### Features Used

- goals, assists, tackles, distance_covered, speed, shots, pass_accuracy, minutes_played
- heart_rate, fatigue_score, sleep_quality, hydration, muscle_soreness, recovery_score

### Synthetic Rating Target

```
rating = 6.0
	+ 0.12 * goals
	+ 0.07 * assists
	+ 0.02 * pass_accuracy
	+ 0.01 * recovery_score
	- 0.015 * fatigue_score
	- 0.01 * muscle_soreness
```

Rating is clipped to the range 1.0 to 10.0.

### Synthetic Injury Target

```
injury_prob =
	0.002 * heart_rate
	+ 0.01 * fatigue_score
	+ 0.008 * muscle_soreness
	- 0.005 * sleep_quality
	- 0.005 * hydration
	- 0.006 * recovery_score
```

- Initial label: 1 if injury_prob >= 0.5
- If one class dominates, re-label using the median to balance classes

### Training Dataset Assembly

- Joins players, match records, and wellness records
- Aggregates rows to per-player averages
- Training fails if fewer than 8 player rows are available

### Models and Artifacts

- RandomForestRegressor for ratings
- SVC (RBF kernel) for injury risk
- Artifacts saved under backend/models:
	- rating_rf.joblib
	- injury_svm.joblib
	- feature_scaler.joblib
	- features.joblib

### Prediction Outputs

- predicted_rating
- injury_risk_probability
- injury_risk_label (Low, Medium, High)
- top 5 feature importances with current values

## Recommended Runbook

### Option A: Fast demo path

1. Start backend
2. Generate dummy CSV files:

```bash
cd backend
python scripts/generate_dummy_data.py
```

3. Call `POST /api/ingestion/dummy/load-all`
4. Call `POST /api/predictions/train`
5. Start frontend and login with a seeded user

### Option B: Upload your own CSV files

1. Start backend and frontend
2. Login as admin@soccerml.io
3. Upload players, match, and wellness CSV files in the Admin dashboard
4. Trigger training (`/api/predictions/train`) if not auto-started
5. Validate data in Manager and Fan dashboards

## Troubleshooting

- CORS errors in browser
	- Ensure `BACKEND_CORS_ORIGINS` includes your frontend origin
	- Ensure frontend calls the correct API origin (proxy or `VITE_API_BASE_URL`)
- Training error: not enough training data
	- Ingest more match/wellness rows
	- Ensure players have both match and wellness records
- Prediction error: models not trained yet
	- Call `POST /api/predictions/train` first
- Upload succeeds but zero rows inserted
	- Validate column names against required schema
	- Check date and numeric column formatting
- Login fails
	- Ensure backend started at least once (startup seeds users)
	- Use one of the seeded emails from the login page

## Known Limitations

- No password/JWT authentication (demo email-based auth only)
- No migration framework (tables auto-created on startup)
- No formal test suite in current repository
- SHAP package is present, but explainability output uses RF feature importances
- MySQL helper vars exist, but driver selection is driven by `DATABASE_URL`

## Useful Commands

Backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
python scripts/generate_dummy_data.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```
