from datetime import datetime, timezone
from typing import List

from app.domain.comment import Comment, CommentCreate, CommentRepository
from app.infrastructure.publisher import Publisher


class CommentService:
    def __init__(self, repository: CommentRepository, publisher: Publisher):
        self.repository = repository
        self.publisher = publisher

    def create_comment(self, data: CommentCreate, author_id: str, author_name: str) -> str:
        comment = Comment(
            author_id=author_id,
            author_name=author_name,
            message=data.message,
            is_public=data.is_public,
            created_at=datetime.now(timezone.utc),
        )
        inserted_id = self.repository.insert(comment)

        self.publisher.publish_comment({
            "author_name": author_name,
            "message": data.message,
            "is_public": data.is_public
        })

        return inserted_id

    def get_public_comments(self) -> List[Comment]:
        return self.repository.list_public()
