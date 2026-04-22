# Auto Lesson Planner - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EduAI Suite                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  FRONTEND LAYER                            │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐       │ │
│  │  │   TeacherBuddy       │  │   EduGames           │       │ │
│  │  │   (React/TS)         │  │   (React/TS)         │       │ │
│  │  ├──────────────────────┤  ├──────────────────────┤       │ │
│  │  │                      │  │                      │       │ │
│  │  │ AI Teaching Tools    │  │ Student Dashboard    │       │ │
│  │  │ ├─ Lesson Planner ✅ │  │ ├─ New Lessons ✅    │       │ │
│  │  │ │ (ChatGPT UI)       │  │ │ (Widget)           │       │ │
│  │  │ ├─ Input Topic       │  │ └─ Shows Posted      │       │ │
│  │  │ ├─ Preview Content   │  │   Lessons            │       │ │
│  │  │ └─ Post to Students  │  │                      │       │ │
│  │  │                      │  │                      │       │ │
│  │  └──────────────────────┘  └──────────────────────┘       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           │ HTTP/REST                           │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              BACKEND API LAYER (FastAPI)                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Lesson Routes:                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ POST   /lessons/generate  (Topic → AI Content)    │  │ │
│  │  │ POST   /lessons           (Create Lesson)         │  │ │
│  │  │ GET    /lessons           (List Lessons)          │  │ │
│  │  │ GET    /lessons/:id       (Get Lesson Details)    │  │ │
│  │  │ PUT    /lessons/:id       (Update Draft)          │  │ │
│  │  │ POST   /lessons/:id/post  (Publish to Students)   │  │ │
│  │  │ DELETE /lessons/:id       (Delete Draft)          │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  AI Integration:                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ GroqService.generate_lesson_plan()                │  │ │
│  │  │ ├─ Input: Topic + Syllabus Context                │  │ │
│  │  │ ├─ Call: Groq Cloud API (llama-3.3-70b)           │  │ │
│  │  │ ├─ Parse: Structured Response                     │  │ │
│  │  │ └─ Output: {                                       │  │ │
│  │  │             lecture_flow: string                  │  │ │
│  │  │             examples: string                      │  │ │
│  │  │             activities: string                    │  │ │
│  │  │             quiz_questions: string                │  │ │
│  │  │           }                                        │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           │ SQLAlchemy ORM                       │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           PERSISTENCE LAYER (SQLite/PostgreSQL)           │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Lessons Table:                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ id (PK)              INTEGER                       │  │ │
│  │  │ course_id (FK)       INTEGER → courses.id          │  │ │
│  │  │ title                VARCHAR (Optional)            │  │ │
│  │  │ topic                VARCHAR (Required)            │  │ │
│  │  │ syllabus_context     TEXT                          │  │ │
│  │  │ lecture_flow         TEXT (Generated)              │  │ │
│  │  │ examples             TEXT (Generated)              │  │ │
│  │  │ activities           TEXT (Generated)              │  │ │
│  │  │ quiz_questions       TEXT (Generated)              │  │ │
│  │  │ created_by (FK)      INTEGER → users.id            │  │ │
│  │  │ posted_at            TIMESTAMP (null until posted) │  │ │
│  │  │ created_at           TIMESTAMP                     │  │ │
│  │  │ updated_at           TIMESTAMP                     │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Teacher Workflow

```
Teacher Input
    │
    ├─ Topic: "Recursion in C++" (required)
    ├─ Syllabus: "Learn recursive algorithms" (optional)
    │
    ↓
Frontend Validation
    │
    ├─ Topic required? ✓
    ├─ Disable submit if empty? ✓
    │
    ↓
POST /lessons/generate
    │
    ├─ Endpoint: lesson_routes.py:generate_lesson()
    │
    ├─ Groq Service Call
    │   ├─ Model: llama-3.3-70b-versatile
    │   ├─ Prompt: Generate lecture_flow, examples, activities, quiz_questions
    │   └─ Fallback to: llama-3.1-70b-versatile or llama-3.1-8b-instant
    │
    ├─ Response Parsing
    │   ├─ Parse lecture_flow section
    │   ├─ Parse examples section
    │   ├─ Parse activities section
    │   └─ Parse quiz_questions section
    │
    ↓
Chat UI Display
    │
    ├─ Show: "Lesson plan generated successfully!"
    ├─ Display: Content preview
    └─ Enable: "Post to Students" button
    │
    ↓
Teacher Reviews & Clicks "Post to Students"
    │
    ├─ POST /lessons (Create lesson entry)
    │   ├─ Store: topic, lecture_flow, examples, activities, quiz_questions
    │   └─ Set: created_by, posted_at = null
    │
    ├─ POST /lessons/:id/post (Publish)
    │   └─ Update: posted_at = NOW()
    │
    ↓
Success Confirmation
    │
    ├─ Chat: "🎉 Lesson posted successfully!"
    ├─ Button: Green checkmark
    └─ Status: Published
```

### Student Workflow

```
Student Views Dashboard
    │
    ↓
Frontend: GET /lessons?posted_only=true
    │
    ├─ Filter: Only lessons with posted_at IS NOT NULL
    ├─ Limit: 5 most recent
    ├─ Sort: By created_at DESC
    │
    ↓
Response: Array of Lessons
    │
    [
      {
        id: 1,
        course_id: 1,
        title: "Recursion in C++",
        topic: "Recursion",
        posted_at: "2026-04-22T10:30:00Z",
        created_at: "2026-04-22T10:30:00Z"
      },
      ...
    ]
    │
    ↓
Dashboard Renders
    │
    ├─ Section: "📚 New Lesson Plans from Your Teachers"
    ├─ Cards: Each lesson shows title, topic, posted_date
    └─ Interactive: Hover shows chevron (ready for detail view)
```

## Component Relationships

```
AutoLessonPlannerComponent (Parent)
├── State Management
│   ├─ topic: string
│   ├─ syllabus: string
│   ├─ isGenerating: boolean
│   ├─ generatedLesson: GeneratedLesson | null
│   ├─ error: string | null
│   ├─ chatMessages: Message[]
│   └─ posted: boolean
│
├── Left Panel (Input)
│   ├─ Topic Input Field
│   ├─ Syllabus Textarea
│   ├─ Generate Button
│   ├─ Post to Students Button
│   └─ Error Display
│
├── Right Panel (Output)
│   ├─ Chat Messages
│   │   ├─ User messages (blue)
│   │   └─ AI responses (gray)
│   │
│   └─ Content Preview
│       ├─ Lecture Flow preview
│       ├─ Examples preview
│       └─ View Full Lesson link
│
└── API Integration
    ├─ POST /lessons/generate
    ├─ POST /lessons
    └─ POST /lessons/:id/post
```

## Error Handling Flow

```
Error Scenarios:

1. Empty Topic
   └─ UI: Validation error shown in input field

2. Groq Service Unavailable
   ├─ Primary model fails
   ├─ Try: Alternative model 1
   ├─ Try: Alternative model 2
   └─ If all fail: Return error to user

3. API Error Response
   ├─ 400: Validation error → Show message
   ├─ 404: Not found → Show message
   ├─ 500: Server error → Show message
   └─ Network: Connection error → Show retry

4. Database Issues
   ├─ Foreign key constraint → Error message
   └─ Duplicate entry → Error message

All errors:
├─ Logged on backend
├─ User-friendly message shown
├─ Chat shows error status (❌)
└─ UI remains functional for retry
```

## Security & Validation

```
Input Validation Chain:

User Input
    ↓
Frontend Validation
├─ Required field check (topic)
├─ Max length check
├─ Sanitization
    ↓
Backend Validation (Pydantic)
├─ LessonGenerateRequest validation
├─ Type checking
├─ Range validation
    ↓
Database Validation
├─ Foreign key constraints
├─ Not null constraints
├─ Unique constraints
    ↓
Application Logic
├─ Authorization checks (created_by)
├─ State checks (can't edit posted lessons)
└─ Business rules
```

## Deployment Checklist

```
Local Development:
  ✓ npm install (install deps)
  ✓ Set GROQ_API_KEY
  ✓ npm run dev (start both apps)
  ✓ Test teacher flow
  ✓ Test student flow

Testing:
  ✓ API endpoint tests
  ✓ Frontend component tests
  ✓ Database persistence tests
  ✓ Error handling tests

Production:
  ✓ Environment variables set
  ✓ Database backups configured
  ✓ Monitoring enabled
  ✓ Logging configured
  ✓ CORS whitelisted
  ✓ API rate limiting (optional)
```

---

**Status**: ✅ Ready for Integration Testing
