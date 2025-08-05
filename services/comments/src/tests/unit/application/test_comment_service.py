from unittest.mock import Mock
from datetime import datetime, timezone

import pytest

from app.application.comment_service import CommentService
from app.domain.comment import Comment, CommentCreate


@pytest.fixture
def mock_repository():
    return Mock()


@pytest.fixture
def mock_publisher():
    return Mock()


@pytest.fixture
def comment_service(mock_repository, mock_publisher):
    return CommentService(mock_repository, mock_publisher)


def test_create_comment_success(comment_service, mock_repository, mock_publisher):
    # Given
    comment_create_data = CommentCreate(message="Test message", is_public=True)
    user_id = "user123"
    user_name = "Test User"
    expected_inserted_id = "mock_comment_id"

    mock_repository.insert.return_value = expected_inserted_id

    # When
    inserted_id = comment_service.create_comment(comment_create_data, user_id, user_name)

    # Then
    assert inserted_id == expected_inserted_id
    mock_repository.insert.assert_called_once()
    # Verify that the comment passed to insert has the correct attributes
    called_comment = mock_repository.insert.call_args[0][0]
    assert isinstance(called_comment, Comment)
    assert called_comment.user_id == user_id
    assert called_comment.user_name == user_name
    assert called_comment.message == comment_create_data.message
    assert called_comment.is_public == comment_create_data.is_public
    assert isinstance(called_comment.created_at, datetime)
    assert called_comment.created_at.tzinfo == timezone.utc

    mock_publisher.publish_comment.assert_called_once_with({
        "user_name": user_name,
        "message": comment_create_data.message,
        "is_public": comment_create_data.is_public
    })


def test_get_public_comments(comment_service, mock_repository):
    # Given
    mock_comments = [
        Comment(id="1", user_id="u1", user_name="n1", message="m1", is_public=True),
        Comment(id="2", user_id="u2", user_name="n2", message="m2", is_public=True),
    ]
    mock_repository.list_public.return_value = mock_comments

    # When
    comments = comment_service.get_all_public_comments()

    # Then
    assert comments == mock_comments
    mock_repository.list_public.assert_called_once()

def test_get_comments_by_user(comment_service, mock_repository):
    # Given
    user_id = "test_user_id"
    mock_comments = [
        Comment(id="3", user_id=user_id, user_name="n3", message="m3", is_public=False),
    ]
    mock_repository.list_by_user.return_value = mock_comments

    # When
    comments = comment_service.get_comments_by_user(user_id)

    # Then
    assert comments == mock_comments
    mock_repository.list_by_user.assert_called_once_with(user_id)
