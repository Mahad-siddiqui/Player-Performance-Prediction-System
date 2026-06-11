#!/bin/bash
set -e

echo "=== Player Performance Prediction System Setup ==="

echo "[1/4] Setting up Python virtual environment..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

echo "[2/4] Downloading real StatsBomb dataset..."
python scripts/download_real_dataset.py

echo "[3/4] Copying .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created from .env.example"
fi

echo "[4/4] Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "Setup complete!"
echo "Run backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "Run frontend: cd frontend && npm run dev"
echo "Real CSV data is in: backend/data/real_csv/"
