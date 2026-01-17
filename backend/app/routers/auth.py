from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, auth, schemas
from app.utils.email import send_verification_email

router = APIRouter(tags=["Authentication"])

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not verified. Please verify your email first.",
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

import random
import string

def generate_verification_code(length=6):
    return ''.join(random.choices(string.digits, k=length))

@router.post("/register", response_model=schemas.UserOut)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    code = generate_verification_code()
    
    # Send verification email
    # Background tasks would be better for performance, but awaiting here for simplicity
    await send_verification_email(user.email, code)
    
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=models.UserRole.VIEWER,
        verification_code=code,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/verify")
def verify_email(data: schemas.VerifyEmail, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_active:
         return {"message": "Email already verified"}
         
    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_active = True
    user.verification_code = None # Clear code after use
    db.commit()
    
    return {"message": "Email verified successfully. You can now login."}

@router.post("/forgot-password")
async def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If this email exists, a code has been sent."}
    
    code = generate_verification_code()
    user.verification_code = code
    db.commit()
    
    await send_verification_email(user.email, code)
    
    return {"message": "Verification code sent to email."}

@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.hashed_password = auth.get_password_hash(data.new_password)
    user.verification_code = None
    # Also activate if not active, as they verified ownership
    user.is_active = True 
    db.commit()
    
    return {"message": "Password reset successfully."}
