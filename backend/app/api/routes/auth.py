from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import AppUser
from app.schemas.auth import LoginRequest, UserOut


router = APIRouter()


@router.post('/login', response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AppUser).filter(AppUser.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@router.get('/users', response_model=list[UserOut])
def users(db: Session = Depends(get_db)):
    return db.query(AppUser).all()
