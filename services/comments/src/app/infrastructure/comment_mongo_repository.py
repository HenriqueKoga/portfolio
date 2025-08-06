import os
from typing import List

from app.domain.comment import Comment, CommentRepository
from bson import ObjectId
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

    def get_by_id(self, comment_id: str) -> Comment:
        try:
            doc = self.collection.find_one({"_id": ObjectId(comment_id)})
            if doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                return Comment(**doc)
            return None
        except Exception as e:
            print(f"Error getting comment {comment_id}: {e}")
            return None

    def delete(self, comment_id: str) -> bool:
        try:
            result = self.collection.delete_one({"_id": ObjectId(comment_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting comment {comment_id}: {e}")
            return False
