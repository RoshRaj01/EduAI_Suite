from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord, WordCloudSession, WordCloudSubmission
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession, QuizPlayer, QuizAnswer
from app.models.slido import SlidoSession, SlidoPoll, PollResponse, SlidoQnA, QnAUpvote
import json
import random
from typing import Dict, Set
from datetime import datetime

# Store active WebSocket connections per game session


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, game_session_id: str, websocket: WebSocket):
        await websocket.accept()
        if game_session_id not in self.active_connections:
            self.active_connections[game_session_id] = set()
        self.active_connections[game_session_id].add(websocket)

    def disconnect(self, game_session_id: str, websocket: WebSocket):
        if game_session_id in self.active_connections:
            self.active_connections[game_session_id].discard(websocket)
            if not self.active_connections[game_session_id]:
                del self.active_connections[game_session_id]

    async def broadcast(self, game_session_id: str, message: dict):
        if game_session_id in self.active_connections:
            for connection in list(self.active_connections[game_session_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")
                    self.disconnect(game_session_id, connection)


manager = ConnectionManager()
ws_router = APIRouter()


@ws_router.websocket("/ws/quiz/{pin}")
async def quiz_websocket_endpoint(
    websocket: WebSocket,
    pin: str,
    user_type: str = Query("student"),
    nickname: str = Query(None)
):
    await manager.connect(pin, websocket)
    db = SessionLocal()

    try:
        session = db.query(QuizSession).filter(QuizSession.pin == pin).first()
        if not session:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        player = None
        if user_type == "student" and nickname:
            player = db.query(QuizPlayer).filter(
                QuizPlayer.session_id == session.id,
                QuizPlayer.nickname == nickname
            ).first()

            if not player:
                emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦗", "🕷", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐",
                          "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🕊", "🐇", "🦝", "🦡", "🐁", "🐀", "🐿", "🦔"]
                avatar = random.choice(emojis)
                player = QuizPlayer(session_id=session.id,
                                    nickname=nickname, avatar=avatar)
                db.add(player)
                db.commit()
                db.refresh(player)

            players_list = [{"id": p.id, "nickname": p.nickname,
                             "avatar": p.avatar} for p in session.players]
            await manager.broadcast(pin, {
                "type": "lobby_update",
                "players": players_list
            })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "start_game":
                if user_type == "teacher":
                    session.status = "active"
                    session.current_question_index = 0
                    db.commit()

                    quiz = session.quiz
                    if quiz.questions:
                        question = sorted(
                            quiz.questions, key=lambda x: x.order)[0]
                        await manager.broadcast(pin, {
                            "type": "new_question",
                            "question": {
                                "id": question.id,
                                "text": question.question_text,
                                "type": question.question_type,
                                "time_limit": question.time_limit,
                                "image_url": question.image_url,
                                "options": [{"id": o.id, "text": o.option_text, "color": o.color} for o in question.options]
                            },
                            "index": 0,
                            "total": len(quiz.questions)
                        })

            elif message["type"] == "submit_answer":
                if user_type == "student" and player:
                    question_id = message.get("question_id")
                    option_id = message.get("option_id")
                    response_time = message.get("response_time", 0)

                    option = db.query(QuizOption).filter(
                        QuizOption.id == option_id).first()
                    is_correct = option.is_correct if option else False

                    points = 0
                    if is_correct:
                        question = db.query(QuizQuestion).filter(
                            QuizQuestion.id == question_id).first()
                        time_limit_ms = (question.time_limit *
                                         1000) if question else 20000

                        if response_time <= time_limit_ms:
                            # Kahoot formula: 1000 * (1 - ((response_time / time_limit) / 2))
                            speed_bonus = 1 - \
                                ((response_time / time_limit_ms) / 2)
                            points = int(1000 * speed_bonus)

                        player.score += points
                        player.streak += 1
                    else:
                        player.streak = 0

                    db.add(QuizAnswer(
                        player_id=player.id,
                        question_id=question_id,
                        option_id=option_id,
                        is_correct=is_correct,
                        points_earned=points,
                        response_time_ms=response_time
                    ))
                    db.commit()

                    await websocket.send_json({
                        "type": "answer_submitted",
                        "is_correct": is_correct,  # Will be hidden on client until show_results
                        "points": points
                    })

                    # Notify teacher
                    await manager.broadcast(pin, {
                        "type": "answer_count_update",
                        "count": db.query(QuizAnswer).filter(QuizAnswer.question_id == question_id).count()
                    })

            elif message["type"] == "time_up":
                if user_type == "teacher":
                    question_id = message.get("question_id")
                    # Calculate stats
                    stats = {}
                    answers = db.query(QuizAnswer).filter(
                        QuizAnswer.question_id == question_id).all()
                    for a in answers:
                        stats[a.option_id] = stats.get(a.option_id, 0) + 1

                    question = db.query(QuizQuestion).filter(
                        QuizQuestion.id == question_id).first()
                    correct_option_ids = [
                        o.id for o in question.options if o.is_correct] if question else []

                    await manager.broadcast(pin, {
                        "type": "show_results",
                        "stats": stats,
                        "correct_option_ids": correct_option_ids
                    })

            elif message["type"] == "next_question":
                if user_type == "teacher":
                    session.current_question_index += 1
                    quiz = session.quiz
                    if session.current_question_index < len(quiz.questions):
                        question = sorted(quiz.questions, key=lambda x: x.order)[
                            session.current_question_index]
                        await manager.broadcast(pin, {
                            "type": "new_question",
                            "question": {
                                "id": question.id,
                                "text": question.question_text,
                                "type": question.question_type,
                                "time_limit": question.time_limit,
                                "image_url": question.image_url,
                                "options": [{"id": o.id, "text": o.option_text, "color": o.color} for o in question.options]
                            },
                            "index": session.current_question_index,
                            "total": len(quiz.questions)
                        })
                    else:
                        session.status = "completed"
                        db.commit()
                        leaderboard = sorted(
                            session.players, key=lambda x: x.score, reverse=True)[:5]
                        await manager.broadcast(pin, {
                            "type": "game_over",
                            "leaderboard": [{"nickname": p.nickname, "score": p.score, "avatar": p.avatar} for p in leaderboard]
                        })

    except WebSocketDisconnect:
        manager.disconnect(pin, websocket)
    finally:
        db.close()


@ws_router.websocket("/ws/wordcloud/{pin}")
async def wordcloud_websocket_endpoint(
    websocket: WebSocket,
    pin: str,
    role: str = Query("student"),
    student_name: str = Query(None)
):
    print(f"[WordCloud WS] {role} attempting to connect to pin={pin}")
    await manager.connect(pin, websocket)
    db = SessionLocal()

    try:
        session = db.query(WordCloudSession).filter(
            WordCloudSession.pin == pin).first()
        if not session:
            print(f"[WordCloud WS] Session not found for pin={pin}")
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        print(f"[WordCloud WS] {role} connected to session id={session.id}, pin={pin}")

        if role == "teacher":
            # Send initial word frequencies
            submissions = db.query(WordCloudSubmission).filter(
                WordCloudSubmission.session_id == session.id).all()
            words_dict = {}
            for sub in submissions:
                words_dict[sub.word] = words_dict.get(sub.word, 0) + 1
            words_list = [{"text": k, "value": v}
                          for k, v in words_dict.items()]
            print(f"[WordCloud WS] Sending initial cloud_update to teacher: {len(words_list)} words")
            await websocket.send_json({
                "type": "cloud_update",
                "words": words_list
            })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"[WordCloud WS] Received from {role}: {message}")

            if message["type"] == "submit_word" and role == "student":
                word = message.get("word", "").strip().lower()
                if word:
                    # Save submission
                    submission = WordCloudSubmission(
                        session_id=session.id,
                        word=word,
                        submitted_by=student_name
                    )
                    db.add(submission)
                    db.commit()

                    # Re-calculate frequencies and broadcast
                    db.expire_all()
                    submissions = db.query(WordCloudSubmission).filter(
                        WordCloudSubmission.session_id == session.id).all()
                    words_dict = {}
                    for sub in submissions:
                        words_dict[sub.word] = words_dict.get(sub.word, 0) + 1
                    words_list = [{"text": k, "value": v}
                                  for k, v in words_dict.items()]

                    active = manager.active_connections.get(pin, set())
                    print(f"[WordCloud WS] Broadcasting cloud_update to {len(active)} connections: {words_list}")
                    await manager.broadcast(pin, {
                        "type": "cloud_update",
                        "words": words_list
                    })

                    await websocket.send_json({"type": "word_submitted", "word": word})

            elif message["type"] == "end_session" and role == "teacher":
                session.status = "completed"
                db.commit()
                await manager.broadcast(pin, {
                    "type": "session_ended"
                })

    except WebSocketDisconnect:
        print(f"[WordCloud WS] {role} disconnected from pin={pin}")
        manager.disconnect(pin, websocket)
    except Exception as e:
        print(f"[WordCloud WS] ERROR for {role} on pin={pin}: {type(e).__name__}: {e}")
        manager.disconnect(pin, websocket)
    finally:
        db.close()


# ==================== SLIDO WEBSOCKET ENDPOINT ====================

@ws_router.websocket("/ws/slido/{pin}")
async def slido_websocket_endpoint(
    websocket: WebSocket,
    pin: str,
    user_type: str = Query("student"),  # "teacher" or "student"
    user_id: int = Query(None)
):
    """
    WebSocket endpoint for Slido live sessions.
    
    Events:
    - poll_launched: Teacher launches a new poll
    - poll_vote: Student submits poll response
    - qna_question_asked: Student asks a question
    - qna_upvote: Student upvotes a question
    - qna_answered: Teacher answers a question
    - presentation_state_changed: Teacher changes view (presentation/poll/qna) or slide
    """
    await manager.connect(pin, websocket)
    db = SessionLocal()

    try:
        # Find the session by PIN
        session = db.query(SlidoSession).filter(SlidoSession.pin == pin).first()
        if not session:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        # Send initial session state
        await websocket.send_json({
            "type": "session_state",
            "session_id": session.id,
            "status": session.status,
            "active_view": session.active_view,
            "current_slide": session.current_slide,
            "user_type": user_type
        })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")

            # ==================== TEACHER ACTIONS ====================

            if message_type == "poll_launched" and user_type == "teacher":
                """Teacher launches a new poll"""
                poll_id = message.get("poll_id")
                poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
                
                if poll:
                    poll.is_active = True
                    db.commit()
                    
                    # Broadcast poll to all connected clients
                    await manager.broadcast(pin, {
                        "type": "poll_launched",
                        "poll": {
                            "id": poll.id,
                            "question": poll.question,
                            "poll_type": poll.poll_type,
                            "is_active": True
                        }
                    })
                    
                    # Update view to "poll"
                    session.active_view = "poll"
                    session.updated_at = datetime.utcnow()
                    db.commit()

            elif message_type == "poll_closed" and user_type == "teacher":
                """Teacher closes the poll"""
                poll_id = message.get("poll_id")
                poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
                
                if poll:
                    poll.is_active = False
                    db.commit()
                    
                    # Get aggregated results
                    responses = db.query(PollResponse).filter(PollResponse.poll_id == poll_id).all()
                    results = {}
                    
                    if poll.poll_type == "multiple_choice":
                        for resp in responses:
                            results[resp.option_text] = results.get(resp.option_text, 0) + 1
                    elif poll.poll_type == "rating":
                        rating_counts = {}
                        for resp in responses:
                            rating_counts[resp.response_value] = rating_counts.get(resp.response_value, 0) + 1
                        results = {"ratings": rating_counts}
                    
                    await manager.broadcast(pin, {
                        "type": "poll_results",
                        "poll_id": poll_id,
                        "results": results,
                        "total_responses": poll.total_responses
                    })

            elif message_type == "presentation_state_changed" and user_type == "teacher":
                """Teacher changes the view or slide"""
                active_view = message.get("active_view")  # presentation, poll, qna
                current_slide = message.get("current_slide")
                
                if active_view:
                    session.active_view = active_view
                if current_slide is not None:
                    session.current_slide = current_slide
                
                session.updated_at = datetime.utcnow()
                db.commit()
                
                await manager.broadcast(pin, {
                    "type": "presentation_state_changed",
                    "active_view": session.active_view,
                    "current_slide": session.current_slide
                })

            elif message_type == "qna_answered" and user_type == "teacher":
                """Teacher answers a question"""
                question_id = message.get("question_id")
                answer_text = message.get("answer_text")
                
                question = db.query(SlidoQnA).filter(SlidoQnA.id == question_id).first()
                if question:
                    question.is_answered = True
                    question.teacher_answer = answer_text
                    question.answered_at = datetime.utcnow()
                    question.updated_at = datetime.utcnow()
                    db.commit()
                    
                    await manager.broadcast(pin, {
                        "type": "qna_answered",
                        "question_id": question_id,
                        "answer": answer_text,
                        "answered_at": question.answered_at.isoformat() if question.answered_at else None
                    })

            # ==================== STUDENT ACTIONS ====================

            elif message_type == "poll_vote" and user_type == "student":
                """Student submits poll response"""
                poll_id = message.get("poll_id")
                option_text = message.get("option_text")
                response_text = message.get("response_text")
                response_value = message.get("response_value")
                
                poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
                if poll and poll.is_active:
                    poll_response = PollResponse(
                        poll_id=poll_id,
                        student_id=user_id,
                        option_text=option_text,
                        response_text=response_text,
                        response_value=response_value
                    )
                    db.add(poll_response)
                    poll.total_responses += 1
                    db.commit()
                    
                    await websocket.send_json({
                        "type": "poll_vote_submitted",
                        "poll_id": poll_id,
                        "success": True
                    })
                    
                    # Notify teacher of response count update
                    await manager.broadcast(pin, {
                        "type": "poll_response_count_update",
                        "poll_id": poll_id,
                        "total_responses": poll.total_responses
                    })

            elif message_type == "qna_question_asked" and user_type == "student":
                """Student asks a question"""
                question_text = message.get("question_text")
                is_anonymous = message.get("is_anonymous", False)
                
                question = SlidoQnA(
                    session_id=session.id,
                    student_id=user_id,
                    question_text=question_text,
                    is_anonymous=is_anonymous
                )
                db.add(question)
                db.commit()
                db.refresh(question)
                
                # Broadcast new question to all
                await manager.broadcast(pin, {
                    "type": "qna_question_asked",
                    "question": {
                        "id": question.id,
                        "question_text": question.question_text,
                        "is_anonymous": question.is_anonymous,
                        "upvotes": question.upvotes,
                        "is_answered": question.is_answered,
                        "created_at": question.created_at.isoformat() if question.created_at else None
                    }
                })

            elif message_type == "qna_upvote" and user_type == "student":
                """Student upvotes a question"""
                question_id = message.get("question_id")
                
                question = db.query(SlidoQnA).filter(SlidoQnA.id == question_id).first()
                if question:
                    # Check if already upvoted
                    existing = db.query(QnAUpvote).filter(
                        QnAUpvote.question_id == question_id,
                        QnAUpvote.student_id == user_id
                    ).first()
                    
                    if not existing:
                        upvote = QnAUpvote(question_id=question_id, student_id=user_id)
                        db.add(upvote)
                        question.upvotes += 1
                        question.updated_at = datetime.utcnow()
                        db.commit()
                        
                        # Broadcast updated upvote count
                        await manager.broadcast(pin, {
                            "type": "qna_upvote_updated",
                            "question_id": question_id,
                            "upvotes": question.upvotes
                        })

            elif message_type == "end_session" and user_type == "teacher":
                """Teacher ends the session"""
                session.status = "ended"
                session.ended_at = datetime.utcnow()
                db.commit()
                
                await manager.broadcast(pin, {
                    "type": "session_ended",
                    "session_id": session.id,
                    "ended_at": session.ended_at.isoformat() if session.ended_at else None
                })

    except WebSocketDisconnect:
        manager.disconnect(pin, websocket)
    finally:
        db.close()
