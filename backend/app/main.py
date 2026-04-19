from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.init_db import seed_default_users
from app.api.routes import health, auth, ingestion, predictions, reports


app = FastAPI(title='Soccer ML API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_users(db)
    finally:
        db.close()


app.include_router(health.router, prefix='/api', tags=['health'])
app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(ingestion.router, prefix='/api/ingestion', tags=['ingestion'])
app.include_router(predictions.router, prefix='/api/predictions', tags=['predictions'])
app.include_router(reports.router, prefix='/api/reports', tags=['reports'])
