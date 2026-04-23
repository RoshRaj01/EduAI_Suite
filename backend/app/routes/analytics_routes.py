from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.exam import ExamAttempt, Exam
from app.models.submission import Submission
from app.models.course import Course
from app.models.assignment import Assignment
from app.models.user import User
from typing import List, Optional
import pandas as pd
import io
import json
import numpy as np
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/course/{course_id}")
def get_course_analytics(course_id: int, db: Session = Depends(get_db)):
    # Get all exams for the course
    exams = db.query(Exam).filter(Exam.course_id == course_id).all()
    exam_ids = [e.id for e in exams]
    
    # Get all attempts for these exams
    attempts = db.query(ExamAttempt).filter(ExamAttempt.exam_id.in_(exam_ids), ExamAttempt.status == "submitted").all()
    
    # Get all assignments for the course
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
    assignment_ids = [a.id for a in assignments]
    
    # Get all submissions for these assignments
    submissions = db.query(Submission).filter(Submission.assignment_id.in_(assignment_ids)).all()
    
    all_data = []
    for a in attempts:
        all_data.append({
            "student_id": a.student_id,
            "student_name": a.student.name if a.student else "Unknown",
            "score": a.score,
            "type": "exam",
            "item_id": a.exam_id,
            "date": a.end_time
        })
    
    for s in submissions:
        if s.grade is not None:
            try:
                # Format is "02:45 PM, Apr 23"
                date_val = datetime.strptime(s.submitted_at, "%I:%M %p, %b %d")
                date_val = date_val.replace(year=datetime.now().year)
            except:
                date_val = datetime.now()

            all_data.append({
                "student_id": None, 
                "student_name": s.student_name,
                "score": s.grade,
                "type": "assignment",
                "item_id": s.assignment_id,
                "date": date_val
            })

    if not all_data:
        return {
            "overview": {
                "avg_score": "0%",
                "total_students": 0,
                "at_risk_count": 0,
                "attendance_rate": "0%",
                "pass_rate": "0%",
                "high_score": "0%",
                "low_score": "0%"
            },
            "risk_students": [],
            "performance_trend": [],
            "subject_breakdown": []
        }

    df = pd.DataFrame(all_data)
    avg_score = df["score"].mean()
    total_students = df["student_name"].nunique()
    pass_rate = (df["score"] >= 50).mean() * 100
    
    # Simple risk logic
    student_avgs = df.groupby('student_name')['score'].mean()
    at_risk_count = int((student_avgs < 50).sum())
    
    # Performance trend
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.strftime('%b')
    month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    trend_df = df.groupby('month')['score'].mean().reindex(month_order).dropna().reset_index()
    trend = trend_df.replace([np.inf, -np.inf], 0).fillna(0).to_dict(orient='records')
    
    # Risk Students list
    risk_list = []
    for sname, savg in student_avgs.items():
        if savg < 70:
            risk_list.append({
                "id": f"ST-{hash(sname) % 10000}",
                "name": sname,
                "attendance": 85,
                "avgScore": float(savg) if not np.isnan(savg) else 0,
                "assignments": 90,
                "risk": int(100 - savg), 
                "level": "high" if savg < 40 else "moderate"
            })

    subject_stats = []
    for e in exams:
        exam_scores = df[(df['type'] == 'exam') & (df['item_id'] == e.id)]['score']
        if not exam_scores.empty:
            subject_stats.append({
                "subject": e.title,
                "avg": float(exam_scores.mean())
            })

    return {
        "overview": {
            "avg_score": f"{avg_score:.1f}%",
            "total_students": total_students,
            "at_risk_count": at_risk_count,
            "attendance_rate": "85%",
            "pass_rate": f"{pass_rate:.0f}%",
            "high_score": f"{df['score'].max():.1f}%",
            "low_score": f"{df['score'].min():.1f}%"
        },
        "risk_students": risk_list,
        "performance_trend": trend,
        "subject_breakdown": subject_stats
    }

@router.post("/upload")
async def upload_analytics_data(
    file: UploadFile = File(...),
    impute_method: str = Form("auto") # auto, zero, mean, blank
):
    contents = await file.read()
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    elif file.filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(io.BytesIO(contents))
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Clean column names
    original_cols = list(df.columns)
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
    
    # Identify numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    # Avoid columns that look like IDs
    id_keywords = ['id', 'reg', 'number', 'roll', 'serial', 'sn', 'index']
    valid_numeric_cols = [c for c in numeric_cols if not any(k in c for k in id_keywords)]
    
    # --- Smart Imputation ---
    if impute_method == "auto" or impute_method == "zero":
        for col in valid_numeric_cols:
            if 'total' in col:
                # Try to find component columns (score, exam, quiz, assignment, mid, final)
                components = [c for c in valid_numeric_cols if any(k in c for k in ['score', 'exam', 'quiz', 'assign', 'mid', 'final', 'test']) and c != col]
                if components:
                    # Fill missing totals by summing components
                    df[col] = df[col].fillna(df[components].sum(axis=1))
                else:
                    df[col] = df[col].fillna(0)
            else:
                # Component or exam columns should be zero if missing
                df[col] = df[col].fillna(0)
    elif impute_method == "mean":
        df[valid_numeric_cols] = df[valid_numeric_cols].fillna(df[valid_numeric_cols].mean().fillna(0))
    
    # Final sweep for JSON compatibility
    df[numeric_cols] = df[numeric_cols].replace([np.inf, -np.inf], np.nan).fillna(0)

    # Score Column Identification (Prioritize keywords, avoid IDs)
    score_col = None
    for col in ['total', 'score', 'marks', 'percentage', 'grade', 'final_score']:
        if col in df.columns:
            score_col = col
            break
    
    if not score_col and valid_numeric_cols:
        score_col = valid_numeric_cols[0]
    
    if score_col:
        avg_score = float(df[score_col].mean())
        pass_rate = (df[score_col] >= 50).mean() * 100 # Assuming 100 base
        
        # Grade Distribution
        bins = [0, 60, 70, 80, 90, 101]
        labels = ['Below 60%', 'B+ (60-69%)', 'A (70-79%)', 'A+ (80-89%)', 'O (90-100%)']
        df['grade_group'] = pd.cut(df[score_col], bins=bins, labels=labels, right=False)
        df['grade_group'] = df['grade_group'].astype(str)
        distribution = df['grade_group'].value_counts().to_dict()
        dist_list = [{"grade": k, "pct": int((v / len(df)) * 100)} for k, v in distribution.items() if k != 'nan']
        
        # Risk identification
        risk_students = []
        name_col = 'name' if 'name' in df.columns else 'student_name' if 'student_name' in df.columns else df.columns[0]
        
        for _, row in df[df[score_col] < 60].iterrows():
            risk_students.append({
                "id": str(row.get('id', 'N/A')),
                "name": str(row.get(name_col, 'Unknown')),
                "avgScore": float(row[score_col]),
                "risk": int(100 - row[score_col]),
                "level": "high" if row[score_col] < 40 else "moderate"
            })
    else:
        avg_score = 0
        pass_rate = 0
        dist_list = []
        risk_students = []

    # Map back original names for raw data if needed, but keeping slugs is often cleaner for JSON
    return {
        "summary": {
            "rows": len(df),
            "columns": list(df.columns),
            "avg_score": f"{avg_score:.1f}%" if score_col else "N/A",
            "pass_rate": f"{pass_rate:.0f}%",
            "high_score": f"{df[score_col].max():.1f}%" if score_col else "0%",
            "low_score": f"{df[score_col].min():.1f}%" if score_col else "0%"
        },
        "distribution": dist_list,
        "risk_students": risk_students,
        "raw_data": df.to_dict(orient='records')[:100] 
    }
