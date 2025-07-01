package main

import (
	"fmt"
	"log"
	"notifications/internal/application"
	"notifications/internal/domain"
	"notifications/internal/infrastructure/email"
	"notifications/internal/infrastructure/rabbitmq"
	"notifications/internal/infrastructure/vault"
)

func main() {
	fmt.Println("[NOTIFY] Iniciando serviço...")

	err := vault.LoadSecrets()
	if err != nil {
		log.Fatalf("[VAULT] Falha ao carregar secrets: %s", err)
	}

	emailSender := email.NewEmailSender()
	service := application.NewNotificationService(emailSender)
	consumer := rabbitmq.NewRabbitMQConsumer()

	err = consumer.ConsumeMessages(func(msg domain.CommentMessage) {
		err := service.ProcessNotification(msg)
		if err != nil {
			fmt.Println("[NOTIFICATION] Erro ao processar notificação:", err)
		}
	})

	if err != nil {
		log.Fatalf("[RABBITMQ] Falha no consumer: %s", err)
	}
}
