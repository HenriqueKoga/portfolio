import json
import os
from unittest.mock import MagicMock, patch

import pytest

from app.infrastructure.publisher import RabbitMQPublisher


@pytest.fixture
def mock_pika_connection():
    with patch('pika.BlockingConnection') as mock_conn:
        yield mock_conn


@pytest.fixture
def mock_pika_plain_credentials():
    with patch('pika.PlainCredentials') as mock_creds:
        yield mock_creds


@pytest.fixture
def mock_pika_connection_parameters():
    with patch('pika.ConnectionParameters') as mock_params:
        yield mock_params


@pytest.fixture
def mock_os_getenv():
    with patch('os.getenv') as mock_getenv:
        mock_getenv.side_effect = {
            "RABBITMQ_HOST": "localhost",
            "RABBITMQ_PORT": "5672",
            "RABBITMQ_USER": "guest",
            "RABBITMQ_PASSWORD": "guest",
        }.get
        yield mock_getenv


@pytest.fixture
def rabbitmq_publisher(mock_pika_connection, mock_pika_plain_credentials, mock_pika_connection_parameters, mock_os_getenv):
    publisher = RabbitMQPublisher()
    yield publisher
    publisher.close()


def test_rabbitmq_publisher_init(mock_pika_connection, mock_pika_plain_credentials, mock_pika_connection_parameters, mock_os_getenv):
    publisher = RabbitMQPublisher()

    mock_os_getenv.assert_any_call("RABBITMQ_HOST")
    mock_os_getenv.assert_any_call("RABBITMQ_PORT", 5672)
    mock_os_getenv.assert_any_call("RABBITMQ_USER")
    mock_os_getenv.assert_any_call("RABBITMQ_PASSWORD")

    mock_pika_plain_credentials.assert_called_once_with("guest", "guest")
    mock_pika_connection_parameters.assert_called_once_with(
        host="localhost", port=5672, credentials=mock_pika_plain_credentials.return_value
    )
    mock_pika_connection.assert_called_once_with(mock_pika_connection_parameters.return_value)

    mock_channel = mock_pika_connection.return_value.channel.return_value
    mock_channel.exchange_declare.assert_called_once_with(
        exchange="comment_notifications", exchange_type='fanout', durable=True
    )
    publisher.close()


def test_publish_comment(rabbitmq_publisher):
    mock_channel = rabbitmq_publisher.connection.channel.return_value
    mock_basic_properties = MagicMock()
    with patch('pika.BasicProperties', return_value=mock_basic_properties) as mock_props_class:
        comment_data = {"author_name": "Test User", "message": "Test message", "is_public": True}
        rabbitmq_publisher.publish_comment(comment_data)

        expected_body = json.dumps(comment_data).encode()
        mock_channel.basic_publish.assert_called_once_with(
            exchange="comment_notifications",
            routing_key="",
            body=expected_body,
            properties=mock_basic_properties
        )
        mock_props_class.assert_called_once_with(content_type="application/json")


def test_close(rabbitmq_publisher):
    rabbitmq_publisher.close()
    rabbitmq_publisher.connection.close.assert_called_once()
