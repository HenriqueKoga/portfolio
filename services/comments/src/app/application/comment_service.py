from datetime import datetime, timezone
from typing import List

from app.domain.comment import Comment, CommentCreate, CommentRepository
from app.infrastructure.publisher import Publisher


class CommentService:
    def __init__(self, repository: CommentRepository, publisher: Publisher):
        self.repository = repository
        self.publisher = publisher

    def create_comment(self, data: CommentCreate, user_id: str, user_name: str) -> Comment:
        comment = Comment(
            user_id=user_id,
            user_name=user_name,
            message=data.message,
            is_public=data.is_public,
            created_at=datetime.now(timezone.utc),
        )
        inserted_comment = self.repository.insert(comment)

        self.publisher.publish_comment({
            "user_name": user_name,
            "message": data.message,
            "is_public": data.is_public
        })

        return inserted_comment

    def get_all_public_comments(self) -> List[Comment]:
        return self.repository.list_public()

    def get_comments_by_user(self, user_id: str) -> List[Comment]:
        return self.repository.list_by_user(user_id)

    def get_comment_by_id(self, comment_id: str) -> Comment:
        return self.repository.get_by_id(comment_id)

    def delete_comment(self, comment_id: str) -> bool:
        return self.repository.delete(comment_id)
