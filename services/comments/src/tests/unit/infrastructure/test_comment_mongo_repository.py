import os
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from pymongo import DESCENDING
from app.domain.comment import Comment
from app.infrastructure.comment_mongo_repository import CommentMongoRepository


@pytest.fixture(autouse=True)
def mock_collection_create_index(mocker):
    mock_create_index = mocker.patch('pymongo.collection.Collection.create_index')
    mock_create_index.return_value = None
    yield mock_create_index


def test_comment_mongo_repository_init(mocker):
    # Patch MongoClient and os.getenv specifically for this test
    mock_client = mocker.patch('app.infrastructure.comment_mongo_repository.MongoClient')
    mock_os_getenv = mocker.patch('app.infrastructure.comment_mongo_repository.os.getenv')
    mock_os_getenv.return_value = "mongodb://localhost:27017/"

    # Mock the client, db, and collection objects for this test's mock_client
    mock_collection = MagicMock()
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_client.return_value.__getitem__.return_value = mock_db

    # Instantiate the repository within the test to control the __init__ call
    repo = CommentMongoRepository()

    # Check if 'MONGO_URI' was called as the first argument in any call
    assert any(call[0][0] == "MONGO_URI" for call in mock_os_getenv.call_args_list)
    mock_client.assert_called_once_with("mongodb://localhost:27017/")
    mock_client.return_value.__getitem__.assert_called_once_with("comments")
    mock_client.return_value.__getitem__.return_value.__getitem__.assert_called_once_with("comments")
    # The autouse fixture handles create_index assertions


def test_insert_comment(mocker):
    # Patch MongoClient and os.getenv specifically for this test
    mock_client = mocker.patch('app.infrastructure.comment_mongo_repository.MongoClient')
    mock_os_getenv = mocker.patch('app.infrastructure.comment_mongo_repository.os.getenv')
    mock_os_getenv.return_value = "mongodb://localhost:27017/"

    # Mock the client, db, and collection objects for this test's mock_client
    mock_collection = MagicMock()
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_client.return_value.__getitem__.return_value = mock_db

    # Instantiate the repository for this test
    repo = CommentMongoRepository()
    mock_collection = repo.collection

    mock_insert_result = MagicMock()
    mock_insert_result.inserted_id = "new_comment_id"
    mock_collection.insert_one = MagicMock(return_value=mock_insert_result)

    comment = Comment(
        author_id="user123",
        author_name="Test User",
        message="Test message",
        is_public=True,
        created_at=datetime.now(timezone.utc)
    )

    inserted_id = repo.insert(comment)

    mock_collection.insert_one.assert_called_once_with(comment.model_dump())
    assert inserted_id == "new_comment_id"


def test_list_public_comments(mocker):
    # Patch MongoClient and os.getenv specifically for this test
    mock_client = mocker.patch('app.infrastructure.comment_mongo_repository.MongoClient')
    mock_os_getenv = mocker.patch('app.infrastructure.comment_mongo_repository.os.getenv')
    mock_os_getenv.return_value = "mongodb://localhost:27017/"

    # Mock the client, db, and collection objects for this test's mock_client
    mock_collection = MagicMock()
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_client.return_value.__getitem__.return_value = mock_db

    # Instantiate the repository for this test
    repo = CommentMongoRepository()
    mock_collection = repo.collection

    mock_cursor = MagicMock()
    mock_collection.find = MagicMock(return_value=mock_cursor)

    # Mock the chain of calls for find().sort().limit().skip()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.skip.return_value = mock_cursor

    # Mock the iteration over the cursor
    mock_cursor.__iter__.return_value = [
        {"_id": "id1", "author_id": "a1", "author_name": "n1", "message": "m1", "is_public": True, "created_at": datetime.now(timezone.utc)},
        {"_id": "id2", "author_id": "a2", "author_name": "n2", "message": "m2", "is_public": True, "created_at": datetime.now(timezone.utc)},
    ]

    comments = repo.list_public(limit=10, offset=0)

    mock_collection.find.assert_called_once_with({"is_public": True})
    mock_cursor.sort.assert_called_once_with("created_at", DESCENDING)
    mock_cursor.limit.assert_called_once_with(10)
    mock_cursor.skip.assert_called_once_with(0)

    assert len(comments) == 2
    assert comments[0].id == "id1"
    assert comments[1].id == "id2"
    assert isinstance(comments[0], Comment)
    assert isinstance(comments[1], Comment)


def test_list_public_comments_empty(mocker):
    # Patch MongoClient and os.getenv specifically for this test
    mock_client = mocker.patch('app.infrastructure.comment_mongo_repository.MongoClient')
    mock_os_getenv = mocker.patch('app.infrastructure.comment_mongo_repository.os.getenv')
    mock_os_getenv.return_value = "mongodb://localhost:27017/"

    # Mock the client, db, and collection objects for this test's mock_client
    mock_collection = MagicMock()
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_client.return_value.__getitem__.return_value = mock_db

    # Instantiate the repository for this test
    repo = CommentMongoRepository()
    mock_collection = repo.collection

    mock_cursor = MagicMock()
    mock_collection.find = MagicMock(return_value=mock_cursor)

    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.skip.return_value = mock_cursor

    mock_cursor.__iter__.return_value = []

    comments = repo.list_public()

    assert len(comments) == 0