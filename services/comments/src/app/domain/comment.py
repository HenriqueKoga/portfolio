from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    message: str
    is_public: bool = True


class Comment(CommentCreate):
    id: Optional[str] = Field(default=None)
    author_id: str
    author_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CommentRepository(ABC):

    @abstractmethod
    def insert(self, comment: Comment) -> Comment: ...

    @abstractmethod
    def list_public(self, limit: int = 100, offset: int = 0) -> list[Comment]: ...
