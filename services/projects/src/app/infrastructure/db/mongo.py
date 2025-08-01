import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

# Inicializa o cliente do Mongo uma única vez
_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://mongo:27017")
        _mongo_client = AsyncIOMotorClient(mongo_uri)
    return _mongo_client

def reset_client():
    global _mongo_client
    _mongo_client = None


def get_mongo_collection(collection_name: str) -> AsyncIOMotorCollection:
    db_name = os.getenv("MONGO_DB_NAME", "projects")
    client = get_mongo_client()
    return client[db_name][collection_name]
