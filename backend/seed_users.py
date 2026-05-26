import asyncio
from app.database import init_db
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

async def seed_users():
    await init_db()
    print("--- Starting User Seeding Process ---")
    
    for user_data in USERS_TO_SEED:
        email = user_data["email"]
        
        # Truncate password to 72 chars to avoid bcrypt limit
        raw_password = user_data.pop("password")[:72]
        user_data["hashed_password"] = get_password_hash(raw_password)
        
        db_user = await User.find_one(User.email == email)
        if db_user:
            print(f"Updating existing user: {email}")
            for key, value in user_data.items():
                setattr(db_user, key, value)
            await db_user.save()
        else:
            print(f"Creating new user: {email}")
            new_user = User(**user_data)
            await new_user.assign_id()
            await new_user.insert()
            
    print("--- Seeding Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(seed_users())
