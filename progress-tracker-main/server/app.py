import os
import shutil
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from database import engine, get_db, Base
import models
import schemas
import auth

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Progress Tracker API")

# CORS
origins = ["http://localhost:5173","https://progress-tracker-user-interface.onrender.com"] # Vite default port
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount 'uploads' folder to serve PDFs
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"),name="uploads")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- Dependencies ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Routes ---

@app.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload_pdf", response_model=schemas.PdfFileBase)
async def upload_pdf(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    new_pdf = models.PdfFile(
        filename=file.filename,
        filepath=file_location,
        user_id=current_user.id
    )
    db.add(new_pdf)
    db.commit()
    db.refresh(new_pdf)
    return new_pdf

@app.get("/pdfs", response_model=List[schemas.PdfFileBase])
def get_pdfs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.PdfFile).filter(models.PdfFile.user_id == current_user.id).all()

@app.put("/pdfs/{pdf_id}/toggle", response_model=schemas.PdfFileBase)
def toggle_pdf_completion(
    pdf_id: int, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pdf = db.query(models.PdfFile).filter(models.PdfFile.id == pdf_id, models.PdfFile.user_id == current_user.id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    pdf.completed = not pdf.completed
    if pdf.completed:
        pdf.completed_at = auth.datetime.utcnow()
    else:
        pdf.completed_at = None
        
    db.commit()
    db.refresh(pdf)
    return pdf

@app.delete("/pdfs/{pdf_id}", status_code=204)
def delete_pdf(
    pdf_id: int, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pdf = db.query(models.PdfFile).filter(models.PdfFile.id == pdf_id, models.PdfFile.user_id == current_user.id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Delete the file from the filesystem
    if os.path.exists(pdf.filepath):
        os.remove(pdf.filepath)
    
    db.delete(pdf)
    db.commit()
    return  

@app.get("/progress", response_model=schemas.ProgressResponse) 
def get_progress(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_pdfs = db.query(models.PdfFile).filter(models.PdfFile.user_id == current_user.id).count()
    completed_pdfs = db.query(models.PdfFile).filter(models.PdfFile.user_id == current_user.id, models.PdfFile.completed == True).count()
    
    progress_percentage = (completed_pdfs / total_pdfs * 100) if total_pdfs > 0 else 0.0
    
    return schemas.ProgressResponse(
        total_pdfs=total_pdfs,
        completed_pdfs=completed_pdfs,
        progress_percentage=progress_percentage
    )   
@app.get("/completed_pdfs_in_particular_day/{completed_at}", response_model=List[schemas.PdfFileBase])
def get_completed_pdfs_in_particular_day(
    completed_at: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        date_obj = auth.datetime.strptime(completed_at, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    start_datetime = auth.datetime.combine(date_obj, auth.datetime.min.time())
    end_datetime = auth.datetime.combine(date_obj, auth.datetime.max.time())
    
    completed_pdfs = db.query(models.PdfFile).filter(
        models.PdfFile.user_id == current_user.id,
        models.PdfFile.completed == True,
        models.PdfFile.completed_at >= start_datetime,
        models.PdfFile.completed_at <= end_datetime
    ).all()
    
    return completed_pdfs   