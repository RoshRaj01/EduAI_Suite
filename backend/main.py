from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="EduAI Suite Backend API")

# Add CORS middleware to allow requests from local dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://teacherbuddy.local:5173", "http://edugames.local:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduAI Suite Backend (FastAPI)"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "main_api"}

# -- Placeholder Endpoints --

@app.post("/api/auth/login")
def login():
    return {"token": "mock-jwt-token"}

@app.post("/api/ai/evaluate")
def evaluate_answers():
    return {"ai_score": 85.5, "confidence": 0.9}

@app.get("/api/risk/classroom/{classroom_id}")
def get_risk_score(classroom_id: str):
    return {"students_at_risk": 3}
