import os
from typing import List

from app.domain.comment import Comment, CommentRepository
from pymongo import DESCENDING, MongoClient


class CommentMongoRepository(CommentRepository):
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["comments"]
        self.collection = self.db["comments"]
        self.collection.create_index("is_public")
        self.collection.create_index("created_at")

    def insert(self, comment: Comment) -> str:
        result = self.collection.insert_one(comment.dict())
        return str(result.inserted_id)

    def list_public(self, limit: int = 1000, offset: int = 0) -> List[Comment]:
        cursor = self.collection.find({"is_public": True}).sort("created_at", DESCENDING).limit(limit).skip(offset)

        results = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            results.append(Comment(**doc))
        return results
