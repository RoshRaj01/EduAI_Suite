import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.exam import Exam
from app.models.student import Student
from app.models.submission import Submission
from app.models.assignment import Assignment

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    await init_beanie(database=client.eduai, document_models=[Exam, Student, Submission, Assignment])
    exams = await Exam.find_all().to_list()
    print('Exams:', [(e.title, [(a.student_id, a.score) for a in e.attempts]) for e in exams])
    students = await Student.find_all().to_list()
    print('Students:', [(s.int_id, s.name) for s in students])
    subs = await Submission.find_all().to_list()
    print('Subs:', [(s.student_name, s.grade) for s in subs])
    assignments = await Assignment.find_all().to_list()
    print('Assignments:', [(a.title, a.max_points) for a in assignments])

asyncio.run(main())
