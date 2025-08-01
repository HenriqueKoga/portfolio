package rabbitmq

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"notifications/internal/domain"

	"github.com/streadway/amqp"
)

// AMQPConnection interface for amqp.Connection
type AMQPConnection interface {
	Channel() (AMQPChannel, error)
	Close() error
}

// AMQPChannel interface for amqp.Channel
type AMQPChannel interface {
	ExchangeDeclare(name, kind string, durable, autoDelete, internal, noWait bool, args amqp.Table) error
	QueueDeclare(name string, durable, autoDelete, exclusive, noWait bool, args amqp.Table) (amqp.Queue, error)
	QueueBind(name, key, exchange string, noWait bool, args amqp.Table) error
	Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error)
	Close() error
}

// RealAMQPConnection implements AMQPConnection for actual amqp.Connection
type RealAMQPConnection struct {
	*amqp.Connection
}

func (r *RealAMQPConnection) Channel() (AMQPChannel, error) {
	ch, err := r.Connection.Channel()
	if err != nil {
		return nil, err
	}
		return &RealAMQPChannel{ch}, nil
}

// RealAMQPChannel implements AMQPChannel for actual amqp.Channel
type RealAMQPChannel struct {
	*amqp.Channel
}

type RabbitMQConsumer struct {
	uri          string
	exchangeName string
	queueName    string
	connFactory  func(string) (AMQPConnection, error)
	retryDelay   time.Duration
	maxRetries   int
}

func NewRabbitMQConsumer() *RabbitMQConsumer {
	return &RabbitMQConsumer{
		uri:          os.Getenv("RABBITMQ_URI"),
		exchangeName: "comment_notifications",
		queueName:    "comment_notifications_queue",
		connFactory: func(uri string) (AMQPConnection, error) {
			conn, err := amqp.Dial(uri)
			if err != nil {
				return nil, err
			}
			return &RealAMQPConnection{Connection: conn}, nil
		},
		retryDelay: 5 * time.Second,
		maxRetries: 10,
	}
}

// NewRabbitMQConsumerWithFactory is for dependency injection in tests.
func NewRabbitMQConsumerWithFactory(connFactory func(string) (AMQPConnection, error), retryDelay time.Duration, maxRetries int) *RabbitMQConsumer {
	return &RabbitMQConsumer{
		uri:          os.Getenv("RABBITMQ_URI"),
		exchangeName: "comment_notifications",
		queueName:    "comment_notifications_queue",
		connFactory: connFactory,
		retryDelay: retryDelay,
		maxRetries: maxRetries,
	}
}

func (c *RabbitMQConsumer) ConsumeMessages(handler func(domain.CommentMessage), doneChan chan struct{}) error {
	var conn AMQPConnection
	var err error

	for i := 0; i < c.maxRetries; i++ {
		conn, err = c.connFactory(c.uri)
		if err == nil {
			break
		}
		fmt.Println("[RABBITMQ] RabbitMQ indisponível, tentando novamente em", c.retryDelay)
		time.Sleep(c.retryDelay)
	}

	if err != nil {
		return fmt.Errorf("[RABBITMQ] Falha ao conectar ao RabbitMQ após %d tentativas: %w", c.maxRetries, err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("[RABBITMQ] Falha ao abrir canal: %w", err)
	}

	// Exchange + Queue + Binding
	err = ch.ExchangeDeclare(c.exchangeName, "fanout", true, false, false, false, nil)
	if err != nil {
		ch.Close()
		conn.Close()
		return err
	}

	q, err := ch.QueueDeclare(c.queueName, true, false, false, false, nil)
	if err != nil {
		ch.Close()
		conn.Close()
		return err
	}

	err = ch.QueueBind(q.Name, "", c.exchangeName, false, nil)
	if err != nil {
		ch.Close()
		conn.Close()
		return err
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		ch.Close()
		conn.Close()
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
		ch.Close()
		conn.Close()
	}()

	<-doneChan
	return nil
}