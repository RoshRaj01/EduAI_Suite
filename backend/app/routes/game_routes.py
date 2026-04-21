from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.models.student import Student
from app.schemas.game import (
    ChainAnswerGameCreate,
    ChainAnswerGameResponse,
    ChainAnswerGameListResponse,
    ChainAnswerGameUpdate,
    GameWordCreate,
    GameWordResponse,
)
from app.services.ollama_service import OllamaService, OLLAMA_BASE_URL, DEFAULT_MODEL
from datetime import datetime
import uuid
import json

router = APIRouter(prefix="/games", tags=["Games"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a new game


@router.post("/chain-answer", response_model=ChainAnswerGameResponse, status_code=status.HTTP_201_CREATED)
def create_chain_answer_game(
    game_data: ChainAnswerGameCreate,
    db: Session = Depends(get_db)
):
    """Create a new Chain Answer game session"""

    # Generate unique session ID
    session_id = f"game_{uuid.uuid4().hex[:8]}"

    # Generate word suggestions from Ollama if subject is provided
    ollama_suggestions = None
    if game_data.subject:
        suggestions = OllamaService.generate_word_suggestions(
            subject=game_data.subject,
            difficulty=game_data.difficulty_level,
            count=5,
            chain_variation=game_data.chain_variation,
            starting_word=game_data.starting_word
        )
        if suggestions:
            ollama_suggestions = json.dumps(suggestions)

    # Create the game
    new_game = ChainAnswerGame(
        session_id=session_id,
        name=game_data.name,
        chain_variation=game_data.chain_variation,
        category=game_data.category,
        difficulty_level=game_data.difficulty_level,
        language=game_data.language,
        subject=game_data.subject,
        starting_word=game_data.starting_word,
        time_per_turn=game_data.time_per_turn,
        max_words=game_data.max_words,
        penalty_on_invalid=game_data.penalty_on_invalid,
        penalty_type=game_data.penalty_type,
        ollama_suggestions=ollama_suggestions,
        status="setup"
    )

    db.add(new_game)
    db.flush()  # Flush to get the game ID

    # Add players - fetch real student data from database
    for idx, player_data in enumerate(game_data.players, start=1):
        student = db.query(Student).filter(
            Student.id == player_data.student_id
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student with ID {player_data.student_id} not found"
            )
        
        new_player = ChainAnswerGamePlayer(
            game_id=new_game.id,
            student_id=str(student.id),
            name=student.name,
            join_order=idx
        )
        db.add(new_player)

    # Add starting word
    starting_word_entry = ChainAnswerGameWord(
        game_id=new_game.id,
        word=game_data.starting_word,
        submitted_by="system",
        is_valid=True,
        position=0
    )
    db.add(starting_word_entry)

    db.commit()
    db.refresh(new_game)

    return new_game


# Get all games
@router.get("/chain-answer", response_model=list[ChainAnswerGameListResponse])
def get_all_chain_answer_games(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """Get all Chain Answer games"""
    query = db.query(ChainAnswerGame)

    if status_filter:
        query = query.filter(ChainAnswerGame.status == status_filter)

    return query.offset(skip).limit(limit).all()


# Get game by ID
@router.get("/chain-answer/{game_id}", response_model=ChainAnswerGameResponse)
def get_chain_answer_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific Chain Answer game by ID"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    return game


# Get game by session ID
@router.get("/chain-answer/session/{session_id}", response_model=ChainAnswerGameResponse)
def get_chain_answer_game_by_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific Chain Answer game by session ID"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.session_id == session_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game session not found"
        )

    return game


# Start a game
@router.post("/chain-answer/{game_id}/start", response_model=ChainAnswerGameResponse)
def start_chain_answer_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Start a Chain Answer game"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    if game.status != "setup":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start game in {game.status} status"
        )

    # Check minimum players
    if len(game.players) < 2:
        raise HTTPException(
            status_code=400,
            detail="Minimum 2 players required to start the game"
        )

    game.status = "active"
    game.started_at = datetime.utcnow()

    db.commit()
    db.refresh(game)

    return game


# Submit a word
@router.post("/chain-answer/{game_id}/word", response_model=GameWordResponse, status_code=status.HTTP_201_CREATED)
def submit_word(
    game_id: int,
    word_data: GameWordCreate,
    db: Session = Depends(get_db)
):
    """Submit a word to the game"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    if game.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Game is not active"
        )

    # Get the next position
    max_position = db.query(ChainAnswerGameWord).filter(
        ChainAnswerGameWord.game_id == game_id
    ).order_by(ChainAnswerGameWord.position.desc()).first()

    next_position = (max_position.position + 1) if max_position else 1

    # Create word entry
    new_word = ChainAnswerGameWord(
        game_id=game_id,
        word=word_data.word,
        submitted_by=word_data.submitted_by,
        is_valid=word_data.is_valid,
        position=next_position,
        validation_reason=word_data.validation_reason
    )

    db.add(new_word)

    # Update player stats
    player = db.query(ChainAnswerGamePlayer).filter(
        ChainAnswerGamePlayer.game_id == game_id,
        ChainAnswerGamePlayer.student_id == word_data.submitted_by
    ).first()

    if player:
        player.words_submitted += 1
        if word_data.is_valid:
            player.words_valid += 1
            player.score += 10  # Base points

    db.commit()
    db.refresh(new_word)

    return new_word


# End a game
@router.post("/chain-answer/{game_id}/end", response_model=ChainAnswerGameResponse)
def end_chain_answer_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """End a Chain Answer game"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    if game.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Game is already completed"
        )

    game.status = "completed"
    game.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(game)

    return game


# Pause a game
@router.post("/chain-answer/{game_id}/pause", response_model=ChainAnswerGameResponse)
def pause_chain_answer_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Pause a Chain Answer game"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    if game.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Only active games can be paused"
        )

    game.status = "paused"

    db.commit()
    db.refresh(game)

    return game


# Resume a game
@router.post("/chain-answer/{game_id}/resume", response_model=ChainAnswerGameResponse)
def resume_chain_answer_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Resume a paused Chain Answer game"""
    game = db.query(ChainAnswerGame).filter(
        ChainAnswerGame.id == game_id).first()

    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    if game.status != "paused":
        raise HTTPException(
            status_code=400,
            detail="Only paused games can be resumed"
        )

    game.status = "active"

    db.commit()
    db.refresh(game)

    return game


# Ollama status check
@router.get("/chain-answer/status/ollama")
def get_ollama_status():
    """Check Ollama service availability"""
    is_available = OllamaService.is_ollama_available()
    models = OllamaService.get_available_models() if is_available else []

    return {
        "ollama_available": is_available,
        "endpoint": OLLAMA_BASE_URL,
        "available_models": models,
        "default_model": DEFAULT_MODEL,
        "message": "Ollama service is running" if is_available else "Ollama service is not available"
    }


# Ollama debug endpoint - test connectivity
@router.get("/chain-answer/debug/ollama")
def debug_ollama():
    """Debug Ollama connectivity - detailed diagnostics"""
    import httpx

    debug_info = {
        "endpoint": OLLAMA_BASE_URL,
        "endpoints_to_try": [
            "http://localhost:11434",
            "http://127.0.0.1:11434",
            "http://host.docker.internal:11434",  # For Docker on Windows
        ],
        "tests": {}
    }

    for endpoint in debug_info["endpoints_to_try"]:
        try:
            response = httpx.get(f"{endpoint}/api/tags", timeout=10.0)
            debug_info["tests"][endpoint] = {
                "reachable": True,
                "status_code": response.status_code,
                "models": response.json().get("models", []) if response.status_code == 200 else []
            }
        except Exception as e:
            debug_info["tests"][endpoint] = {
                "reachable": False,
                "error": str(e)
            }

    # Primary endpoint test
    debug_info["primary_endpoint_available"] = OllamaService.is_ollama_available()
    debug_info["available_models"] = OllamaService.get_available_models()

    return debug_info
