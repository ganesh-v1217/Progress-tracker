from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PdfFileBase(BaseModel):
    id: int
    filename: str
    completed: bool
    upload_time: datetime

    class Config:
        from_attributes = True