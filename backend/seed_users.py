from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.utils.auth import get_password_hash

# EDIT THESE DETAILS AS PER YOUR REQUIREMENTS
# Email must be unique for each user
USERS_TO_SEED = [
    {
        "name": "Prof. Rosh",
        "email": "rosh@eduai.com",
        "password": "teacher123",
        "role": "teacher",
        "department": "Computer Science",
        "employee_id": "EMP001"
    },
    {
        "name": "Dr. Anita Kumari",
        "email": "anita@eduai.com",
        "password": "123teacher",
        "role": "teacher",
        "department": "Data Science",
        "employee_id": "EMP002"
    },
    {
        "name": "Omkaar",
        "email": "omkaar@eduai.com",
        "password": "student123",
        "role": "student",
        "registration_number": "25441156",
        "department": "Computer Science"
    },
    # You can add student details here too
    {
        "name": "Aarav Gupta",
        "email": "aarav@student.com",
        "password": "123student",
        "role": "student",
        "registration_number": "REG2024001",
        "department": "Data Science"
    }
]

def seed_users():
    # Ensure tables exist (self-healing if DB is deleted)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    print("--- Starting User Seeding Process ---")
    
    for user_data in USERS_TO_SEED:
        email = user_data["email"]
        db_user = db.query(User).filter(User.email == email).first()
        
        # Truncate password to 72 chars to avoid bcrypt limit
        raw_password = user_data.pop("password")[:72]
        user_data["hashed_password"] = get_password_hash(raw_password)
        
        if db_admin := db.query(User).filter(User.email == email).first():
            print(f"Updating existing user: {email}")
            for key, value in user_data.items():
                setattr(db_admin, key, value)
        else:
            print(f"Creating new user: {email}")
            new_user = User(**user_data)
            db.add(new_user)
            
    try:
        db.commit()
        print("--- Seeding Completed Successfully! ---")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
