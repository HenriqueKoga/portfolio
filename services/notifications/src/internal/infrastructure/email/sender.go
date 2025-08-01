package email

import (
	"fmt"
	"net/smtp"
	"os"
)

// SMTPClient defines the interface for sending emails.
type SMTPClient interface {
	SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error
}

// RealSMTPClient is a concrete implementation of SMTPClient that uses net/smtp.
type RealSMTPClient struct{}

// SendMail implements the SMTPClient interface for real email sending.
func (r *RealSMTPClient) SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error {
	return smtp.SendMail(addr, a, from, to, msg)
}

type EmailSender struct{
	smtpClient SMTPClient
}

func NewEmailSender() *EmailSender {
	return &EmailSender{
		smtpClient: &RealSMTPClient{}, // Use the real SMTP client by default
	}
}

// NewEmailSenderWithClient is for dependency injection in tests.
func NewEmailSenderWithClient(client SMTPClient) *EmailSender {
	return &EmailSender{
		smtpClient: client,
	}
}

func (e *EmailSender) Send(subject string, body string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("EMAIL_FROM")
	to := os.Getenv("EMAIL_TO")

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	message := []byte(fmt.Sprintf(
		"From: %s\nTo: %s\nSubject: %s\n\n%s",
		from, to, subject, body,
	))

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := e.smtpClient.SendMail(addr, auth, from, []string{to}, message)
	if err != nil {
		return fmt.Errorf("falha ao enviar email: %w", err)
	}

	fmt.Println("[EMAIL] Email enviado com sucesso.")
	return nil
}