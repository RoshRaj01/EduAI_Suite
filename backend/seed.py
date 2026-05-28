import os
import asyncio
from dotenv import load_dotenv
from app.database import init_db
from app.models.user import User
from app.models.course import Course
from app.models.announcement import Announcement
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.appointment import Appointment
from app.utils.auth import get_password_hash
from seed_users import USERS_TO_SEED

load_dotenv()

async def seed_data():
    print("Initializing Database...")
    await init_db()

    print("\n--- Phase 1: Seeding Users ---")
    seeded_teachers = []
    seeded_students = []

    for user_data in USERS_TO_SEED:
        email = user_data["email"]
        raw_password = user_data.pop("password", "eduai123")[:72]
        user_data["hashed_password"] = get_password_hash(raw_password)
        
        # Check if user already exists
        db_user = await User.find_one(User.email == email)
        if db_user:
            print(f"Updating user: {email}")
            for key, value in user_data.items():
                setattr(db_user, key, value)
            await db_user.save()
            user_obj = db_user
        else:
            print(f"Creating user: {email}")
            user_obj = User(**user_data)
            await user_obj.assign_id()
            await user_obj.insert()
            
        if user_obj.role == "teacher":
            seeded_teachers.append(user_obj)
        elif user_obj.role == "student":
            seeded_students.append(user_obj)

    teacher1_name = seeded_teachers[0].name if len(seeded_teachers) > 0 else "Prof. Default"
    teacher2_name = seeded_teachers[1].name if len(seeded_teachers) > 1 else "Dr. Default"
    teacher3_name = seeded_teachers[0].name if len(seeded_teachers) > 0 else "Prof. Default"

    print("\n--- Phase 2: Seeding Courses ---")
    course1 = Course(
        code="CSC401",
        name="Advanced Neural Networks",
        batch="2026-A",
        students=42,
        progress=88,
        color="#264796",
        description="Deep learning architectures",
        teacher_name=teacher1_name
    )

    course2 = Course(
        code="CSC312",
        name="Data Structures",
        batch="2025-B",
        students=38,
        progress=82,
        color="#d0ae61",
        description="DSA fundamentals",
        teacher_name=teacher2_name
    )

    course3 = Course(
        code="MAT214",
        name="Discrete Mathematics",
        batch="2025-A",
        students=34,
        progress=76,
        color="#5b8def",
        description="Logic, proofs, and combinatorics",
        teacher_name=teacher3_name
    )

    await course1.assign_id()
    await course1.insert()
    await course2.assign_id()
    await course2.insert()
    await course3.assign_id()
    await course3.insert()
    print("Courses seeded successfully!")

    print("\n--- Phase 3: Seeding Announcements ---")
    a1 = Announcement(
        course_id=course1.int_id,
        title="Lab 4 Released",
        body="Complete backpropagation lab",
        time="Today",
        pinned=True
    )
    a2 = Announcement(
        course_id=course1.int_id,
        title="Midterm Exam",
        body="Scheduled next week",
        time="Yesterday",
        pinned=False
    )
    await a1.assign_id()
    await a1.insert()
    await a2.assign_id()
    await a2.insert()
    print("Announcements seeded successfully!")

    print("\n--- Phase 4: Seeding Assignments ---")
    assignments = [
        Assignment(
            course_id=course1.int_id,
            title="Lab Report - 1",
            description="Write a detailed report on backpropagation implementation.",
            due_date="2026-06-20T23:59",
            max_points=50
        ),
        Assignment(
            course_id=course1.int_id,
            title="Mid-Term Project",
            description="Design a generic CNN for image classification.",
            due_date="2026-06-25T23:59",
            max_points=100
        ),
        Assignment(
            course_id=course2.int_id,
            title="Linked List Challenge",
            description="Implement a doubly linked list with insert and delete operations.",
            due_date="2026-06-22T23:59",
            max_points=75
        ),
        Assignment(
            course_id=course3.int_id,
            title="Proof Portfolio",
            description="Submit proofs for the selected discrete math problems.",
            due_date="2026-06-28T23:59",
            max_points=60
        )
    ]
    for asn in assignments:
        await asn.assign_id()
        await asn.insert()
    print("Assignments seeded successfully!")

    print("\n--- Phase 5: Seeding Student Profiles ---")
    student_data = [
        {
            "course_id": course1.int_id,
            "name": seeded_students[0].name if len(seeded_students) > 0 else "Omkaar",
            "email": seeded_students[0].email if len(seeded_students) > 0 else "omkaar@eduai.com",
            "registration_number": "25441156",
            "student_class": "2026-A",
            "department": "Computer Science",
            "attendance": 95,
            "avg_score": 92
        },
        {
            "course_id": course1.int_id,
            "name": seeded_students[1].name if len(seeded_students) > 1 else "Aarav Gupta",
            "email": seeded_students[1].email if len(seeded_students) > 1 else "aarav@student.com",
            "registration_number": "REG2024001",
            "student_class": "2026-A",
            "department": "Data Science",
            "attendance": 90,
            "avg_score": 88
        },
        {
            "course_id": course2.int_id,
            "name": seeded_students[0].name if len(seeded_students) > 0 else "Omkaar",
            "email": seeded_students[0].email if len(seeded_students) > 0 else "omkaar@eduai.com",
            "registration_number": "25441156",
            "student_class": "2025-B",
            "department": "Computer Science",
            "attendance": 93,
            "avg_score": 86
        },
        {
            "course_id": course2.int_id,
            "name": seeded_students[1].name if len(seeded_students) > 1 else "Aarav Gupta",
            "email": seeded_students[1].email if len(seeded_students) > 1 else "aarav@student.com",
            "registration_number": "REG2024001",
            "student_class": "2025-B",
            "department": "Data Science",
            "attendance": 89,
            "avg_score": 91
        }
    ]

    for s_dict in student_data:
        s = Student(**s_dict)
        await s.assign_id()
        await s.insert()
    print("Student profiles seeded successfully!")

    print("\n--- Phase 6: Seeding Appointments ---")
    appointments_data = [
        {
            "student_name": seeded_students[0].name if len(seeded_students) > 0 else "Omkaar",
            "student_email": seeded_students[0].email if len(seeded_students) > 0 else "omkaar@eduai.com",
            "teacher_name": teacher2_name,
            "teacher_department": "Data Science",
            "meeting_mode": "In-person",
            "time_slot": "2026-06-18T10:30",
            "agenda": "DSA questions",
            "details": "Clarify linked list implementation for the assignment.",
            "status": "pending",
            "requested_at": "2026-05-28T09:10"
        },
        {
            "student_name": seeded_students[0].name if len(seeded_students) > 0 else "Omkaar",
            "student_email": seeded_students[0].email if len(seeded_students) > 0 else "omkaar@eduai.com",
            "teacher_name": teacher1_name,
            "teacher_department": "Computer Science",
            "meeting_mode": "Online",
            "time_slot": "2026-06-19T15:00",
            "agenda": "Neural Networks Project review",
            "details": "Review project proposal and model selection.",
            "status": "approved",
            "requested_at": "2026-05-27T14:25",
            "reviewed_at": "2026-05-27T18:05",
            "reviewed_by": teacher1_name,
            "notes": "Approved for a 20-minute slot."
        }
    ]

    for a_dict in appointments_data:
        app = Appointment(**a_dict)
        await app.assign_id()
        await app.insert()
    print("Appointments seeded successfully!")

    print("\n--- Seeding Process Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(seed_data())
