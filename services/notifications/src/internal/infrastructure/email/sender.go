package email

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(subject, body string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("EMAIL_FROM")
	to := os.Getenv("EMAIL_TO")

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	msg := []byte(fmt.Sprintf("Subject: %s\n\n%s", subject, body))

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		return err
	}

	fmt.Println("[EMAIL] Email enviado com sucesso.")
	return nil
}
