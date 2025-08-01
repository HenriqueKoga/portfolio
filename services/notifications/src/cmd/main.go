package main

import (
	"fmt"
	"log"
	"net/http"
	"notifications/internal/application"
	"notifications/internal/domain"
	"notifications/internal/infrastructure/email"
	"notifications/internal/infrastructure/rabbitmq"
	"notifications/internal/infrastructure/vault"
)

func runApp(vaultLoader vault.VaultLoader, emailSender domain.EmailSender, notificationService domain.NotificationService, consumer domain.MessageConsumer) error {
	fmt.Println("[NOTIFY] Iniciando serviço...")

	err := vaultLoader.LoadSecrets(http.DefaultClient)
	if err != nil {
		return fmt.Errorf("[VAULT] Falha ao carregar secrets: %w", err)
	}

	err = consumer.ConsumeMessages(func(msg domain.CommentMessage) {
		err := notificationService.ProcessNotification(msg)
		if err != nil {
			fmt.Println("[NOTIFICATION] Erro ao processar notificação:", err)
		}
	}, make(chan struct{}))

	if err != nil {
		return fmt.Errorf("[RABBITMQ] Falha no consumer: %w", err)
	}
	return nil
}

func main() {
	emailSender := email.NewEmailSender()
	service := application.NewNotificationService(emailSender)
	consumer := rabbitmq.NewRabbitMQConsumer()

	if err := runApp(&vault.RealVaultLoader{}, emailSender, service, consumer); err != nil {
		log.Fatalf("Erro na aplicação: %v", err)
	}
}
