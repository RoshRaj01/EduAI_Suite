from app.database import SessionLocal
from app.models.course import Course
from app.models.announcement import Announcement
from app.models.student import Student

db = SessionLocal()

# 🔹 Clear old data (optional)
db.query(Announcement).delete()
db.query(Student).delete()
db.query(Course).delete()

# 🔹 Add courses
course1 = Course(
    code="CSC401",
    name="Advanced Neural Networks",
    batch="2026-A",
    students=42,
    next_class="Today, 2:00 PM",
    progress=68,
    color="#264796",
    description="Deep learning architectures"
)

course2 = Course(
    code="CSC312",
    name="Data Structures",
    batch="2025-B",
    students=38,
    next_class="Tomorrow, 10:00 AM",
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

# 🔹 Students
db.add_all([
    Student(
        course_id=course1.id,
        name="Arjun Mehta",
        roll="S4121",
        attendance=95,
        avg_score=92
    ),
    Student(
        course_id=course1.id,
        name="Sneha Patil",
        roll="S4135",
        attendance=90,
        avg_score=88
    )
])

db.commit()
db.close()

print("✅ Dummy data inserted")