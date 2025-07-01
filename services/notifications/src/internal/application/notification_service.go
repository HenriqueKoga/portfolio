package application

import (
	"fmt"
	"notifications/internal/domain"
)

type NotificationService struct {
	emailSender domain.EmailSender
}

func NewNotificationService(emailSender domain.EmailSender) *NotificationService {
	return &NotificationService{
		emailSender: emailSender,
	}
}

func (n *NotificationService) ProcessNotification(msg domain.CommentMessage) error {
	subject := fmt.Sprintf("Novo comentário de %s", msg.AuthorName)
	body := fmt.Sprintf("Mensagem: %s\nPúblico: %t", msg.Message, msg.IsPublic)

	return n.emailSender.Send(subject, body)
}
