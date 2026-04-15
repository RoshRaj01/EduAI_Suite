import os
from app.database import SessionLocal
from app.models.course import Course
from app.models.student import Student

db = SessionLocal()

courses = db.query(Course).all()
for course in courses:
    actual_count = db.query(Student).filter(Student.course_id == course.id).count()
    course.students = actual_count
    print(f"Updated {course.name} to {actual_count} students.")

db.commit()
db.close()
print("All course student counts successfully recalculated.")
