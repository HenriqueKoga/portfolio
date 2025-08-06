from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from app.domain.comment import Comment
from app.infrastructure.comment_mongo_repository import CommentMongoRepository
from bson import ObjectId


class TestCommentMongoRepository:

    @pytest.fixture
    def mock_collection(self):
        """Mock da collection do MongoDB"""
        return MagicMock()

    @pytest.fixture
    def repository(self, mock_collection):
        """Instância do repositório com collection mock"""
        with patch('app.infrastructure.comment_mongo_repository.MongoClient'):
            repo = CommentMongoRepository()
            repo.collection = mock_collection
            return repo

    @pytest.fixture
    def sample_comment_data(self):
        """Dados de comentário de exemplo"""
        return {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "user_id": "user123",
            "user_name": "Test User",
            "message": "Test comment",
            "is_public": True,
            "created_at": datetime.now(timezone.utc)
        }

    @pytest.fixture
    def sample_comment(self):
        """Comentário de exemplo"""
        return Comment(
            id="507f1f77bcf86cd799439011",
            user_id="user123",
            user_name="Test User",
            message="Test comment",
            is_public=True,
            created_at=datetime.now(timezone.utc)
        )

    def test_insert_success(self, repository, mock_collection, sample_comment):
        """Testa inserção de comentário com sucesso"""
        # Arrange
        comment_without_id = Comment(
            user_id="user123",
            user_name="Test User",
            message="Test comment",
            is_public=True,
            created_at=datetime.now(timezone.utc)
        )
        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId("507f1f77bcf86cd799439011")
        mock_collection.insert_one.return_value = mock_result

        # Act
        result = repository.insert(comment_without_id)

        # Assert
        assert result.id == "507f1f77bcf86cd799439011"
        assert result.user_id == "user123"
        assert result.user_name == "Test User"
        assert result.message == "Test comment"
        mock_collection.insert_one.assert_called_once()

    def test_list_public_success(self, repository, mock_collection, sample_comment_data):
        """Testa listagem de comentários públicos com sucesso"""
        # Arrange
        mock_cursor = MagicMock()
        mock_cursor.__iter__.return_value = iter([sample_comment_data])
        mock_collection.find.return_value.sort.return_value.limit.return_value.skip.return_value = mock_cursor

        # Act
        result = repository.list_public(limit=100, offset=0)

        # Assert
        assert len(result) == 1
        assert result[0].id == "507f1f77bcf86cd799439011"
        assert result[0].user_name == "Test User"
        mock_collection.find.assert_called_once_with({"is_public": True})

    def test_list_public_empty(self, repository, mock_collection):
        """Testa listagem quando não há comentários públicos"""
        # Arrange
        mock_cursor = MagicMock()
        mock_cursor.__iter__.return_value = iter([])
        mock_collection.find.return_value.sort.return_value.limit.return_value.skip.return_value = mock_cursor

        # Act
        result = repository.list_public()

        # Assert
        assert result == []
        mock_collection.find.assert_called_once_with({"is_public": True})

    def test_list_by_user_success(self, repository, mock_collection, sample_comment_data):
        """Testa listagem de comentários por usuário com sucesso"""
        # Arrange
        user_id = "user123"
        mock_cursor = MagicMock()
        mock_cursor.__iter__.return_value = iter([sample_comment_data])
        mock_collection.find.return_value.sort.return_value.limit.return_value.skip.return_value = mock_cursor

        # Act
        result = repository.list_by_user(user_id)

        # Assert
        assert len(result) == 1
        assert result[0].user_id == user_id
        mock_collection.find.assert_called_once_with({"user_id": user_id})

    def test_get_by_id_success(self, repository, mock_collection, sample_comment_data):
        """Testa busca por ID com sucesso"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_collection.find_one.return_value = sample_comment_data

        # Act
        result = repository.get_by_id(comment_id)

        # Assert
        assert result.id == comment_id
        assert result.user_name == "Test User"
        mock_collection.find_one.assert_called_once_with({"_id": ObjectId(comment_id)})

    def test_get_by_id_not_found(self, repository, mock_collection):
        """Testa busca por ID quando comentário não existe"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_collection.find_one.return_value = None

        # Act
        result = repository.get_by_id(comment_id)

        # Assert
        assert result is None
        mock_collection.find_one.assert_called_once_with({"_id": ObjectId(comment_id)})

    def test_delete_success(self, repository, mock_collection):
        """Testa exclusão de comentário com sucesso"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.deleted_count = 1
        mock_collection.delete_one.return_value = mock_result

        # Act
        result = repository.delete(comment_id)

        # Assert
        assert result is True
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(comment_id)})

    def test_delete_not_found(self, repository, mock_collection):
        """Testa exclusão quando comentário não existe"""
        # Arrange
        comment_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.deleted_count = 0
        mock_collection.delete_one.return_value = mock_result

        # Act
        result = repository.delete(comment_id)

        # Assert
        assert result is False
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(comment_id)})
