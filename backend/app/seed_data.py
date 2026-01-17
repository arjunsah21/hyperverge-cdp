from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, auth
import os

def seed_database():
    db = SessionLocal()
    try:
        # Check if Super Admin exists
        admin_email = "admin@hyperverge.co"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not admin:
            print("Creating default Super Admin...")
            superuser = models.User(
                email=admin_email,
                hashed_password=auth.get_password_hash("admin123"),
                first_name="Super",
                last_name="Admin",
                role=models.UserRole.SUPER_ADMIN,
                is_active=True
            )
            db.add(superuser)
            db.commit()
            print("Super Admin created: admin@hyperverge.co / admin123")
        else:
            print("Super Admin already exists.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
