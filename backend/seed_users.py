from app.database import SessionLocal
from app.models.user import User
from app.utils.auth import get_password_hash


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
        "name": "Aarav Gupta",
        "email": "aarav@student.com",
        "password": "student123",
        "role": "student",
        "registration_number": "REG2024001",
        "department": "Data Science"
    },
    {
        "name": "Omkaar",
        "email": "omkaar@student.com",
        "password": "123student",
        "role": "student",
        "registration_number": "25441156",
        "department": "Computer Science"
    }
]


def seed_users():
    db = SessionLocal()
    print("--- Starting User Seeding Process ---")
    
    for user_data in USERS_TO_SEED:
        email = user_data["email"]
        db_user = db.query(User).filter(User.email == email).first()
        
        raw_password = user_data["password"]
        
        user_dict = user_data.copy()
        user_dict["hashed_password"] = get_password_hash(raw_password)
        user_dict.pop("password", None)
        
        if db_user:
            print(f"Updating existing user: {email}")
            for key, value in user_dict.items():
                setattr(db_user, key, value)
        else:
            print(f"Creating new user: {email}")
            new_user = User(**user_dict)
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