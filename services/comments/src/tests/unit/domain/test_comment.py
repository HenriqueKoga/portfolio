import pytest
from datetime import datetime, timezone
from app.domain.comment import CommentCreate, Comment, CommentRepository

def test_comment_create_model():
    # Test valid CommentCreate
    data = {"message": "Test message", "is_public": True}
    comment_create = CommentCreate(**data)
    assert comment_create.message == "Test message"
    assert comment_create.is_public is True

    # Test default value for is_public
    data = {"message": "Another message"}
    comment_create = CommentCreate(**data)
    assert comment_create.is_public is True

    # Test invalid data (missing message)
    with pytest.raises(ValueError):
        CommentCreate(is_public=False)

def test_comment_model():
    # Test valid Comment
    now = datetime.now(timezone.utc)
    data = {
        "author_id": "user123",
        "author_name": "Test User",
        "message": "Hello World",
        "is_public": True,
        "created_at": now
    }
    comment = Comment(**data)
    assert comment.author_id == "user123"
    assert comment.author_name == "Test User"
    assert comment.message == "Hello World"
    assert comment.is_public is True
    assert comment.created_at == now
    assert comment.id is None

    # Test Comment with default created_at
    data_no_date = {
        "author_id": "user456",
        "author_name": "Another User",
        "message": "Another comment",
        "is_public": False
    }
    comment_no_date = Comment(**data_no_date)
    assert comment_no_date.author_id == "user456"
    assert comment_no_date.created_at is not None
    assert isinstance(comment_no_date.created_at, datetime)

    # Test Comment with id
    data_with_id = {
        "id": "abc123xyz",
        "author_id": "user789",
        "author_name": "ID User",
        "message": "Comment with ID",
        "is_public": True,
        "created_at": now
    }
    comment_with_id = Comment(**data_with_id)
    assert comment_with_id.id == "abc123xyz"

def test_comment_repository_abstract_methods():
    # Ensure CommentRepository is an abstract base class
    with pytest.raises(TypeError):
        CommentRepository()

    class ConcreteCommentRepository(CommentRepository):
        def insert(self, comment: Comment) -> Comment:
            return comment

        def list_public(self, limit: int = 100, offset: int = 0) -> list[Comment]:
            return []

    # Test that concrete implementation can be instantiated
    repo = ConcreteCommentRepository()
    assert isinstance(repo, CommentRepository)
    assert repo.insert(Comment(author_id="1", author_name="a", message="m")) is not None
    assert repo.list_public() == []
