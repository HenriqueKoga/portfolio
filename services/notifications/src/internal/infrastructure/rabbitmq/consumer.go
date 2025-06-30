package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/streadway/amqp"
	"notifications/internal/application"
	"notifications/internal/domain"
)

// StartConsumer inicializa a conexão e começa a consumir mensagens
func StartConsumer() {
	uri := os.Getenv("RABBITMQ_URI")
	exchangeName := "comment_notifications"
	queueName := "comment_notifications_queue"

	fmt.Println("[RABBITMQ] Conectando ao RabbitMQ em:", uri)

	// Retry loop para garantir conexão
	var conn *amqp.Connection
	var err error
	for {
		conn, err = amqp.Dial(uri)
		if err == nil {
			break
		}
		fmt.Println("[RABBITMQ] RabbitMQ indisponível, tentando novamente em 5 segundos...")
		time.Sleep(5 * time.Second)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao abrir canal: %s", err)
	}
	defer ch.Close()

	// Declara o exchange (tipo fanout)
	err = ch.ExchangeDeclare(
		exchangeName,
		"fanout",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao declarar exchange: %s", err)
	}

	// Declara a fila
	q, err := ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,
	)
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao declarar fila: %s", err)
	}

	// Faz o bind da fila no exchange
	err = ch.QueueBind(
		q.Name,
		"",             // routing key vazio para fanout
		exchangeName,   // nome do exchange
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao fazer bind da fila no exchange: %s", err)
	}

	// Começa a consumir
	msgs, err := ch.Consume(
		q.Name,
		"",
		true,  // auto-ack
		false, // exclusive
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("[RABBITMQ] Falha ao consumir: %s", err)
	}

	fmt.Println("[RABBITMQ] Aguardando mensagens...")

	forever := make(chan bool)

	// Processa as mensagens recebidas
	go func() {
		for d := range msgs {
			fmt.Printf("[RABBITMQ] Mensagem recebida: %s\n", d.Body)

			var msg domain.CommentMessage
			err := json.Unmarshal(d.Body, &msg)
			if err != nil {
				fmt.Println("[RABBITMQ] Erro no parse da mensagem:", err)
				continue
			}

			application.ProcessNotification(msg)
		}
	}()

	<-forever
}
