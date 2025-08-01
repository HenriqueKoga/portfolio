package application_test

import (
	"fmt"
	"notifications/internal/application"
	"notifications/internal/domain"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockEmailSender is a mock implementation of the domain.EmailSender interface.
type MockEmailSender struct {
	mock.Mock
}

// Send mocks the Send method of the EmailSender interface.
func (m *MockEmailSender) Send(subject string, body string) error {
	args := m.Called(subject, body)
	return args.Error(0)
}

func TestNewNotificationService(t *testing.T) {
	mockEmailSender := new(MockEmailSender)
	service := application.NewNotificationService(mockEmailSender)

	assert.NotNil(t, service)
	// You might want to assert that the internal emailSender is set,
	// but it's not directly exposed, so testing behavior is better.
}

func TestProcessNotification(t *testing.T) {
	mockEmailSender := new(MockEmailSender)
	service := application.NewNotificationService(mockEmailSender)

	testCases := []struct {
		name          string
		commentMessage domain.CommentMessage
		sendError     error
		expectedError error
	}{
		{
			name: "Successful notification processing",
			commentMessage: domain.CommentMessage{
				AuthorName: "Test User",
				Message:    "This is a test comment.",
				IsPublic:   true,
			},
			sendError:     nil,
			expectedError: nil,
		},
		{
			name: "Notification processing with email send error",
			commentMessage: domain.CommentMessage{
				AuthorName: "Error User",
				Message:    "This comment should cause an error.",				IsPublic:   false,
			},
			sendError:     fmt.Errorf("failed to send email"),
			expectedError: fmt.Errorf("failed to send email"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			expectedSubject := fmt.Sprintf("Novo comentário de %s", tc.commentMessage.AuthorName)
			expectedBody := fmt.Sprintf("Mensagem: %s\nPúblico: %t", tc.commentMessage.Message, tc.commentMessage.IsPublic)

			mockEmailSender.On("Send", expectedSubject, expectedBody).Return(tc.sendError).Once()

			err := service.ProcessNotification(tc.commentMessage)

			if tc.expectedError != nil {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectedError.Error())
			} else {
				assert.NoError(t, err)
			}

			mockEmailSender.AssertExpectations(t)
		})
	}
}
