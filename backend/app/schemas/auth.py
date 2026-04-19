from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar: str

    class Config:
        from_attributes = True
