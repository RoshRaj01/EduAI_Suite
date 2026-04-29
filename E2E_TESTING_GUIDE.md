# EduSlido End-to-End Testing Guide

## Overview

This guide covers testing the complete Slido workflow from assignment creation through live presentation and grading.

## Prerequisites

- Backend running on `http://localhost:8000`
- MinIO running on `http://localhost:9000` (for S3 testing)
- Frontend applications built and running

## Test Scenarios

### Scenario 1: Complete Submission & Grading Flow

#### Setup

```bash
# 1. Create assignment (via API or UI)
POST /api/slido/assignments
{
  "title": "Final Presentation",
  "description": "5-minute research presentation",
  "deadline": "2026-05-10T23:59:00Z"
}
# Note response assignment_id

# 2. Start MinIO (if S3 testing)
docker-compose -f docker-compose.minio.yml up -d
```

#### Test Steps

1. **Student Submission**
   - Open EduGames app
   - Navigate to "Submit Your Presentation"
   - Upload test `.pptx` file
   - Verify:
     - ✓ File validation works (reject non-.pptx)
     - ✓ File uploaded to S3/MinIO
     - ✓ Presigned URL generated
     - ✓ Submission saved in database
     - ✓ Late submission flag (if past deadline)

2. **Teacher Dashboard**
   - Open TeacherBuddy app
   - Navigate to "Presentation Assignments"
   - Verify:
     - ✓ Assignment appears in list
     - ✓ Submission count updated
     - ✓ Click to expand shows submissions table
     - ✓ File link is clickable (presigned URL)
     - ✓ Deadline shows countdown/overdue

3. **Live Presentation & Grading**
   - Click "View" or "Grade" on submission
   - Verify:
     - ✓ PPTX viewer loads presentation (Office Web Viewer API)
     - ✓ Slide navigation works
     - ✓ Live Grading Form appears
     - ✓ Can enter grade (0-100)
     - ✓ Can add feedback
     - ✓ Save button works

---

### Scenario 2: Live Session with Polls

#### Setup

```bash
# Create assignment and submission first (Scenario 1)
# Then create a session
POST /api/slido/sessions?teacher_id=1
{
  "assignment_id": {assignment_id},
  "submission_id": {submission_id}
}
# Note response session_id and pin
```

#### Test Steps

1. **Teacher Launches Session**
   - Use `session_pin` from session creation
   - Create a poll:
     ```
     POST /api/slido/sessions/{session_id}/polls?teacher_id=1
     {
       "question": "What is the main topic?",
       "poll_type": "multiple_choice"
     }
     ```

2. **Students Join via WebSocket**
   - In browser console or Postman:
     ```
     ws://localhost:8000/ws/slido/{pin}?user_type=student&user_id=1
     ```
   - Listen for events
   - Send poll response:
     ```
     {
       "type": "poll_vote",
       "poll_id": {poll_id},
       "option_text": "Option A"
     }
     ```
   - Verify:
     - ✓ Message sent successfully
     - ✓ Teacher receives vote count update
     - ✓ No errors in console

3. **Close Poll and View Results**
   - API: `PUT /api/slido/polls/{poll_id}?is_active=false`
   - Verify:
     - ✓ Results broadcast to all clients
     - ✓ Vote aggregation correct
     - ✓ Response counts match

---

### Scenario 3: Q&A Board Interaction

#### Test Steps

1. **Student Asks Question**
   - WebSocket message:
     ```
     {
       "type": "qna_question_asked",
       "question_text": "How do I submit?",
       "is_anonymous": true
     }
     ```
   - Verify:
     - ✓ Question appears in all clients
     - ✓ Anonymous flag respected
     - ✓ Upvote count starts at 0

2. **Student Upvotes Question**
   - WebSocket message:
     ```
     {
       "type": "qna_upvote",
       "question_id": {question_id}
     }
     ```
   - Verify:
     - ✓ Upvote count increments
     - ✓ Cannot upvote twice (error check)
     - ✓ Broadcast updates all clients

3. **Teacher Answers Question**
   - API: `POST /api/slido/qna/{question_id}/answer?teacher_id=1`
     ```
     {
       "is_answered": true,
       "teacher_answer": "Submit through the portal"
     }
     ```
   - Verify:
     - ✓ Question marked as answered
     - ✓ Answer visible to all clients
     - ✓ Teacher answer broadcast via WebSocket

---

### Scenario 4: File Upload Edge Cases

#### Test Cases

1. **Invalid File Extensions**
   - Upload `.pdf`, `.docx`, `.txt`
   - Verify: ✓ Rejected with clear error message

2. **Oversized File**
   - Upload file >100MB
   - Verify: ✓ Rejected with size error

3. **Corrupted ZIP Header**
   - Rename `.pptx` to `.zip`, modify bytes
   - Verify: ✓ Rejected by signature validation

4. **Concurrent Uploads**
   - Upload same assignment with 5+ students
   - Verify: ✓ All succeed without conflicts
   - Verify: ✓ Files stored with unique names

---

### Scenario 5: WebSocket Concurrency

#### Test

```bash
# Run load test
python3 backend/test_concurrency.py
```

#### Verify Output

```
Connected Students: 50/50
Messages Sent: XXX
Votes Cast: XXX
Questions Asked: XXX
Errors: 0
Polls Created: X

Response Times (ms):
  Min: X.XX
  Avg: X.XX
  Max: X.XX

✓ PASS
```

---

## API Test Checklist

### Assignment Management

- [ ] `POST /api/slido/assignments` - Create assignment
- [ ] `GET /api/slido/assignments` - List assignments
- [ ] `GET /api/slido/assignments/{id}` - Get single
- [ ] `PUT /api/slido/assignments/{id}` - Update
- [ ] Filter by teacher_id works
- [ ] Filter by course_id works

### File Operations

- [ ] `POST /api/slido/submissions/upload` - Upload PPTX
- [ ] File validation rejects non-.pptx
- [ ] File size validation works
- [ ] Presigned URL returns valid URL
- [ ] S3/MinIO storage accessible

### Grading

- [ ] `POST /api/slido/submissions/{id}/grade` - Grade
- [ ] Grade 0-100 validation
- [ ] Feedback saved
- [ ] Graded_at timestamp set
- [ ] Authorization check (teacher only)

### Sessions

- [ ] `POST /api/slido/sessions` - Start session
- [ ] PIN generated uniquely
- [ ] `GET /api/slido/sessions/pin/{pin}` - Join by PIN
- [ ] `PUT /api/slido/sessions/{id}` - Update state
- [ ] `POST /api/slido/sessions/{id}/end` - End session

### Polls

- [ ] Create poll in session
- [ ] Poll response submission
- [ ] Response aggregation (count)
- [ ] Close poll and get results
- [ ] Multiple response types (multiple choice, rating)

### Q&A

- [ ] Ask question (anonymous/named)
- [ ] Upvote question (no duplicates)
- [ ] Teacher answer question
- [ ] Questions ordered by upvotes

### WebSocket

- [ ] Connection with PIN
- [ ] Session state on connect
- [ ] Poll launched event
- [ ] Poll response handling
- [ ] Q&A broadcast
- [ ] Slide navigation sync
- [ ] Session ended broadcast

---

## Browser Testing

### TeacherBuddy

1. **Assignment Dashboard**
   - [ ] Page loads
   - [ ] Assignments display correctly
   - [ ] Expand submission table
   - [ ] Deadline formatting correct
   - [ ] Status badges (pending/submitted/graded)
   - [ ] Grade link works

2. **Live Grading**
   - [ ] Form appears on top of presentation
   - [ ] Grade slider works (0-100)
   - [ ] Feedback textarea functional
   - [ ] Quick templates clickable
   - [ ] Save button submits
   - [ ] Success message shows

### EduGames

1. **Submission Portal**
   - [ ] Page loads
   - [ ] Assignment card displays
   - [ ] Deadline countdown works
   - [ ] Drag-drop zone active
   - [ ] File validation (reject non-.pptx)
   - [ ] Upload progress visible
   - [ ] Success confirmation shows
   - [ ] Grade displays after grading

2. **Live Session**
   - [ ] Presentation viewer loads
   - [ ] Slide navigation works
   - [ ] Q&A panel appears
   - [ ] Question submission works
   - [ ] Upvote button functional
   - [ ] Poll modal appears on poll launch
   - [ ] Vote submission works
   - [ ] Teacher answers visible

---

## Performance Targets

- [ ] Page load <2s
- [ ] File upload (10MB) <5s
- [ ] WebSocket message delivery <500ms p95
- [ ] Poll aggregation <200ms for 50 students
- [ ] Concurrent users: 50+ with <1% error rate
- [ ] Database queries <200ms p95

---

## Rollback Checklist

If issues found:

1. Check backend logs for errors
2. Verify database connections
3. Test S3/MinIO connectivity
4. Clear browser cache
5. Restart Docker containers if needed
6. Verify file permissions on uploads directory

---

## Final Sign-Off

**Date:** ****\_\_\_****  
**Tester:** ****\_\_\_****

All scenarios passed: ☐ Yes ☐ No  
Known issues: ****************\_****************  
Recommendation: ☐ Ready for production ☐ Needs fixes
