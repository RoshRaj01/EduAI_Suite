from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession, QuizPlayer, QuizAnswer
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
                emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦗", "🕷", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🕊", "🐇", "🦝", "🦡", "🐁", "🐀", "🐿", "🦔"]
                avatar = random.choice(emojis)
                player = QuizPlayer(session_id=session.id, nickname=nickname, avatar=avatar)
                db.add(player)
                db.commit()
                db.refresh(player)

            players_list = [{"id": p.id, "nickname": p.nickname, "avatar": p.avatar} for p in session.players]
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
                        question = sorted(quiz.questions, key=lambda x: x.order)[0]
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

                    option = db.query(QuizOption).filter(QuizOption.id == option_id).first()
                    is_correct = option.is_correct if option else False
                    
                    points = 0
                    if is_correct:
                        question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
                        time_limit_ms = (question.time_limit * 1000) if question else 20000
                        
                        if response_time <= time_limit_ms:
                            # Kahoot formula: 1000 * (1 - ((response_time / time_limit) / 2))
                            speed_bonus = 1 - ((response_time / time_limit_ms) / 2)
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
                        "is_correct": is_correct, # Will be hidden on client until show_results
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
                    answers = db.query(QuizAnswer).filter(QuizAnswer.question_id == question_id).all()
                    for a in answers:
                        stats[a.option_id] = stats.get(a.option_id, 0) + 1
                    
                    question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
                    correct_option_ids = [o.id for o in question.options if o.is_correct] if question else []
                    
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
                        question = sorted(quiz.questions, key=lambda x: x.order)[session.current_question_index]
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
                        leaderboard = sorted(session.players, key=lambda x: x.score, reverse=True)[:5]
                        await manager.broadcast(pin, {
                            "type": "game_over",
                            "leaderboard": [{"nickname": p.nickname, "score": p.score, "avatar": p.avatar} for p in leaderboard]
                        })

    except WebSocketDisconnect:
        manager.disconnect(pin, websocket)
    finally:
        db.close()
