from fastapi import FastAPI
from app.database import Base, engine
from app.routes import course_routes, announcement_routes, resource_routes, student_routes
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course_routes.router)
app.include_router(announcement_routes.router)
app.include_router(resource_routes.router)
app.include_router(student_routes.router)

@app.get("/")
def root():
    return {"message": "EduAI Backend Running"}