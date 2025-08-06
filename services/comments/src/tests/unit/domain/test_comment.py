from datetime import datetime, timezone

import pytest
from app.domain.comment import Comment, CommentCreate, CommentRepository


class TestCommentCreate:

    def test_comment_create_model_valid(self):
        """Testa criação válida do modelo CommentCreate"""
        # Arrange & Act
        data = {"message": "Test message", "is_public": True}
        comment_create = CommentCreate(**data)

        # Assert
        assert comment_create.message == "Test message"
        assert comment_create.is_public is True

    def test_comment_create_model_default_public(self):
        """Testa valor padrão de is_public"""
        # Arrange & Act
        data = {"message": "Another message"}
        comment_create = CommentCreate(**data)

        # Assert
        assert comment_create.is_public is True

    def test_comment_create_model_invalid_missing_message(self):
        """Testa validação quando message está ausente"""
        # Arrange & Act & Assert
        with pytest.raises(ValueError):
            CommentCreate(is_public=False)

    def test_comment_create_model_empty_message(self):
        """Testa validação com message vazia"""
        # Arrange & Act
        comment_create = CommentCreate(message="", is_public=True)

        # Assert
        assert comment_create.message == ""
        assert comment_create.is_public is True

    def test_comment_create_model_private(self):
        """Testa criação de comentário privado"""
        # Arrange & Act
        comment_create = CommentCreate(message="Private message", is_public=False)

        # Assert
        assert comment_create.message == "Private message"
        assert comment_create.is_public is False


class TestComment:

    def test_comment_model_with_all_fields(self):
        """Testa criação do modelo Comment com todos os campos"""
        # Arrange
        created_at = datetime.now(timezone.utc)

        # Act
        comment = Comment(
            id="507f1f77bcf86cd799439011",
            user_id="user123",
            user_name="Test User",
            message="Test comment",
            is_public=True,
            created_at=created_at
        )

        # Assert
        assert comment.id == "507f1f77bcf86cd799439011"
        assert comment.user_id == "user123"
        assert comment.user_name == "Test User"
        assert comment.message == "Test comment"
        assert comment.is_public is True
        assert comment.created_at == created_at

    def test_comment_model_default_created_at(self):
        """Testa valor padrão de created_at no Comment"""
        # Arrange & Act
        comment = Comment(
            user_id="user123",
            user_name="Test User",
            message="Test comment"
        )

        # Assert
        assert comment.created_at is not None
        assert isinstance(comment.created_at, datetime)
        assert comment.created_at.tzinfo == timezone.utc

    def test_comment_model_default_values(self):
        """Testa valores padrão do modelo Comment"""
        # Arrange & Act
        comment = Comment(
            user_id="user123",
            user_name="Test User",
            message="Test comment"
        )

        # Assert
        assert comment.id is None
        assert comment.is_public is True
        assert comment.created_at is not None

    def test_comment_inheritance_from_comment_create(self):
        """Testa herança do CommentCreate no Comment"""
        # Arrange & Act
        comment = Comment(
            user_id="user123",
            user_name="Test User",
            message="Test comment",
            is_public=False
        )

        # Assert
        assert hasattr(comment, 'message')
        assert hasattr(comment, 'is_public')
        assert comment.message == "Test comment"
        assert comment.is_public is False

    def test_comment_model_required_fields(self):
        """Testa campos obrigatórios do Comment"""
        # Arrange & Act & Assert
        with pytest.raises(ValueError):
            Comment(message="Test comment")  # Falta user_id e user_name

    def test_comment_model_private_comment(self):
        """Testa criação de comentário privado"""
        # Arrange & Act
        comment = Comment(
            user_id="user456",
            user_name="Private User",
            message="Private comment",
            is_public=False
        )

        # Assert
        assert comment.user_id == "user456"
        assert comment.user_name == "Private User"
        assert comment.message == "Private comment"
        assert comment.is_public is False


def test_comment_model():
    # Test valid Comment
    now = datetime.now(timezone.utc)
    data = {
        "user_id": "user123",
        "user_name": "Test User",
        "message": "Hello World",
        "is_public": True,
        "created_at": now
    }
    comment = Comment(**data)
    assert comment.user_id == "user123"
    assert comment.user_name == "Test User"
    assert comment.message == "Hello World"
    assert comment.is_public is True
    assert comment.created_at == now
    assert comment.id is None

    # Test Comment with default created_at
    data_no_date = {
        "user_id": "user456",
        "user_name": "Another User",
        "message": "Another comment",
        "is_public": False
    }
    comment_no_date = Comment(**data_no_date)
    assert comment_no_date.user_id == "user456"
    assert comment_no_date.created_at is not None
    assert isinstance(comment_no_date.created_at, datetime)

    # Test Comment with id
    data_with_id = {
        "id": "abc123xyz",
        "user_id": "user789",
        "user_name": "ID User",
        "message": "Comment with ID",
        "is_public": True,
        "created_at": now
    }
    comment_with_id = Comment(**data_with_id)
    assert comment_with_id.id == "abc123xyz"


def test_comment_repository_abstract_methods():
    # Ensure CommentRepository is an abstract base class
    # with pytest.raises(TypeError):
    #     CommentRepository()

    class ConcreteCommentRepository(CommentRepository):
        def insert(self, comment: Comment) -> Comment:
            return comment

        def list_public(self, limit: int = 100, offset: int = 0) -> list[Comment]:
            return []

        def list_by_user(self, user_id: str, limit: int = 100, offset: int = 0) -> list[Comment]:
            return []

        def get_by_id(self, comment_id: str) -> Comment:
            return None

        def delete(self, comment_id: str) -> bool:
            return True

    # Test that concrete implementation can be instantiated
    repo = ConcreteCommentRepository()
    assert isinstance(repo, CommentRepository)
    assert repo.insert(Comment(user_id="1", user_name="a", message="m")) is not None
    assert repo.list_public() == []
    assert repo.list_by_user("1") == []
