package email_test

import (
	"fmt"
	"net/smtp"
	"notifications/internal/infrastructure/email"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockSMTPClient is a mock implementation of the email.SMTPClient interface.
type MockSMTPClient struct {
	mock.Mock
}

// SendMail mocks the SendMail method of the SMTPClient interface.
func (m *MockSMTPClient) SendMail(addr string, a smtp.Auth, from string, to []string, msg []byte) error {
	args := m.Called(addr, a, from, to, msg)
	return args.Error(0)
}

// smtpAuth is a dummy implementation of smtp.Auth for mocking purposes.
type smtpAuth struct{}

func (a smtpAuth) Start(server *smtp.ServerInfo) (string, []byte, error) { return "", nil, nil }
func (a smtpAuth) Next(fromServer []byte, more bool) ([]byte, error) { return nil, nil }

func TestNewEmailSender(t *testing.T) {
	sender := email.NewEmailSender()
	assert.NotNil(t, sender)
}

func TestSend_Success(t *testing.T) {
	// Save original environment variables and restore them after the test
	originalSmtpHost := os.Getenv("SMTP_HOST")
	originalSmtpPort := os.Getenv("SMTP_PORT")
	originalSmtpUser := os.Getenv("SMTP_USER")
	originalSmtpPass := os.Getenv("SMTP_PASSWORD")
	originalEmailFrom := os.Getenv("EMAIL_FROM")
	originalEmailTo := os.Getenv("EMAIL_TO")

	defer func() {
		os.Setenv("SMTP_HOST", originalSmtpHost)
		os.Setenv("SMTP_PORT", originalSmtpPort)
		os.Setenv("SMTP_USER", originalSmtpUser)
		os.Setenv("SMTP_PASSWORD", originalSmtpPass)
		os.Setenv("EMAIL_FROM", originalEmailFrom)
		os.Setenv("EMAIL_TO", originalEmailTo)
	}()

	// Set up mock environment variables
	os.Setenv("SMTP_HOST", "smtp.example.com")
	os.Setenv("SMTP_PORT", "587")
	os.Setenv("SMTP_USER", "user@example.com")
	os.Setenv("SMTP_PASSWORD", "password")
	os.Setenv("EMAIL_FROM", "from@example.com")
	os.Setenv("EMAIL_TO", "to@example.com")

	mockSMTPClient := new(MockSMTPClient)
	sender := email.NewEmailSenderWithClient(mockSMTPClient)

	subject := "Test Subject"
	body := "Test Body"

	expectedAddr := "smtp.example.com:587"
	expectedFrom := "from@example.com"
	expectedTo := []string{"to@example.com"}
	expectedMsg := []byte(fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\n\n%s", expectedFrom, expectedTo[0], subject, body))

	mockSMTPClient.On("SendMail", expectedAddr, mock.Anything, expectedFrom, expectedTo, expectedMsg).Return(nil).Once()

	err := sender.Send(subject, body)
	assert.NoError(t, err)
	mockSMTPClient.AssertExpectations(t)
}

func TestSend_Error(t *testing.T) {
	// Save original environment variables and restore them after the test
	originalSmtpHost := os.Getenv("SMTP_HOST")
	originalSmtpPort := os.Getenv("SMTP_PORT")
	originalSmtpUser := os.Getenv("SMTP_USER")
	originalSmtpPass := os.Getenv("SMTP_PASSWORD")
	originalEmailFrom := os.Getenv("EMAIL_FROM")
	originalEmailTo := os.Getenv("EMAIL_TO")

	defer func() {
		os.Setenv("SMTP_HOST", originalSmtpHost)
		os.Setenv("SMTP_PORT", originalSmtpPort)
		os.Setenv("SMTP_USER", originalSmtpUser)
		os.Setenv("SMTP_PASSWORD", originalSmtpPass)
		os.Setenv("EMAIL_FROM", originalEmailFrom)
		os.Setenv("EMAIL_TO", originalEmailTo)
	}()

	// Set up mock environment variables
	os.Setenv("SMTP_HOST", "smtp.example.com")
	os.Setenv("SMTP_PORT", "587")
	os.Setenv("SMTP_USER", "user@example.com")
	os.Setenv("SMTP_PASSWORD", "password")
	os.Setenv("EMAIL_FROM", "from@example.com")
	os.Setenv("EMAIL_TO", "to@example.com")

	mockSMTPClient := new(MockSMTPClient)
	sender := email.NewEmailSenderWithClient(mockSMTPClient)

	subject := "Test Subject"
	body := "Test Body"

	mockSMTPClient.On("SendMail", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(fmt.Errorf("mock send error")).Once()

	err := sender.Send(subject, body)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "falha ao enviar email: mock send error")
	mockSMTPClient.AssertExpectations(t)
}