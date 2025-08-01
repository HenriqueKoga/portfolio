import pytest
from unittest.mock import AsyncMock, MagicMock
from app.domain.project import Project
from app.infrastructure.repositories.project_mongo_repository import ProjectMongoRepository
from bson import ObjectId

@pytest.fixture
def mock_mongo_collection():
    return MagicMock()

@pytest.fixture
def mock_get_mongo_collection(mocker, mock_mongo_collection):
    return mocker.patch('app.infrastructure.repositories.project_mongo_repository.get_mongo_collection', return_value=mock_mongo_collection)

@pytest.mark.asyncio
async def test_list_all(mock_get_mongo_collection, mock_mongo_collection):
    repo = ProjectMongoRepository()
    project_doc = {"_id": ObjectId(), "name": "Test Project", "description": "Desc", "stack": [], "repo_url": "", "tags": [], "visible": True}

    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[project_doc])
    mock_mongo_collection.find.return_value = mock_cursor

    projects = await repo.list_all()
    assert len(projects) == 1
    assert projects[0].name == "Test Project"
    mock_mongo_collection.find.assert_called_once_with({})
    mock_cursor.to_list.assert_called_once_with(length=None)

@pytest.mark.asyncio
async def test_get_by_id(mock_get_mongo_collection, mock_mongo_collection):
    repo = ProjectMongoRepository()
    project_id = ObjectId()
    mock_mongo_collection.find_one = AsyncMock(return_value={
        "_id": project_id,
        "name": "Test Project",
        "description": "Desc",
        "stack": [],
        "repo_url": "",
        "tags": [],
        "visible": True
    })
    project = await repo.get_by_id(str(project_id))
    assert project.name == "Test Project"
    mock_mongo_collection.find_one.assert_called_once_with({"_id": ObjectId(str(project_id))})

@pytest.mark.asyncio
async def test_create(mock_get_mongo_collection, mock_mongo_collection):
    repo = ProjectMongoRepository()
    new_project = Project(name="New Project", description="Desc", stack=[], repo_url="", tags=[], visible=True)
    mock_mongo_collection.insert_one = AsyncMock()
    await repo.create(new_project)
    mock_mongo_collection.insert_one.assert_called_once()
