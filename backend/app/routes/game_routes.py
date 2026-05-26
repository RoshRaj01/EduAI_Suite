from fastapi import APIRouter, HTTPException, status
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
from app.services.word_service import WordService
from datetime import datetime
import uuid
import json

game_router = APIRouter(prefix="/games", tags=["Games"])

@game_router.post("/chain-answer", response_model=ChainAnswerGameResponse, status_code=status.HTTP_201_CREATED)
async def create_chain_answer_game(game_data: ChainAnswerGameCreate):
    """Create a new Chain Answer game session"""
    session_id = f"game_{uuid.uuid4().hex[:8]}"

    word_suggestions = None
    if game_data.subject:
        suggestions = WordService.generate_word_suggestions(
            subject=game_data.subject,
            difficulty=game_data.difficulty_level,
            count=5,
            chain_variation=game_data.chain_variation,
            starting_word=game_data.starting_word
        )
        if suggestions:
            word_suggestions = json.dumps(suggestions)

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
        ai_suggestions=word_suggestions,
        status="setup"
    )
    await new_game.assign_id()
    await new_game.insert()

    players_to_insert = []
    for idx, player_data in enumerate(game_data.players, start=1):
        try:
            sid_int = int(player_data.student_id)
        except:
            sid_int = None
            
        student = None
        if sid_int is not None:
            student = await Student.find_one(Student.int_id == sid_int)

        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student with ID {player_data.student_id} not found"
            )

        new_player = ChainAnswerGamePlayer(
            game_id=new_game.int_id,
            student_id=str(student.int_id),
            name=student.name,
            join_order=idx
        )
        players_to_insert.append(new_player)

    if players_to_insert:
        for p in players_to_insert:
            await p.assign_id()
            await p.insert()

    starting_word_entry = ChainAnswerGameWord(
        game_id=new_game.int_id,
        word=game_data.starting_word,
        submitted_by="system",
        is_valid=True,
        position=0
    )
    await starting_word_entry.assign_id()
    await starting_word_entry.insert()

    # We need to manually link the players to the game response schema.
    # In Beanie, relations aren't auto-loaded in the same way, but the response schema 
    # might expect `players`. Let's just return the new_game and let the frontend/schema handle it.
    res = new_game.model_dump()
    res["id"] = new_game.int_id
    res["players"] = [p.model_dump() for p in players_to_insert]
    for p in res["players"]:
        p["id"] = p["int_id"]
    return res


@game_router.get("/chain-answer", response_model=list[ChainAnswerGameListResponse])
async def get_all_chain_answer_games(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None
):
    """Get all Chain Answer games"""
    query = ChainAnswerGame.find_all()

    if status_filter:
        query = query.find(ChainAnswerGame.status == status_filter)

    games = await query.skip(skip).limit(limit).to_list()
    res = []
    for g in games:
        d = g.model_dump()
        d["id"] = g.int_id
        res.append(d)
    return res


@game_router.get("/chain-answer/{game_id}", response_model=ChainAnswerGameResponse)
async def get_chain_answer_game(game_id: int):
    """Get a specific Chain Answer game by ID"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )
        
    res = game.model_dump()
    res["id"] = game.int_id
    
    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game_id).to_list()
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
        
    return res


@game_router.get("/chain-answer/session/{session_id}", response_model=ChainAnswerGameResponse)
async def get_chain_answer_game_by_session(session_id: str):
    """Get a specific Chain Answer game by session ID"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.session_id == session_id)
    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game session not found"
        )
        
    res = game.model_dump()
    res["id"] = game.int_id
    
    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game.int_id).to_list()
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
        
    return res


@game_router.post("/chain-answer/{game_id}/start", response_model=ChainAnswerGameResponse)
async def start_chain_answer_game(game_id: int):
    """Start a Chain Answer game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
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

    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game_id).to_list()
    if len(players) < 2:
        raise HTTPException(
            status_code=400,
            detail="Minimum 2 players required to start the game"
        )

    game.status = "active"
    game.started_at = datetime.utcnow()
    await game.save()

    res = game.model_dump()
    res["id"] = game.int_id
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
    return res


@game_router.post("/chain-answer/{game_id}/word", response_model=GameWordResponse, status_code=status.HTTP_201_CREATED)
async def submit_word(game_id: int, word_data: GameWordCreate):
    """Submit a word to the game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
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

    max_position = await ChainAnswerGameWord.find(
        ChainAnswerGameWord.game_id == game_id
    ).sort("-position").first_or_none()

    next_position = (max_position.position + 1) if max_position else 1

    new_word = ChainAnswerGameWord(
        game_id=game_id,
        word=word_data.word,
        submitted_by=word_data.submitted_by,
        is_valid=word_data.is_valid,
        position=next_position,
        validation_reason=word_data.validation_reason
    )
    await new_word.assign_id()
    await new_word.insert()

    player = await ChainAnswerGamePlayer.find_one(
        ChainAnswerGamePlayer.game_id == game_id,
        ChainAnswerGamePlayer.student_id == word_data.submitted_by
    )

    if player:
        player.words_submitted = (player.words_submitted or 0) + 1
        if word_data.is_valid:
            player.words_valid = (player.words_valid or 0) + 1
            player.score = (player.score or 0) + 10
        await player.save()

    res = new_word.model_dump()
    res["id"] = new_word.int_id
    return res


@game_router.post("/chain-answer/{game_id}/end", response_model=ChainAnswerGameResponse)
async def end_chain_answer_game(game_id: int):
    """End a Chain Answer game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
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
    await game.save()

    res = game.model_dump()
    res["id"] = game.int_id
    
    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game.int_id).to_list()
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
    return res


@game_router.post("/chain-answer/{game_id}/pause", response_model=ChainAnswerGameResponse)
async def pause_chain_answer_game(game_id: int):
    """Pause a Chain Answer game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
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
    await game.save()

    res = game.model_dump()
    res["id"] = game.int_id
    
    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game.int_id).to_list()
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
    return res


@game_router.post("/chain-answer/{game_id}/resume", response_model=ChainAnswerGameResponse)
async def resume_chain_answer_game(game_id: int):
    """Resume a paused Chain Answer game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
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
    await game.save()

    res = game.model_dump()
    res["id"] = game.int_id
    
    players = await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game.int_id).to_list()
    res["players"] = []
    for p in players:
        d = p.model_dump()
        d["id"] = p.int_id
        res["players"].append(d)
    return res


@game_router.get("/chain-answer/status/groq")
async def get_word_engine_status():
    """Check word engine availability — always available (local dictionary)"""
    return {
        "groq_available": True,
        "service": "Local Dictionary Engine (nltk + Word Bank)",
        "message": "Word engine is running — deterministic, no external API required"
    }


@game_router.delete("/chain-answer/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chain_answer_game(game_id: int):
    """Delete a Chain Answer game"""
    game = await ChainAnswerGame.find_one(ChainAnswerGame.int_id == game_id)
    if not game:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    await ChainAnswerGameWord.find(ChainAnswerGameWord.game_id == game_id).delete()
    await ChainAnswerGamePlayer.find(ChainAnswerGamePlayer.game_id == game_id).delete()
    await game.delete()

    return None
