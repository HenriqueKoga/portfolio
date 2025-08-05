import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.domain.project import Project
from app.routes.routes import get_service, get_current_user

# Patch load_secrets before importing app
with patch('app.infrastructure.vault.load_secrets'):
    from app.main import app

@pytest.fixture
def mock_project_service():
    return AsyncMock()

@pytest.fixture
def mock_get_current_user():
    return lambda: {"id": "test_user_id", "username": "testuser"}

@pytest.fixture(autouse=True)
def override_dependencies(mock_project_service, mock_get_current_user):
    app.dependency_overrides[get_service] = lambda: mock_project_service
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    app.dependency_overrides = {}

def test_create_project(mock_project_service, monkeypatch):
    monkeypatch.setenv("AUTHORIZED_USER_ID", "test_user_id")
    monkeypatch.setenv("JWT_SECRET", "test_jwt_secret")

    client = TestClient(app)
    project_data = {"name": "Test Project", "description": "A test project", "stack": ["Python"], "repo_url": "http://test.com", "tags": ["test"], "visible": True}
    mock_project_service.create_project.return_value = Project(**project_data, id="1")
    response = client.post("/projects", json=project_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"

def test_list_projects(mock_project_service):
    client = TestClient(app)
    project_data = {"name": "Test Project", "description": "A test project", "stack": ["Python"], "repo_url": "http://test.com", "tags": ["test"], "visible": True, "id": "1"}
    mock_project_service.list_projects.return_value = [Project(**project_data)]
    response = client.get("/projects")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Test Project"

def test_get_project(mock_project_service):
    client = TestClient(app)
    project_data = {"name": "Test Project", "description": "A test project", "stack": ["Python"], "repo_url": "http://test.com", "tags": ["test"], "visible": True, "id": "1"}
    mock_project_service.get_project.return_value = Project(**project_data)
    response = client.get("/projects/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"

def test_get_project_not_found(mock_project_service):
    client = TestClient(app)
    mock_project_service.get_project.return_value = None
    response = client.get("/projects/1")
    assert response.status_code == 404
