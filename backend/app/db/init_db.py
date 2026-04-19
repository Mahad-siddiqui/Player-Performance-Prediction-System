from sqlalchemy.orm import Session
from app.models import AppUser


DEFAULT_USERS = [
    {'name': 'Alex Morgan', 'email': 'admin@soccerml.io', 'role': 'admin', 'avatar': 'AM'},
    {'name': 'Marcus Silva', 'email': 'manager@soccerml.io', 'role': 'manager', 'avatar': 'MS'},
    {'name': 'Jordan Lee', 'email': 'fan@soccerml.io', 'role': 'fan', 'avatar': 'JL'},
]


def seed_default_users(db: Session) -> None:
    for user in DEFAULT_USERS:
        exists = db.query(AppUser).filter(AppUser.email == user['email']).first()
        if not exists:
            db.add(AppUser(**user))
    db.commit()
