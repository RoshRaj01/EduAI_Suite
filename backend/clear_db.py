import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("MONGODB_DB", "eduai_suite")

async def clear_database():
    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    client = AsyncIOMotorClient(MONGODB_URL)
    
    print(f"Dropping database '{DB_NAME}'...")
    await client.drop_database(DB_NAME)
    
    print("Database cleared successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_database())
