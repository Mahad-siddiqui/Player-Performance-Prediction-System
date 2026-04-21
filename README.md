# Player Performance Prediction System

End-to-end soccer analytics platform with:

- FastAPI backend for ingestion, model training, prediction, and reporting
- React + TypeScript frontend with role-based dashboards (Admin, Manager, Fan)
- CSV-based data pipeline for players, match performance, and wellness metrics

The application is built for demo and development workflows, with seeded users and optional dummy data generation to get running quickly.

## Table of Contents

1. Project Overview
2. Architecture
3. Repository Structure
4. Backend Guide
5. Frontend Guide
6. API Reference
7. Data Contracts (CSV)
8. ML Pipeline
9. Runbook (Recommended Workflow)
10. Troubleshooting
11. Known Limitations

## Project Overview

This system predicts player performance rating and injury risk from football match and wellness data.

It supports three roles:

- Admin: system health, ingestion, model operations, API sync monitoring
- Manager: squad readiness, injury alerts, player trends and reports
- Fan: match preview, player comparison, team form and standout analysis

## Architecture

High-level flow:

1. CSV data is uploaded from the Admin dashboard (or loaded from local dummy CSV files).
2. Backend validates and preprocesses CSV rows.
3. Data is stored in SQLite/MySQL through SQLAlchemy models.
4. Training endpoint builds engineered features and trains:
	 - RandomForestRegressor for rating prediction
	 - SVM classifier for injury risk
5. Prediction endpoint (single player or all players) persists prediction outputs.
6. Reporting endpoints aggregate data for role-specific dashboard views.
7. Frontend consumes API endpoints and renders role-specific analytics UI.

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
	frontend/
		src/
			components/         # Reusable UI components
			contexts/           # Auth context
			pages/              # Admin/Manager/Fan/Login pages
			services/           # API client
			data/               # TS interfaces + fallback/mock constants
```

## Backend Guide

### Tech Stack

- FastAPI
- SQLAlchemy 2.x
- SQLite (default) or MySQL via DATABASE_URL
- Pandas + NumPy for preprocessing
- Scikit-learn for ML models
- Joblib for model serialization

### Prerequisites

- Python 3.10+
- pip

### Setup

From project root:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:

- Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create environment file:

```bash
copy .env.example .env
```

Run API server:

```bash
uvicorn app.main:app --reload --port 8000
```

Startup behavior:

- Creates database tables automatically
- Seeds default users:
	- admin@soccerml.io
	- manager@soccerml.io
	- fan@soccerml.io

### Backend Environment Variables

Defined in `backend/.env.example`:

- DATABASE_URL: SQLAlchemy connection string
	- Default: sqlite:///./soccer_ml.db
- BACKEND_CORS_ORIGINS: comma-separated origins
	- Default: http://localhost:5173
- MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DB
	- Present as optional helpers for MySQL setups

Important note:

- Runtime DB connection is controlled by DATABASE_URL.
- If DATABASE_URL is left at default, SQLite is used.

### Backend Data Model

Main tables:

- users
	- id, name, email, role, avatar
- players
	- external_id, name, position, number, age, nationality, team
- match_records
	- player_id, match_date, goals, assists, tackles, distance_covered, speed, shots, pass_accuracy, minutes_played
- wellness_records
	- player_id, record_date, heart_rate, fatigue_score, sleep_quality, hydration, muscle_soreness, recovery_score
- predictions
	- player_id, model_type, predicted_rating, injury_risk_probability, injury_risk_label, shap_summary, feature_snapshot

## Frontend Guide

### Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Router
- Lucide React icons

### Prerequisites

- Node.js 18+
- npm

### Setup

From project root:

```bash
cd frontend
npm install
```

Run development server:

```bash
npm run dev
```

Default Vite URL is typically http://localhost:5173.

### Frontend Environment Variables

Supported variables:

- VITE_API_BASE_URL
	- If empty, frontend uses same-origin relative paths (recommended with Vite proxy in dev)
- VITE_API_PROXY_TARGET
	- Used by `vite.config.ts` for `/api` proxy target
	- Default: http://localhost:8000

Recommended local dev behavior:

- Keep VITE_API_BASE_URL unset
- Use default Vite proxy so `/api/*` routes forward to backend

### Frontend Routing and Auth

Routes:

- /login
- /admin (admin role)
- /manager (manager role)
- /fan (fan role)

Auth behavior:

- Login is email-based against backend `/api/auth/login`
- Session is stored in localStorage key: soccer_prediction_user
- Route guards enforce role access

## API Reference

Base URL in local development:

- http://localhost:8000

### Health

- GET /api/health
	- Returns service status

### Auth

- POST /api/auth/login
	- Body: `{ "email": "manager@soccerml.io" }`
	- Returns user profile
- GET /api/auth/users
	- Returns all seeded users

### Ingestion

- POST /api/ingestion/csv/players
	- multipart form-data key: file
- POST /api/ingestion/csv/match-records
	- multipart form-data key: file
- POST /api/ingestion/csv/wellness-records
	- multipart form-data key: file
- POST /api/ingestion/dummy/load-all
	- Loads all local CSV files from backend/data/dummy_csv

Typical ingestion response:

```json
{
	"dataset": "players",
	"inserted": 40,
	"errors": []
}
```

### Predictions and Training

- POST /api/predictions/train
	- Trains models and generates predictions for all players
	- Returns trained rows, feature list, saved model paths, created/skipped prediction counts
- POST /api/predictions/player/{player_id}
	- Generates and stores prediction for one player
- POST /api/predictions/generate-all
	- Generates predictions for all players using trained models

### Reports

- GET /api/reports/admin/overview
- GET /api/reports/admin/dashboard
- GET /api/reports/manager/players
- GET /api/reports/manager/dashboard
- GET /api/reports/fan/insights
- GET /api/reports/fan/dashboard

## Data Contracts (CSV)

All CSV column names are normalized to lowercase and validated.

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
- Numeric fields are coerced; invalid values are filled with defaults/medians as implemented
- Unknown external_id rows in match/wellness ingestion are skipped and returned in errors

## ML Pipeline

Feature columns used for model training/inference:

- goals
- assists
- tackles
- distance_covered
- speed
- shots
- pass_accuracy
- minutes_played
- heart_rate
- fatigue_score
- sleep_quality
- hydration
- muscle_soreness
- recovery_score

Training details:

- Aggregates player-level mean features from joined match and wellness rows
- Synthesizes rating target and injury target from heuristic formulas
- Requires at least 8 aggregated rows; otherwise training fails
- Saves artifacts into backend/models:
	- rating_rf.joblib
	- injury_svm.joblib
	- feature_scaler.joblib
	- features.joblib

Prediction details:

- Uses latest match + latest wellness record for each player
- Returns:
	- predicted_rating
	- injury_risk_probability
	- injury_risk_label (Low/Medium/High)
	- top_factors from RF feature importance

## Runbook (Recommended Workflow)

### Option A: Fast demo path

1. Start backend
2. Generate dummy CSV files:

```bash
cd backend
python scripts/generate_dummy_data.py
```

3. Call POST /api/ingestion/dummy/load-all
4. Call POST /api/predictions/train
5. Start frontend and login with a seeded user

### Option B: Upload your own CSV files

1. Start backend and frontend
2. Login as admin@soccerml.io
3. Upload players, match, and wellness CSV files from Admin dashboard
4. Backend auto-trains and generates predictions after upload attempt
5. Validate data in Manager and Fan dashboards

## Troubleshooting

### 1) CORS errors in browser

- Ensure BACKEND_CORS_ORIGINS includes your frontend origin
- Ensure frontend calls the correct API origin (proxy or VITE_API_BASE_URL)

### 2) Training error: Not enough training data

- Ingest more match/wellness rows
- Ensure players have both match and wellness records

### 3) Prediction error: Models not trained yet

- Call POST /api/predictions/train first

### 4) Upload succeeds but zero rows inserted

- Validate column names against required schema
- Check date and numeric column formatting

### 5) Login fails

- Ensure backend started at least once (startup seeds users)
- Use one of seeded emails from the login page

## Known Limitations

- No password/JWT authentication (demo email-based auth only)
- No migration framework (tables auto-created on startup)
- No formal test suite in current repository
- SHAP package is present in dependencies, but explainability output currently uses RF feature importances
- MySQL helper vars exist, but actual driver selection is fully driven by DATABASE_URL

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
