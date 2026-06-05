# 🎓 EduAI Suite

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![Python](https://img.shields.io/badge/Python-3.10+-yellow)

EduAI Suite is a comprehensive, modern educational platform designed to bridge the gap between interactive learning and AI-powered teaching assistance. It consists of multiple interconnected applications that serve both educators and students through real-time engagement and generative AI.

---

## 🌟 Key Features

### 🤖 Auto Lesson Planner
Powered by Groq and the Llama 3 model, the Auto Lesson Planner allows teachers to input a topic and syllabus context to instantly generate a comprehensive lesson plan. The AI generates the lecture flow, real-world examples, interactive activities, and quiz questions, which can then be directly posted to students.

### 📊 EduSlido (Live Presentations & Polling)
A real-time presentation and polling system. Teachers can assign PPTX submissions, grade them, and run live interactive sessions using WebSockets. During a session, students can participate in live polls, submit Q&A questions, and upvote their peers' questions while the teacher navigates through slides.

### 🎮 Educational Games Hub
Features collaborative learning games like the **Chain Answer Game**. Students take turns creating word chains based on configurable rules (Standard, Category, Ladder, etc.) in a real-time multiplayer environment.

---

## 🏗️ System Architecture

EduAI Suite is built as a monorepo utilizing npm workspaces and is composed of three main layers:

### 1. Frontend Layer (React & TypeScript)
- **TeacherBuddy (`apps/teacherbuddy`)**: The dedicated portal for educators. Allows teachers to use AI tools, create lessons, manage game sessions, assign presentation tasks, and grade student submissions.
- **EduGames (`apps/edugames`)**: The interactive portal for students. Here, students can view posted lessons, submit assignments, participate in live presentation sessions, and play educational multiplayer games.

### 2. Backend API Layer (FastAPI)
The central nervous system of the platform, built with Python and FastAPI.
- **RESTful Endpoints**: Manages lessons, users, games, and presentation assignments.
- **WebSocket Server**: Powers real-time polling, Q&A boards, and live game states.
- **AI Integration**: Interfaces directly with the Groq Cloud API for all generative AI tasks.

### 3. Persistence & Storage Layer
- **Database**: Uses modern ORMs (SQLAlchemy/Beanie) to support both SQL (SQLite/PostgreSQL) and NoSQL (MongoDB) paradigms for different services.
- **Storage**: Integrates with S3/MinIO for secure handling of presentation uploads and static assets.

---

## 📁 Project Structure

```text
EduAI_Suite/
├── apps/
│   ├── teacherbuddy/      # React/TS App for Educators
│   └── edugames/          # React/TS App for Students
├── backend/               # FastAPI Python Server
│   ├── app/
│   │   ├── models/        # Database models
│   │   ├── routes/        # API and WebSocket routes
│   │   ├── schemas/       # Pydantic validation models
│   │   └── services/      # Business logic & AI integration
│   ├── requirements.txt   # Python dependencies
│   └── main.py            # Entry point
└── package.json           # Root workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Groq API Key** (for AI features)
- **MinIO/S3** (optional, for local storage development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EduAI_Suite
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Set up the Backend environment:**
   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   - In the `backend` directory, copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Add your `GROQ_API_KEY` to the `.env` file.

### Running the Application

**1. Start the Frontend Apps (TeacherBuddy & EduGames)**
From the root directory, you can start both frontend applications concurrently:
```bash
npm run dev
```
- TeacherBuddy runs on `http://localhost:5173` (default)
- EduGames runs on `http://localhost:5174` (default)

**2. Start the Backend API**
Open a new terminal, activate your python environment, and run:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- The API will be available at `http://localhost:8000`
- Swagger UI Documentation is available at `http://localhost:8000/docs`

---

## 🧪 Testing

The platform includes comprehensive testing suites for both the frontend components and backend API.

- **Backend:** Run Pytest for endpoint, service, and database persistence tests.
- **Frontend:** Component testing using standard React testing utilities.

---

## 📄 License

This project is licensed under the MIT License.
