import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import MagicMock

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
    mock_comment_service.create_comment.return_value = "mock_inserted_id"

    response = await async_client.post("/comments", json=comment_create_data.model_dump())

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {"id": "mock_inserted_id"}
    mock_comment_service.create_comment.assert_called_once_with(
        comment_create_data,
        authorized_user["id"],
        authorized_user["name"]
    )


@pytest.mark.asyncio
async def test_get_public_comments_success(async_client, mock_comment_service):
    mock_comments = [
        Comment(id="id1", author_id="user1", author_name="User One", message="Comment 1", is_public=True),
        Comment(id="id2", author_id="user2", author_name="User Two", message="Comment 2", is_public=True),
    ]
    mock_comment_service.get_public_comments.return_value = mock_comments

    response = await async_client.get("/comments/public")

    assert response.status_code == status.HTTP_200_OK
    # Convert Comment objects to dictionaries for comparison, handling datetime
    expected_json = [
        {
            "id": c.id,
            "author_id": c.author_id,
            "author_name": c.author_name,
            "message": c.message,
            "is_public": c.is_public,
            "created_at": c.created_at.isoformat().replace("+00:00", "Z")
        } for c in mock_comments
    ]
    assert response.json() == expected_json
    mock_comment_service.get_public_comments.assert_called_once()


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
async def test_get_public_comments_unauthorized(async_client):
    
    # Temporarily override get_current_user to simulate unauthorized access
    def _unauthorized_user():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    app.dependency_overrides[routes.get_current_user] = _unauthorized_user

    response = await async_client.get("/comments/public")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {"detail": "Unauthorized"}

    # Clean up the override
    app.dependency_overrides = {}