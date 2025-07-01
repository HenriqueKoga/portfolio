package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"notifications/internal/domain"

	"github.com/streadway/amqp"
)

type RabbitMQConsumer struct {
	uri          string
	exchangeName string
	queueName    string
}

func NewRabbitMQConsumer() *RabbitMQConsumer {
	return &RabbitMQConsumer{
		uri:          os.Getenv("RABBITMQ_URI"),
		exchangeName: "comment_notifications",
		queueName:    "comment_notifications_queue",
	}
}

func (c *RabbitMQConsumer) ConsumeMessages(handler func(domain.CommentMessage)) error {
	var conn *amqp.Connection
	var err error

	for {
		conn, err = amqp.Dial(c.uri)
		if err == nil {
			break
		}
		fmt.Println("[RABBITMQ] RabbitMQ indisponível, tentando novamente em 5s...")
		time.Sleep(5 * time.Second)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao abrir canal: %s", err)
	}
	defer ch.Close()

	// Exchange + Queue + Binding
	err = ch.ExchangeDeclare(c.exchangeName, "fanout", true, false, false, false, nil)
	if err != nil {
		return err
	}

	q, err := ch.QueueDeclare(c.queueName, true, false, false, false, nil)
	if err != nil {
		return err
	}

	err = ch.QueueBind(q.Name, "", c.exchangeName, false, nil)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		return err
	}

	go func() {
		for d := range msgs {
			var msg domain.CommentMessage
			err := json.Unmarshal(d.Body, &msg)
			if err != nil {
				fmt.Println("[RABBITMQ] Erro no parse da mensagem:", err)
				continue
			}
			handler(msg)
		}
	}()

	// Bloqueia o processo
	select {}
}
