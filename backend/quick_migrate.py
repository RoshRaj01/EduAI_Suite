#!/usr/bin/env python3
"""Quick schema fix - creates tables if missing and adds columns"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine
from app.models.user import User
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from sqlalchemy import inspect, text

print("Creating tables from models...")
Base.metadata.create_all(bind=engine)
print("[OK] All tables created/verified")

# Check if columns exist and add if missing
with engine.begin() as connection:
    inspector = inspect(connection)
    
    try:
        columns = {col['name'] for col in inspector.get_columns('chain_answer_games')}
        print("\nCurrent columns in chain_answer_games: {}".format(columns))
        
        # Add missing columns (shouldn't be needed if create_all works, but just in case)
        if "subject" not in columns:
            print("Adding subject column...")
            connection.execute(text("ALTER TABLE chain_answer_games ADD COLUMN subject VARCHAR"))
            print("[OK] Added subject")

        if "ollama_suggestions" not in columns:
            print("Adding ollama_suggestions column...")
            connection.execute(text("ALTER TABLE chain_answer_games ADD COLUMN ollama_suggestions VARCHAR"))
            print("[OK] Added ollama_suggestions")

        if "time_per_turn" not in columns:
            print("Adding time_per_turn column...")
            connection.execute(text("ALTER TABLE chain_answer_games ADD COLUMN time_per_turn INTEGER DEFAULT 30"))
            print("[OK] Added time_per_turn")

    except Exception as e:
        print("Error: {}".format(e))
        exit(1)

print("\n[SUCCESS] Schema migration complete!")
print("Backend is ready to start.")
