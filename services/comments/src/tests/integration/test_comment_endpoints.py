import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import MagicMock
from datetime import datetime, timezone

from app.main import app
from app.routes import routes
from app.application.comment_service import CommentService
from app.domain.comment import Comment, CommentCreate
from app.infrastructure.comment_mongo_repository import CommentMongoRepository
from app.infrastructure.publisher import RabbitMQPublisher
from fastapi import HTTPException, status


@pytest.fixture
def mock_comment_service():
    return MagicMock(spec=CommentService)


@pytest.fixture
def mock_comment_mongo_repository():
    return MagicMock(spec=CommentMongoRepository)


@pytest.fixture
def mock_rabbitmq_publisher():
    return MagicMock(spec=RabbitMQPublisher)


@pytest.fixture(autouse=True)
def override_get_service(mock_comment_service, mock_comment_mongo_repository, mock_rabbitmq_publisher):
    def _override_get_service():
        # Ensure the mocked service uses mocked dependencies
        mock_comment_service.repository = mock_comment_mongo_repository
        mock_comment_service.publisher = mock_rabbitmq_publisher
        return mock_comment_service

    app.dependency_overrides[routes.get_service] = _override_get_service
    yield
    app.dependency_overrides = {}


@pytest.fixture
def authorized_user():
    return {"id": "test_user_id", "name": "Test User"}


@pytest.fixture(autouse=True)
def override_get_current_user(authorized_user):
    def _override_get_current_user():
        return authorized_user

    app.dependency_overrides[routes.get_current_user] = _override_get_current_user
    yield
    app.dependency_overrides = {}


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_post_comment_success(async_client, mock_comment_service, authorized_user):
    comment_create_data = CommentCreate(message="New comment from test", is_public=True)
    
    # Mock create_comment to return a full Comment object as the service would
    mock_comment_service.create_comment.return_value = Comment(
        id="mock_inserted_id",
        user_id=authorized_user["id"],
        user_name=authorized_user["name"],
        message=comment_create_data.message,
        is_public=comment_create_data.is_public,
        created_at=datetime.now(timezone.utc) # Add created_at for completeness
    )

    response = await async_client.post("/comments", json=comment_create_data.model_dump())

    assert response.status_code == status.HTTP_201_CREATED
    # Assert the response matches the mocked return value (converted to dict)
    assert response.json()["id"] == "mock_inserted_id"
    assert response.json()["message"] == comment_create_data.message
    assert response.json()["user_id"] == authorized_user["id"]
    
    mock_comment_service.create_comment.assert_called_once_with(
        comment_create_data,
        authorized_user["id"],
        authorized_user["name"]
    )


@pytest.mark.asyncio
async def test_get_public_comments_success(async_client, mock_comment_service):
    mock_comments = [
        Comment(id="id1", user_id="user1", user_name="User One", message="Comment 1", is_public=True, created_at=datetime.now(timezone.utc)),
        Comment(id="id2", user_id="user2", user_name="User Two", message="Comment 2", is_public=True, created_at=datetime.now(timezone.utc)),
    ]
    mock_comment_service.get_all_public_comments.return_value = mock_comments

    response = await async_client.get("/comments/all_public") # Corrected endpoint

    assert response.status_code == status.HTTP_200_OK
    # Convert Comment objects to dictionaries for comparison, handling datetime
    expected_json = [
        {
            "id": c.id,
            "user_id": c.user_id,
            "user_name": c.user_name,
            "message": c.message,
            "is_public": c.is_public,
            "created_at": c.created_at.isoformat().replace("+00:00", "Z")
        } for c in mock_comments
    ]
    assert response.json() == expected_json
    mock_comment_service.get_all_public_comments.assert_called_once()


@pytest.mark.asyncio
async def test_post_comment_unauthorized(async_client):
    # Temporarily override get_current_user to simulate unauthorized access
    def _unauthorized_user():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    app.dependency_overrides[routes.get_current_user] = _unauthorized_user

    comment_create_data = CommentCreate(message="Unauthorized comment", is_public=True)
    response = await async_client.post("/comments", json=comment_create_data.model_dump())

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {"detail": "Unauthorized"}

    # Clean up the override
    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_get_my_comments_unauthorized(async_client):
    
    # Temporarily override get_current_user to simulate unauthorized access
    def _unauthorized_user():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    app.dependency_overrides[routes.get_current_user] = _unauthorized_user

    response = await async_client.get("/comments/my") # Test the authenticated endpoint

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {"detail": "Unauthorized"}

    # Clean up the override
    app.dependency_overrides = {}