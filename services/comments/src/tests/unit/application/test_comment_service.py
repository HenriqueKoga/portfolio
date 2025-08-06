from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from app.application.comment_service import CommentService
from app.domain.comment import Comment, CommentCreate, CommentRepository
from app.infrastructure.publisher import Publisher


class TestCommentService:

    @pytest.fixture
    def mock_repository(self):
        """Mock repository para os testes"""
        return MagicMock(spec=CommentRepository)

    @pytest.fixture
    def mock_publisher(self):
        """Mock publisher para os testes"""
        return MagicMock(spec=Publisher)

    @pytest.fixture
    def comment_service(self, mock_repository, mock_publisher):
        """Instância do serviço com dependências mock"""
        return CommentService(mock_repository, mock_publisher)

    @pytest.fixture
    def sample_comment_create(self):
        """CommentCreate de exemplo para testes"""
        return CommentCreate(
            message="Test comment message",
            is_public=True
        )

    @pytest.fixture
    def sample_comment(self):
        """Comment de exemplo para testes"""
        return Comment(
            id="507f1f77bcf86cd799439011",
            user_id="user123",
            user_name="Test User",
            message="Test comment message",
            is_public=True,
            created_at=datetime.now(timezone.utc)
        )

    def test_create_comment_success(self, comment_service, mock_repository, mock_publisher, sample_comment_create):
        """Testa criação de comentário com sucesso"""
        # Arrange
        user_id = "user123"
        user_name = "Test User"
        created_comment = Comment(
            id="507f1f77bcf86cd799439011",
            user_id=user_id,
            user_name=user_name,
            message=sample_comment_create.message,
            is_public=sample_comment_create.is_public,
            created_at=datetime.now(timezone.utc)
        )
        mock_repository.insert.return_value = created_comment

        # Act
        result = comment_service.create_comment(sample_comment_create, user_id, user_name)

        # Assert
        assert result == created_comment
        mock_repository.insert.assert_called_once()
        mock_publisher.publish_comment.assert_called_once_with({
            "user_name": user_name,
            "message": sample_comment_create.message,
            "is_public": sample_comment_create.is_public
        })

        # Verifica se o comentário foi criado com os dados corretos
        call_args = mock_repository.insert.call_args[0][0]
        assert call_args.user_id == user_id
        assert call_args.user_name == user_name
        assert call_args.message == sample_comment_create.message
        assert call_args.is_public == sample_comment_create.is_public
        assert isinstance(call_args.created_at, datetime)

    def test_create_private_comment(self, comment_service, mock_repository, mock_publisher):
        """Testa criação de comentário privado"""
        # Arrange
        comment_create = CommentCreate(message="Private comment", is_public=False)
        user_id = "user456"
        user_name = "Private User"
        created_comment = Comment(
            id="507f1f77bcf86cd799439012",
            user_id=user_id,
            user_name=user_name,
            message=comment_create.message,
            is_public=False,
            created_at=datetime.now(timezone.utc)
        )
        mock_repository.insert.return_value = created_comment

        # Act
        result = comment_service.create_comment(comment_create, user_id, user_name)

        # Assert
        assert result == created_comment
        mock_repository.insert.assert_called_once()
        mock_publisher.publish_comment.assert_called_once_with({
            "user_name": user_name,
            "message": comment_create.message,
            "is_public": False
        })

    def test_get_all_public_comments(self, comment_service, mock_repository, sample_comment):
        """Testa busca de todos os comentários públicos"""
        # Arrange
        expected_comments = [sample_comment]
        mock_repository.list_public.return_value = expected_comments

        # Act
        result = comment_service.get_all_public_comments()

        # Assert
        assert result == expected_comments
        mock_repository.list_public.assert_called_once()

    def test_get_all_public_comments_empty(self, comment_service, mock_repository):
        """Testa busca quando não há comentários públicos"""
        # Arrange
        mock_repository.list_public.return_value = []

        # Act
        result = comment_service.get_all_public_comments()

        # Assert
        assert result == []
        mock_repository.list_public.assert_called_once()

    def test_get_comments_by_user(self, comment_service, mock_repository, sample_comment):
        """Testa busca de comentários por usuário"""
        # Arrange
        user_id = "user123"
        expected_comments = [sample_comment]
        mock_repository.list_by_user.return_value = expected_comments

        # Act
        result = comment_service.get_comments_by_user(user_id)

        # Assert
        assert result == expected_comments
        mock_repository.list_by_user.assert_called_once_with(user_id)

    def test_get_comments_by_user_empty(self, comment_service, mock_repository):
        """Testa busca por usuário quando não há comentários"""
        # Arrange
        user_id = "user123"
        mock_repository.list_by_user.return_value = []

        # Act
        result = comment_service.get_comments_by_user(user_id)

        # Assert
        assert result == []
        mock_repository.list_by_user.assert_called_once_with(user_id)

    def test_get_comment_by_id_success(self, comment_service, mock_repository, sample_comment):
        """Testa busca de comentário por ID com sucesso"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_repository.get_by_id.return_value = sample_comment

        # Act
        result = comment_service.get_comment_by_id(comment_id)

        # Assert
        assert result == sample_comment
        mock_repository.get_by_id.assert_called_once_with(comment_id)

    def test_get_comment_by_id_not_found(self, comment_service, mock_repository):
        """Testa busca de comentário que não existe"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_repository.get_by_id.return_value = None

        # Act
        result = comment_service.get_comment_by_id(comment_id)

        # Assert
        assert result is None
        mock_repository.get_by_id.assert_called_once_with(comment_id)

    def test_delete_comment_success(self, comment_service, mock_repository):
        """Testa exclusão de comentário com sucesso"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_repository.delete.return_value = True

        # Act
        result = comment_service.delete_comment(comment_id)

        # Assert
        assert result is True
        mock_repository.delete.assert_called_once_with(comment_id)

    def test_delete_comment_not_found(self, comment_service, mock_repository):
        """Testa exclusão de comentário que não existe"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_repository.delete.return_value = False

        # Act
        result = comment_service.delete_comment(comment_id)

        # Assert
        assert result is False
        mock_repository.delete.assert_called_once_with(comment_id)
