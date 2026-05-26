import sqlite3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "eduai_suite")

def row_to_dict(row):
    d = dict(row)
    if 'id' in d:
        d['int_id'] = d.pop('id')
        
    # Attempt to parse json strings
    for k, v in d.items():
        if isinstance(v, str) and (v.startswith('{') or v.startswith('[')):
            try:
                d[k] = json.loads(v)
            except:
                pass
    return d

async def reset_counter(db, collection_name, max_id):
    await db.counters.update_one(
        {"_id": collection_name},
        {"$set": {"seq": max_id}},
        upsert=True
    )

async def migrate():
    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    print("Connecting to SQLite database eduV2.db...")
    if not os.path.exists("eduV2.db"):
        print("eduV2.db not found!")
        return
        
    sqlite_conn = sqlite3.connect("eduV2.db")
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    # simple tables map directly to collections
    simple_tables = {
        "users": "users",
        "courses": "courses",
        "students": "students",
        "announcements": "announcements",
        "assignments": "assignments",
        "submissions": "submissions",
        "appointments": "appointments",
        "lessons": "lessons",
        "mail_drafts": "mail_drafts",
        "mail_history": "mail_history",
        "action_history": "action_history",
        "reports": "reports",
        "omr_jobs": "omr_jobs",
        "omr_submissions": "omr_submissions",
        "presentation_assignments": "presentation_assignments",
        "presentation_submissions": "presentation_submissions",
        "slido_sessions": "slido_sessions",
        "slido_polls": "slido_polls",
        "poll_responses": "poll_responses",
        "slido_qna": "slido_qna",
        "qna_upvotes": "qna_upvotes",
        "submission_interactions": "submission_interactions",
        "trello_boards": "trello_boards",
        "trello_columns": "trello_columns",
        "trello_cards": "trello_cards",
        "quiz_sessions": "quiz_sessions",
        "quiz_players": "quiz_players",
        "quiz_answers": "quiz_answers",
    }
    
    for sqlite_table, mongo_collection in simple_tables.items():
        print(f"Migrating {sqlite_table} -> {mongo_collection}...")
        try:
            cursor.execute(f"SELECT * FROM {sqlite_table}")
            rows = cursor.fetchall()
            if not rows:
                print(f"  Empty table {sqlite_table}, skipping.")
                continue
            
            docs = [row_to_dict(row) for row in rows]
            
            # Insert to Mongo
            await db[mongo_collection].delete_many({})
            if docs:
                await db[mongo_collection].insert_many(docs)
                max_id = max((d.get('int_id', 0) for d in docs), default=0)
                await reset_counter(db, mongo_collection, max_id)
            print(f"  [OK] Migrated {len(docs)} documents.")
        except Exception as e:
            print(f"  [ERROR] Failed to migrate {sqlite_table}: {e}")

    # Complex migrations
    
    # 1. Quizzes (embedded questions & options)
    print("Migrating quizzes (complex)...")
    try:
        cursor.execute("SELECT * FROM quizzes")
        quizzes = cursor.fetchall()
        quiz_docs = []
        for q in quizzes:
            q_dict = row_to_dict(q)
            q_id = q_dict['int_id']
            
            cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = ?", (q_id,))
            questions = cursor.fetchall()
            q_dict['questions'] = []
            
            for qq in questions:
                qq_dict = row_to_dict(qq)
                qq_id = qq_dict['int_id']
                
                cursor.execute("SELECT * FROM quiz_options WHERE question_id = ?", (qq_id,))
                options = cursor.fetchall()
                qq_dict['options'] = [row_to_dict(o) for o in options]
                
                q_dict['questions'].append(qq_dict)
                
            quiz_docs.append(q_dict)
            
        await db['quizzes'].delete_many({})
        if quiz_docs:
            await db['quizzes'].insert_many(quiz_docs)
            max_id = max((d.get('int_id', 0) for d in quiz_docs), default=0)
            await reset_counter(db, 'quizzes', max_id)
        print(f"  [OK] Migrated {len(quiz_docs)} quizzes with questions and options.")
    except Exception as e:
        print(f"  [ERROR] Failed to migrate quizzes: {e}")

    # 2. Exams (embedded questions & choices)
    print("Migrating exams (complex)...")
    try:
        cursor.execute("SELECT * FROM exams")
        exams = cursor.fetchall()
        exam_docs = []
        for e in exams:
            e_dict = row_to_dict(e)
            e_id = e_dict['int_id']
            
            cursor.execute("SELECT * FROM exam_questions WHERE exam_id = ?", (e_id,))
            questions = cursor.fetchall()
            e_dict['questions'] = []
            
            for eq in questions:
                eq_dict = row_to_dict(eq)
                eq_id = eq_dict['int_id']
                
                cursor.execute("SELECT * FROM exam_choices WHERE question_id = ?", (eq_id,))
                choices = cursor.fetchall()
                eq_dict['choices'] = [row_to_dict(c) for c in choices]
                
                e_dict['questions'].append(eq_dict)
                
            exam_docs.append(e_dict)
            
        await db['exams'].delete_many({})
        if exam_docs:
            await db['exams'].insert_many(exam_docs)
            max_id = max((d.get('int_id', 0) for d in exam_docs), default=0)
            await reset_counter(db, 'exams', max_id)
        print(f"  [OK] Migrated {len(exam_docs)} exams with questions and choices.")
    except Exception as e:
        print(f"  [ERROR] Failed to migrate exams: {e}")

    # 3. Chain Answer Games (embedded players & words)
    print("Migrating chain_answer_games (complex)...")
    try:
        cursor.execute("SELECT * FROM chain_answer_games")
        games = cursor.fetchall()
        game_docs = []
        for g in games:
            g_dict = row_to_dict(g)
            g_id = g_dict['int_id']
            
            cursor.execute("SELECT * FROM chain_answer_game_players WHERE game_id = ?", (g_id,))
            players = cursor.fetchall()
            g_dict['players'] = [row_to_dict(p) for p in players]
            
            cursor.execute("SELECT * FROM chain_answer_game_words WHERE game_id = ?", (g_id,))
            words = cursor.fetchall()
            g_dict['words'] = [row_to_dict(w) for w in words]
            
            game_docs.append(g_dict)
            
        await db['chain_answer_games'].delete_many({})
        if game_docs:
            await db['chain_answer_games'].insert_many(game_docs)
            max_id = max((d.get('int_id', 0) for d in game_docs), default=0)
            await reset_counter(db, 'chain_answer_games', max_id)
        print(f"  [OK] Migrated {len(game_docs)} games with players and words.")
    except Exception as e:
        print(f"  [ERROR] Failed to migrate games: {e}")

    print("\n[SUCCESS] Migration to MongoDB complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
