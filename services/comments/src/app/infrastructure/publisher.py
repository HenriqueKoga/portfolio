import json
import logging
import os
from abc import ABC, abstractmethod

import pika

logger = logging.getLogger(__name__)


class Publisher(ABC):

    @abstractmethod
    def publish_comment(self, comment: dict): ...

    @abstractmethod
    def close(self): ...


class RabbitMQPublisher(Publisher):
    def __init__(self):
        host = os.getenv("RABBITMQ_HOST")
        port = int(os.getenv("RABBITMQ_PORT", 5672))
        user = os.getenv("RABBITMQ_USER")
        password = os.getenv("RABBITMQ_PASSWORD")

        credentials = pika.PlainCredentials(user, password)
        parameters = pika.ConnectionParameters(host=host, port=port, credentials=credentials)

        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.exchange = "comment_notifications"

        self.channel.exchange_declare(exchange=self.exchange, exchange_type='fanout', durable=True)

    def publish_comment(self, comment: dict):
        message = json.dumps(comment).encode()
        self.channel.basic_publish(
            exchange=self.exchange,
            routing_key="",
            body=message,
            properties=pika.BasicProperties(content_type="application/json")
        )
        logger.info("[RABBITMQ] Notificação publicada")

    def close(self):
        self.connection.close()
