import os
import sys

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.course import Course
from app.models.student import Student

def seed():
    db = SessionLocal()
    
    # 1. Ensure courses exist
    course_map = {
        "BSc Data Science": {"code": "BDS101", "color": "#264796", "desc": "BSc Data Science"},
        "BCA": {"code": "BCA201", "color": "#d0ae61", "desc": "Bachelor of Computer Applications"},
        "BBA": {"code": "BBA301", "color": "#5b8def", "desc": "Bachelor of Business Administration"},
        "BA Economics": {"code": "BAE401", "color": "#ef5b5b", "desc": "BA Economics"}
    }
    
    db_courses = {}
    for name, info in course_map.items():
        course = db.query(Course).filter(Course.name == name).first()
        if not course:
            course = Course(
                name=name,
                code=info["code"],
                color=info["color"],
                description=info["desc"],
                batch="2026-A",
                students=0,
                progress=0
            )
            db.add(course)
            db.commit()
            db.refresh(course)
        db_courses[name] = course

    # 2. Student Data from Image
    raw_data = [
        # Batch 2111
        {"reg": "21112001", "name": "Aarav Menon", "email": "aarav.menon@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 100, "att": 75},
        {"reg": "21112002", "name": "Reyansh Shetty", "email": "reyansh.shetty@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 57, "att": 83},
        {"reg": "21112003", "name": "Krishna Nair", "email": "krishna.nair@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 74, "att": 84},
        {"reg": "21112004", "name": "Sai Rao", "email": "sai.rao@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 67, "att": 79},
        {"reg": "21112005", "name": "Ishaan Joshi", "email": "ishaan.joshi@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 83, "att": 85},
        {"reg": "21112006", "name": "Saanvi Kapoor", "email": "saanvi.kapoor@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 55, "att": 80},
        {"reg": "21113001", "name": "Diya Iyer", "email": "diya.iyer@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 96, "att": 70},
        {"reg": "21113002", "name": "Krishna Pillai", "email": "krishna.pillai@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 90, "att": 86},
        {"reg": "21113003", "name": "Sara Iyer", "email": "sara.iyer@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 69, "att": 92},
        {"reg": "21113004", "name": "Sai Rao", "email": "sai.rao@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 66, "att": 80},
        {"reg": "21113005", "name": "Ananya Nair", "email": "ananya.nair@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 97, "att": 93},
        {"reg": "21113006", "name": "Anika Gupta", "email": "anika.gupta@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 78, "att": 77},
        {"reg": "21114001", "name": "Riya Nair", "email": "riya.nair@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 66, "att": 86},
        {"reg": "21114002", "name": "Saanvi Singh", "email": "saanvi.singh@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 80, "att": 87},
        {"reg": "21114003", "name": "Aarav Mehta", "email": "aarav.mehta@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 96, "att": 76},
        {"reg": "21114004", "name": "Sai Nair", "email": "sai.nair@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 98, "att": 89},
        {"reg": "21114005", "name": "Meera Gupta", "email": "meera.gupta@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 100, "att": 88},
        {"reg": "21114006", "name": "Myra Singh", "email": "myra.singh@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 53, "att": 83},
        {"reg": "21115001", "name": "Aarav Das", "email": "aarav.das@baeconomics.christuniversity.in", "course": "BA Economics", "dept": "Economics", "marks": 91, "att": 70},
        {"reg": "21115002", "name": "Diya Bose", "email": "diya.bose@baeconomics.christuniversity.in", "course": "BA Economics", "dept": "Economics", "marks": 86, "att": 81},
        {"reg": "21115003", "name": "Aaditya Sharma", "email": "aaditya.sharma@baeconomics.christuniversity.in", "course": "BA Economics", "dept": "Economics", "marks": 67, "att": 95},
        
        # Batch 2211
        {"reg": "22112001", "name": "Aarav Bose", "email": "aarav.bose@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 74, "att": 80},
        {"reg": "22112002", "name": "Myra Chopra", "email": "myra.chopra@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 84, "att": 93},
        {"reg": "22112003", "name": "Vivaan Bose", "email": "vivaan.bose@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 85, "att": 95},
        {"reg": "22113001", "name": "Aarav Kulkarni", "email": "aarav.kulkarni@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 92, "att": 81},
        {"reg": "22113002", "name": "Myra Khan", "email": "myra.khan@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 90, "att": 86},
        {"reg": "22114001", "name": "Anika Joshi", "email": "anika.joshi@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 64, "att": 84},
        {"reg": "22114002", "name": "Sai Kapoor", "email": "sai.kapoor@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 100, "att": 72},
        
        # Batch 2311
        {"reg": "23112001", "name": "Sara Kulkarni", "email": "sara.kulkarni@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 77, "att": 99},
        {"reg": "23112002", "name": "Rosh Rajesh", "email": "rosh.rajesh@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 68, "att": 76},
        {"reg": "23112003", "name": "Rosh R", "email": "rosh.r@bscdsh.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 76, "att": 97},
        {"reg": "23113001", "name": "Saanvi Bose", "email": "saanvi.bose@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 97, "att": 84},
        {"reg": "23114001", "name": "Shaurya Joshi", "email": "shaurya.joshi@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 81, "att": 89},


        # Batch 2411
        {"reg": "24112001", "name": "Anika Joshi", "email": "anika.joshi@bscdatascience.christuniversity.in", "course": "BSc Data Science", "dept": "Statistics and Data Science", "marks": 98, "att": 93},
        {"reg": "24113001", "name": "Aarav Joshi", "email": "aarav.joshi@bca.christuniversity.in", "course": "BCA", "dept": "Computer Science", "marks": 82, "att": 84},
        {"reg": "24114001", "name": "Ananya Nair", "email": "ananya.nair@bba.christuniversity.in", "course": "BBA", "dept": "Business Administration", "marks": 65, "att": 76},
        {"reg": "24115001", "name": "Reyansh Pillai", "email": "reyansh.pillai@baeconomics.christuniversity.in", "course": "BA Economics", "dept": "Economics", "marks": 59, "att": 71}
    ]

    for s in raw_data:
        # Check if student already exists
        exists = db.query(Student).filter(Student.registration_number == s["reg"]).first()
        if not exists:
            student = Student(
                registration_number=s["reg"],
                name=s["name"],
                email=s["email"],
                course_id=db_courses[s["course"]].id,
                department=s["dept"],
                attendance=s["att"],
                avg_score=s["marks"],
                student_class="2026-A"
            )
            db.add(student)
    
    db.commit()
    db.close()
    print(f"Successfully seeded {len(raw_data)} students seed file")

if __name__ == "__main__":
    seed()
