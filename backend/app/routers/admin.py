from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

# Admin dependency
def get_current_super_admin(current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: models.User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int, 
    role_update: schemas.UserUpdate, # We reuse UserUpdate, but ignore other fields
    current_user: models.User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    if not role_update.role:
        raise HTTPException(status_code=400, detail="Role is required")
        
    try:
        # Validate role enum
        models.UserRole(role_update.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()

@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int, 
    user_update: schemas.UserAdminUpdate,
    current_user: models.User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.role:
        try:
            models.UserRole(user_update.role)
            user.role = user_update.role
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid role")

    if user_update.email:
        # Check if email exists for OTHER user
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_update.email
        
    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)
    return user
