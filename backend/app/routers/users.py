from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
import shutil
import os
from typing import Optional

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
async def update_user_me(
    user_update: schemas.UserUpdate, 
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=schemas.UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Ensure static directory exists
    UPLOAD_DIR = "static/avatars"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}_{int(os.path.getctime(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else 0)}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not upload file")
        
    # Update user profile
    # URL should be absolute or relative to root. Storing relative path.
    # Frontend will need to prepend backend URL or we serve it locally.
    current_user.avatar_url = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user
