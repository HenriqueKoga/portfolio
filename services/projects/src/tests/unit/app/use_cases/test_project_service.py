import pytest
from unittest.mock import AsyncMock
from app.domain.project import Project
from app.domain.use_cases.project_service import ProjectService

@pytest.fixture
def mock_repository():
    return AsyncMock()

@pytest.mark.asyncio
async def test_list_projects(mock_repository):
    service = ProjectService(mock_repository)
    mock_repository.list_all.return_value = [Project(name="Test Project", description="Desc", stack=[], repo_url="", tags=[], visible=True)]
    projects = await service.list_projects()
    assert len(projects) == 1
    assert projects[0].name == "Test Project"
    mock_repository.list_all.assert_called_once()

@pytest.mark.asyncio
async def test_get_project(mock_repository):
    service = ProjectService(mock_repository)
    mock_repository.get_by_id.return_value = Project(id="1", name="Test Project", description="Desc", stack=[], repo_url="", tags=[], visible=True)
    project = await service.get_project("1")
    assert project.id == "1"
    mock_repository.get_by_id.assert_called_once_with("1")

@pytest.mark.asyncio
async def test_create_project(mock_repository):
    service = ProjectService(mock_repository)
    new_project = Project(name="New Project", description="Desc", stack=[], repo_url="", tags=[], visible=True)
    mock_repository.create.return_value = new_project
    created_project = await service.create_project(new_project)
    assert created_project.name == "New Project"
    mock_repository.create.assert_called_once_with(new_project)
