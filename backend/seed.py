import os
from app.database import SessionLocal, Base, engine
from app.models.course import Course
from app.models.announcement import Announcement
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.appointment import Appointment
from seed_users import USERS_TO_SEED

if os.path.exists("eduV2.db"):
    # Delete to recreate fresh tables with new fields
    try:
        os.remove("eduV2.db")
    except PermissionError:
        pass

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 🔹 Extract real teachers from USERS_TO_SEED
teachers = [user for user in USERS_TO_SEED if user.get("role") == "teacher"]

# Get teacher names
teacher1_name = teachers[0]["name"] if len(teachers) > 0 else "Prof. Default"
teacher2_name = teachers[1]["name"] if len(teachers) > 1 else "Dr. Default"
teacher3_name = teachers[0]["name"] if len(
    teachers) > 0 else "Prof. Default"  # Reuse first teacher

# 🔹 Add courses
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

db.add_all([course1, course2, course3])
db.commit()

# 🔹 Refresh to get IDs
db.refresh(course1)
db.refresh(course2)
db.refresh(course3)

# 🔹 Announcements
db.add_all([
    Announcement(
        course_id=course1.id,
        title="Lab 4 Released",
        body="Complete backpropagation lab",
        time="Today",
        pinned=True
    ),
    Announcement(
        course_id=course1.id,
        title="Midterm Exam",
        body="Scheduled next week",
        time="Yesterday",
        pinned=False
    )
])

# 🔹 Assignments
db.add_all([
    Assignment(
        course_id=course1.id,
        title="Lab Report - 1",
        description="Write a detailed report on backpropagation implementation.",
        due_date="2024-04-20",
        max_points=50
    ),
    Assignment(
        course_id=course1.id,
        title="Mid-Term Project",
        description="Design a generic CNN for image classification.",
        due_date="2024-04-25",
        max_points=100
    ),
    Assignment(
        course_id=course2.id,
        title="Linked List Challenge",
        description="Implement a doubly linked list with insert and delete operations.",
        due_date="2024-04-22",
        max_points=75
    ),
    Assignment(
        course_id=course3.id,
        title="Proof Portfolio",
        description="Submit proofs for the selected discrete math problems.",
        due_date="2024-04-28",
        max_points=60
    )
])

# 🔹 Students - Using real student data from USERS_TO_SEED
students_from_seed = [
    user for user in USERS_TO_SEED if user.get("role") == "student"]

student_data = [
    {
        "course_id": course1.id,
        "name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Arjun Mehta",
        "email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "arjun@example.com",
        "registration_number": students_from_seed[0].get("registration_number", "S4121") if len(students_from_seed) > 0 else "S4121",
        "student_class": "2026-A",
        "department": students_from_seed[0].get("department", "Computer Science") if len(students_from_seed) > 0 else "Computer Science",
        "attendance": 95,
        "avg_score": 92
    },
    {
        "course_id": course1.id,
        "name": students_from_seed[1]["name"] if len(students_from_seed) > 1 else "Sneha Patil",
        "email": students_from_seed[1]["email"] if len(students_from_seed) > 1 else "sneha@example.com",
        "registration_number": students_from_seed[1].get("registration_number", "S4135") if len(students_from_seed) > 1 else "S4135",
        "student_class": "2026-A",
        "department": students_from_seed[1].get("department", "Computer Science") if len(students_from_seed) > 1 else "Computer Science",
        "attendance": 90,
        "avg_score": 88
    },
    {
        "course_id": course2.id,
        "name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Aarav S.",
        "email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "aarav.s@christuniversity.in",
        "registration_number": students_from_seed[0].get("registration_number", "S4210") if len(students_from_seed) > 0 else "S4210",
        "student_class": "2025-B",
        "department": students_from_seed[0].get("department", "Computer Science") if len(students_from_seed) > 0 else "Computer Science",
        "attendance": 93,
        "avg_score": 86
    },
    {
        "course_id": course2.id,
        "name": students_from_seed[1]["name"] if len(students_from_seed) > 1 else "Diya Patel",
        "email": students_from_seed[1]["email"] if len(students_from_seed) > 1 else "diya.patel@example.com",
        "registration_number": students_from_seed[1].get("registration_number", "S4218") if len(students_from_seed) > 1 else "S4218",
        "student_class": "2025-B",
        "department": students_from_seed[1].get("department", "Computer Science") if len(students_from_seed) > 1 else "Computer Science",
        "attendance": 89,
        "avg_score": 91
    },
    {
        "course_id": course3.id,
        "name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Rohan Menon",
        "email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "rohan.menon@example.com",
        "registration_number": students_from_seed[0].get("registration_number", "S4302") if len(students_from_seed) > 0 else "S4302",
        "student_class": "2025-A",
        "department": students_from_seed[0].get("department", "Mathematics") if len(students_from_seed) > 0 else "Mathematics",
        "attendance": 96,
        "avg_score": 84
    },
    {
        "course_id": course3.id,
        "name": students_from_seed[1]["name"] if len(students_from_seed) > 1 else "Neha Gupta",
        "email": students_from_seed[1]["email"] if len(students_from_seed) > 1 else "neha.gupta@example.com",
        "registration_number": students_from_seed[1].get("registration_number", "S4307") if len(students_from_seed) > 1 else "S4307",
        "student_class": "2025-A",
        "department": students_from_seed[1].get("department", "Mathematics") if len(students_from_seed) > 1 else "Mathematics",
        "attendance": 91,
        "avg_score": 89
    }
]

db.add_all([Student(**s) for s in student_data])

# 🔹 Appointments - Using real student and teacher data
appointments_data = [
    {
        "student_name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Aarav S.",
        "student_email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "aarav.s@christuniversity.in",
        "teacher_name": teacher2_name,
        "teacher_department": teachers[1]["department"] if len(teachers) > 1 else "Computer Science",
        "meeting_mode": "In-person",
        "time_slot": "2026-04-18 10:30 AM",
        "topic": "Clarify linked list implementation for the assignment.",
        "status": "pending",
        "requested_at": "2026-04-17T09:10"
    },
    {
        "student_name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Aarav S.",
        "student_email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "aarav.s@christuniversity.in",
        "teacher_name": teacher1_name,
        "teacher_department": teachers[0]["department"] if len(teachers) > 0 else "Computer Science",
        "meeting_mode": "Online",
        "time_slot": "2026-04-19 03:00 PM",
        "topic": "Review project proposal and model selection.",
        "status": "approved",
        "requested_at": "2026-04-16T14:25",
        "reviewed_at": "2026-04-16T18:05",
        "reviewed_by": teacher1_name,
        "notes": "Approved for a 20-minute slot."
    },
    {
        "student_name": students_from_seed[1]["name"] if len(students_from_seed) > 1 else "Diya Patel",
        "student_email": students_from_seed[1]["email"] if len(students_from_seed) > 1 else "diya.patel@example.com",
        "teacher_name": teacher3_name,
        "teacher_department": teachers[0]["department"] if len(teachers) > 0 else "Mathematics",
        "meeting_mode": "Online",
        "time_slot": "2026-04-18 01:00 PM",
        "topic": "Need help with proof strategies for combinatorics.",
        "status": "pending",
        "requested_at": "2026-04-17T10:45"
    },
    {
        "student_name": students_from_seed[0]["name"] if len(students_from_seed) > 0 else "Rohan Menon",
        "student_email": students_from_seed[0]["email"] if len(students_from_seed) > 0 else "rohan.menon@example.com",
        "teacher_name": teacher2_name,
        "teacher_department": teachers[1]["department"] if len(teachers) > 1 else "Computer Science",
        "meeting_mode": "In-person",
        "time_slot": "2026-04-17 04:00 PM",
        "topic": "Discuss runtime complexity for the assignment.",
        "status": "rejected",
        "requested_at": "2026-04-15T11:15",
        "reviewed_at": "2026-04-15T15:20",
        "reviewed_by": teacher2_name,
        "notes": "Try the office hours on Friday instead."
    },
    {
        "student_name": students_from_seed[1]["name"] if len(students_from_seed) > 1 else "Neha Gupta",
        "student_email": students_from_seed[1]["email"] if len(students_from_seed) > 1 else "neha.gupta@example.com",
        "teacher_name": teacher1_name,
        "teacher_department": teachers[0]["department"] if len(teachers) > 0 else "Computer Science",
        "meeting_mode": "Online",
        "time_slot": "2026-04-20 11:00 AM",
        "topic": "Discuss data preprocessing for the neural network project.",
        "status": "pending",
        "requested_at": "2026-04-17T08:30"
    }
]

db.add_all([Appointment(**a) for a in appointments_data])

db.commit()
db.close()

print("Dummy data inserted successfully")
