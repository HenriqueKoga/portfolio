package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type EmailSender struct{}

func NewEmailSender() *EmailSender {
	return &EmailSender{}
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

	err := smtp.SendMail(addr, auth, from, []string{to}, message)
	if err != nil {
		return fmt.Errorf("falha ao enviar email: %w", err)
	}

	fmt.Println("[EMAIL] Email enviado com sucesso.")
	return nil
}
