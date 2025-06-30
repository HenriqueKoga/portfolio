package application

import (
	"fmt"
	"notifications/internal/domain"
	"notifications/internal/infrastructure/email"
)

func ProcessNotification(msg domain.CommentMessage) {
	subject := fmt.Sprintf("Novo comentário de %s", msg.AuthorName)
	body := fmt.Sprintf("Mensagem: %s\nPúblico: %t", msg.Message, msg.IsPublic)

	err := email.SendEmail(subject, body)
	if err != nil {
		fmt.Println("[NOTIFICATION] Erro ao enviar email:", err)
	} else {
		fmt.Println("[NOTIFICATION] Notificação enviada com sucesso.")
	}
}
