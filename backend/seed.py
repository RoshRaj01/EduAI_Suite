import os
from app.database import SessionLocal, Base, engine
from app.models.course import Course
from app.models.announcement import Announcement
from app.models.student import Student
from app.models.assignment import Assignment

if os.path.exists("eduV2.db"):
    # Delete to recreate fresh tables with new fields
    try:
        os.remove("eduV2.db")
    except PermissionError:
        pass

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 🔹 Add courses
course1 = Course(
    code="CSC401",
    name="Advanced Neural Networks",
    batch="2026-A",
    students=42,
    progress=88,
    color="#264796",
    description="Deep learning architectures"
)

course2 = Course(
    code="CSC312",
    name="Data Structures",
    batch="2025-B",
    students=38,
    progress=82,
    color="#d0ae61",
    description="DSA fundamentals"
)

db.add_all([course1, course2])
db.commit()

# 🔹 Refresh to get IDs
db.refresh(course1)
db.refresh(course2)

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
    )
])

# 🔹 Students
db.add_all([
    Student(
        course_id=course1.id,
        name="Arjun Mehta",
        email="arjun@example.com",
        registration_number="S4121",
        student_class="2026-A",
        department="Computer Science",
        attendance=95,
        avg_score=92
    ),
    Student(
        course_id=course1.id,
        name="Sneha Patil",
        email="sneha@example.com",
        registration_number="S4135",
        student_class="2026-A",
        department="Computer Science",
        attendance=90,
        avg_score=88
    )
])

db.commit()
db.close()

print("Dummy data inserted successfully")