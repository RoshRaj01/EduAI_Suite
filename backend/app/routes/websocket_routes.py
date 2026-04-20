from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
import json
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
            for connection in self.active_connections[game_session_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")


manager = ConnectionManager()

# WebSocket router
ws_router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@ws_router.websocket("/ws/games/chain-answer/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    user_type: str = Query("student")  # 'teacher' or 'student'
):
    """
    WebSocket endpoint for real-time game synchronization

    Messages sent from clients:
    - {"type": "join", "player_id": "player_1"}
    - {"type": "submit_word", "word": "apple", "player_id": "player_1"}
    - {"type": "ping"}

    Messages sent to clients:
    - {"type": "player_joined", "player": {...}}
    - {"type": "game_started", "game": {...}}
    - {"type": "word_submitted", "word": {...}, "chain": [...]}
    - {"type": "game_ended", "results": {...}}
    - {"type": "pong"}
    """

    await manager.connect(session_id, websocket)
    db = SessionLocal()

    try:
        # Send initial game state
        game = db.query(ChainAnswerGame).filter(
            ChainAnswerGame.session_id == session_id
        ).first()

        if not game:
            await websocket.send_json({
                "type": "error",
                "message": "Game session not found"
            })
            await websocket.close(code=1008)
            return

        # Send current game state
        chain = [
            {
                "id": w.id,
                "word": w.word,
                "submitted_by": w.submitted_by,
                "submitted_at": w.submitted_at.isoformat(),
                "is_valid": w.is_valid,
                "position": w.position
            }
            for w in game.words
        ]

        players = [
            {
                "id": p.id,
                "name": p.name,
                "score": p.score,
                "words_submitted": p.words_submitted,
                "words_valid": p.words_valid,
                "status": p.status
            }
            for p in game.players
        ]

        await websocket.send_json({
            "type": "initial_state",
            "game": {
                "id": game.id,
                "session_id": game.session_id,
                "name": game.name,
                "status": game.status,
                "chain_variation": game.chain_variation,
                "difficulty_level": game.difficulty_level,
                "starting_word": game.starting_word,
                "created_at": game.created_at.isoformat(),
                "started_at": game.started_at.isoformat() if game.started_at else None,
            },
            "players": players,
            "chain": chain,
            "user_type": user_type
        })

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if message["type"] == "join":
                # Broadcast player joined
                await manager.broadcast(session_id, {
                    "type": "player_joined",
                    "player_id": message.get("player_id"),
                    "timestamp": datetime.utcnow().isoformat()
                })

            elif message["type"] == "submit_word":
                word = message.get("word", "").strip()
                player_id = message.get("player_id")

                if not word:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Word cannot be empty"
                    })
                    continue

                # Create word entry in database
                try:
                    max_position = db.query(ChainAnswerGameWord).filter(
                        ChainAnswerGameWord.game_id == game.id
                    ).order_by(ChainAnswerGameWord.position.desc()).first()

                    next_position = (max_position.position +
                                     1) if max_position else 1

                    new_word = ChainAnswerGameWord(
                        game_id=game.id,
                        word=word,
                        submitted_by=player_id,
                        is_valid=True,
                        position=next_position
                    )

                    db.add(new_word)
                    db.commit()
                    db.refresh(new_word)

                    # Update player stats
                    player = db.query(ChainAnswerGamePlayer).filter(
                        ChainAnswerGamePlayer.game_id == game.id,
                        ChainAnswerGamePlayer.student_id == player_id
                    ).first()

                    if player:
                        player.words_submitted += 1
                        player.words_valid += 1
                        player.score += 10
                        db.commit()

                    # Broadcast word submitted to all players
                    await manager.broadcast(session_id, {
                        "type": "word_submitted",
                        "word": {
                            "id": new_word.id,
                            "word": new_word.word,
                            "submitted_by": new_word.submitted_by,
                            "submitted_at": new_word.submitted_at.isoformat(),
                            "position": new_word.position
                        },
                        "player_stats": {
                            "words_submitted": player.words_submitted,
                            "words_valid": player.words_valid,
                            "score": player.score
                        } if player else {}
                    })

                except Exception as e:
                    print(f"Error submitting word: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to submit word"
                    })

            elif message["type"] == "game_started":
                game.status = "active"
                game.started_at = datetime.utcnow()
                db.commit()

                await manager.broadcast(session_id, {
                    "type": "game_started",
                    "started_at": game.started_at.isoformat()
                })

            elif message["type"] == "game_ended":
                game.status = "completed"
                game.ended_at = datetime.utcnow()
                db.commit()

                # Get final scores
                final_players = [
                    {
                        "id": p.id,
                        "name": p.name,
                        "score": p.score,
                        "words_submitted": p.words_submitted,
                        "words_valid": p.words_valid
                    }
                    for p in game.players
                ]

                await manager.broadcast(session_id, {
                    "type": "game_ended",
                    "ended_at": game.ended_at.isoformat(),
                    "final_scores": final_players
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        # Notify others that player disconnected
        await manager.broadcast(session_id, {
            "type": "player_disconnected",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(session_id, websocket)

    finally:
        db.close()
