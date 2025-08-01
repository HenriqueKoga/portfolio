from unittest.mock import MagicMock, patch

import pytest
from app.infrastructure.db.mongo import get_mongo_client, get_mongo_collection, reset_client
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection


@pytest.fixture(autouse=True)
def reset_mongo_client():
    reset_client()


@pytest.mark.asyncio
async def test_get_mongo_client_singleton(mocker):
    mocker.patch('os.getenv', side_effect=lambda k, default=None: {"MONGO_URI": "mongodb://test:27017"}.get(k, default))
    mock_client_instance = MagicMock(spec=AsyncIOMotorClient)
    mock_client_init = mocker.patch('app.infrastructure.db.mongo.AsyncIOMotorClient', return_value=mock_client_instance)

    client1 = get_mongo_client()
    client2 = get_mongo_client()

    mock_client_init.assert_called_once_with("mongodb://test:27017")
    assert client1 is client2
    assert client1 is mock_client_instance


@pytest.mark.asyncio
async def test_get_mongo_collection(mocker):
    mock_client = MagicMock(spec=AsyncIOMotorClient)
    mock_db = MagicMock()
    mock_collection = MagicMock(spec=AsyncIOMotorCollection)

    mock_client.__getitem__.return_value = mock_db
    mock_db.__getitem__.return_value = mock_collection

    mocker.patch('app.infrastructure.db.mongo.get_mongo_client', return_value=mock_client)
    mocker.patch('os.getenv', side_effect=lambda k, default: {"MONGO_DB_NAME": "test_db"}.get(k, default))

    collection = get_mongo_collection("test_collection")

    assert collection is mock_collection
    mock_client.__getitem__.assert_called_once_with("test_db")
    mock_db.__getitem__.assert_called_once_with("test_collection")


@pytest.mark.asyncio
async def test_get_mongo_collection_default_db_name(mocker):
    mock_client = MagicMock(spec=AsyncIOMotorClient)
    mock_db = MagicMock()
    mock_collection = MagicMock(spec=AsyncIOMotorCollection)

    mock_client.__getitem__.return_value = mock_db
    mock_db.__getitem__.return_value = mock_collection

    mocker.patch('app.infrastructure.db.mongo.get_mongo_client', return_value=mock_client)
    mocker.patch('os.getenv', side_effect=lambda k, default: default if k == "MONGO_DB_NAME" else "mongodb://test:27017")

    collection = get_mongo_collection("test_collection")

    assert collection is mock_collection
    mock_client.__getitem__.assert_called_once_with("projects")
    mock_db.__getitem__.assert_called_once_with("test_collection")
