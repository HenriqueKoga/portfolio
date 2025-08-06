from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.domain.project import Project
from app.infrastructure.repositories.project_mongo_repository import ProjectMongoRepository
from bson import ObjectId


class TestProjectMongoRepository:

    @pytest.fixture
    def mock_collection(self):
        """Mock da collection do MongoDB"""
        return AsyncMock()

    @pytest.fixture
    def repository(self, mock_collection):
        """Instância do repositório com collection mock"""
        repo = ProjectMongoRepository()
        repo.collection = mock_collection
        return repo

    @pytest.fixture
    def sample_project_data(self):
        """Dados de projeto de exemplo"""
        return {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "name": "Test Project",
            "description": "A test project",
            "stack": ["Python", "FastAPI"],
            "repo_url": "https://github.com/test/project",
            "tags": ["test", "api"],
            "visible": True
        }

    @pytest.fixture
    def sample_project(self):
        """Projeto de exemplo"""
        return Project(
            id="507f1f77bcf86cd799439011",
            name="Test Project",
            description="A test project",
            stack=["Python", "FastAPI"],
            repo_url="https://github.com/test/project",
            tags=["test", "api"],
            visible=True
        )

    @pytest.mark.asyncio
    async def test_list_all_success(self, repository, mock_collection, sample_project_data):
        """Testa listagem de todos os projetos com sucesso"""
        # Arrange
        mock_cursor = AsyncMock()
        mock_cursor.to_list = AsyncMock(return_value=[sample_project_data])
        mock_collection.find = MagicMock(return_value=mock_cursor)

        # Act
        result = await repository.list_all()

        # Assert
        assert len(result) == 1
        assert result[0].id == "507f1f77bcf86cd799439011"
        assert result[0].name == "Test Project"
        mock_collection.find.assert_called_once_with({})
        mock_cursor.to_list.assert_called_once_with(length=None)

    @pytest.mark.asyncio
    async def test_list_all_empty(self, repository, mock_collection):
        """Testa listagem quando não há projetos"""
        # Arrange
        mock_cursor = AsyncMock()
        mock_cursor.to_list = AsyncMock(return_value=[])
        mock_collection.find = MagicMock(return_value=mock_cursor)

        # Act
        result = await repository.list_all()

        # Assert
        assert result == []
        mock_collection.find.assert_called_once_with({})

    @pytest.mark.asyncio
    async def test_get_by_id_success(self, repository, mock_collection, sample_project_data):
        """Testa busca por ID com sucesso"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_collection.find_one = AsyncMock(return_value=sample_project_data)

        # Act
        result = await repository.get_by_id(project_id)

        # Assert
        assert result.id == project_id
        assert result.name == "Test Project"
        mock_collection.find_one.assert_called_once_with({"_id": ObjectId(project_id)})

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, repository, mock_collection):
        """Testa busca por ID quando projeto não existe"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_collection.find_one = AsyncMock(return_value=None)

        # Act
        result = await repository.get_by_id(project_id)

        # Assert
        assert result is None
        mock_collection.find_one.assert_called_once_with({"_id": ObjectId(project_id)})

    @pytest.mark.asyncio
    async def test_create_success(self, repository, mock_collection, sample_project):
        """Testa criação de projeto com sucesso"""
        # Arrange
        project_without_id = Project(
            name="Test Project",
            description="A test project",
            stack=["Python", "FastAPI"],
            repo_url="https://github.com/test/project",
            tags=["test", "api"],
            visible=True
        )
        mock_collection.insert_one = AsyncMock()

        # Mock ObjectId creation in the repository module
        with patch('app.infrastructure.repositories.project_mongo_repository.ObjectId') as mock_object_id:
            mock_object_id.return_value = ObjectId("507f1f77bcf86cd799439011")
            result = await repository.create(project_without_id)

        # Assert
        assert result.id == "507f1f77bcf86cd799439011"
        assert result.name == "Test Project"
        mock_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_success(self, repository, mock_collection, sample_project):
        """Testa atualização de projeto com sucesso"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_collection.update_one = AsyncMock(return_value=mock_result)

        # Mock get_by_id para retornar o projeto atualizado
        repository.get_by_id = AsyncMock(return_value=sample_project)

        # Act
        result = await repository.update(project_id, sample_project)

        # Assert
        assert result == sample_project
        mock_collection.update_one.assert_called_once()
        repository.get_by_id.assert_called_once_with(project_id)

    @pytest.mark.asyncio
    async def test_update_not_found(self, repository, mock_collection, sample_project):
        """Testa atualização quando projeto não existe"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.modified_count = 0
        mock_collection.update_one = AsyncMock(return_value=mock_result)

        # Act
        result = await repository.update(project_id, sample_project)

        # Assert
        assert result is None
        mock_collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_exception(self, repository, mock_collection, sample_project):
        """Testa atualização com exceção"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_collection.update_one = AsyncMock(side_effect=Exception("Database error"))

        # Act
        result = await repository.update(project_id, sample_project)

        # Assert
        assert result is None
        mock_collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_success(self, repository, mock_collection):
        """Testa exclusão de projeto com sucesso"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.deleted_count = 1
        mock_collection.delete_one = AsyncMock(return_value=mock_result)

        # Act
        result = await repository.delete(project_id)

        # Assert
        assert result is True
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(project_id)})

    @pytest.mark.asyncio
    async def test_delete_not_found(self, repository, mock_collection):
        """Testa exclusão quando projeto não existe"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_result = MagicMock()
        mock_result.deleted_count = 0
        mock_collection.delete_one = AsyncMock(return_value=mock_result)

        # Act
        result = await repository.delete(project_id)

        # Assert
        assert result is False
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(project_id)})

    @pytest.mark.asyncio
    async def test_delete_exception(self, repository, mock_collection):
        """Testa exclusão com exceção"""
        # Arrange
        project_id = "507f1f77bcf86cd799439011"
        mock_collection.delete_one = AsyncMock(side_effect=Exception("Database error"))

        # Act
        result = await repository.delete(project_id)

        # Assert
        assert result is False
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(project_id)})
