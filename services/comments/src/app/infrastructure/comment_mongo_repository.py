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

    def insert(self, comment: Comment) -> Comment:
        comment_dict = comment.model_dump(by_alias=True)
        result = self.collection.insert_one(comment_dict)
        comment.id = str(result.inserted_id)
        return comment

    def list_public(self, limit: int = 1000, offset: int = 0) -> List[Comment]:
        cursor = self.collection.find({"is_public": True}).sort("created_at", DESCENDING).limit(limit).skip(offset)

        results = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            results.append(Comment(**doc))
        return results

    def list_by_user(self, user_id: str, limit: int = 1000, offset: int = 0) -> List[Comment]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", DESCENDING).limit(limit).skip(offset)

        results = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            results.append(Comment(**doc))
        return results
