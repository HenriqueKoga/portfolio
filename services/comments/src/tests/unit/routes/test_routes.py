from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status

from app.application.comment_service import CommentService
from app.domain.comment import Comment, CommentCreate
from app.routes.auth import get_current_user
from app.routes.routes import get_all_public_comments, post_comment, get_service


@pytest.fixture
def mock_comment_service():
    return MagicMock(spec=CommentService)


@pytest.fixture
def mock_get_current_user():
    return MagicMock(return_value={"id": "test_user_id", "name": "Test User"})


@pytest.fixture
def mock_get_service(mock_comment_service):
    return MagicMock(return_value=mock_comment_service)


def test_get_comments_success(mock_comment_service, mock_get_current_user, mock_get_service):
    mock_comments = [
        Comment(id="1", user_id="u1", user_name="n1", message="m1", is_public=True),
        Comment(id="2", user_id="u2", user_name="n2", message="m2", is_public=True),
    ]
    mock_comment_service.get_all_public_comments.return_value = mock_comments

    with patch('app.routes.routes.get_current_user', new=mock_get_current_user):
        with patch('app.routes.routes.get_service', new=mock_get_service):
            response = get_all_public_comments(service=mock_comment_service)

    assert response == mock_comments
    mock_comment_service.get_all_public_comments.assert_called_once()


def test_post_comment_success(mock_comment_service, mock_get_current_user, mock_get_service):
    comment_data = CommentCreate(message="New comment", is_public=True)
    # The service returns a Comment object, not just the ID
    mock_comment_service.create_comment.return_value = Comment(
        id="new_comment_id",
        user_id="test_user_id",
        user_name="Test User",
        message="New comment",
        is_public=True
    )

    with patch('app.routes.routes.get_current_user', new=mock_get_current_user):
        with patch('app.routes.routes.get_service', new=mock_get_service):
            response = post_comment(comment=comment_data, user=mock_get_current_user(), service=mock_comment_service)

    assert response.id == "new_comment_id"
    assert response.message == "New comment"
    mock_comment_service.create_comment.assert_called_once_with(
        comment_data,
        "test_user_id",
        "Test User"
    )


def test_post_comment_unauthorized(mock_comment_service, mock_get_service):
    with patch('app.routes.routes.get_current_user', return_value=None):
        with patch('app.routes.routes.get_service', new=mock_get_service):
            with pytest.raises(HTTPException) as exc_info:
                post_comment(comment=MagicMock(), user=None, service=mock_comment_service)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Unauthorized"
    mock_comment_service.create_comment.assert_not_called()
