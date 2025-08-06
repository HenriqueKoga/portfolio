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
	t.Run("should create notification service with email sender", func(t *testing.T) {
		mockEmailSender := new(MockEmailSender)
		service := application.NewNotificationService(mockEmailSender)

		assert.NotNil(t, service)
	})

	t.Run("should handle nil email sender gracefully", func(t *testing.T) {
		service := application.NewNotificationService(nil)
		assert.NotNil(t, service)
	})
}

func TestProcessNotification(t *testing.T) {
	testCases := []struct {
		name           string
		commentMessage domain.CommentMessage
		sendError      error
		expectedError  error
	}{
		{
			name: "Successful notification processing for public comment",
			commentMessage: domain.CommentMessage{
				AuthorName: "Test User",
				Message:    "This is a test comment.",
				IsPublic:   true,
			},
			sendError:     nil,
			expectedError: nil,
		},
		{
			name: "Successful notification processing for private comment",
			commentMessage: domain.CommentMessage{
				AuthorName: "Private User",
				Message:    "This is a private comment.",
				IsPublic:   false,
			},
			sendError:     nil,
			expectedError: nil,
		},
		{
			name: "Notification processing with email send error",
			commentMessage: domain.CommentMessage{
				AuthorName: "Error User",
				Message:    "This comment should cause an error.",
				IsPublic:   false,
			},
			sendError:     fmt.Errorf("failed to send email"),
			expectedError: fmt.Errorf("failed to send email"),
		},
		{
			name: "Handle empty author name",
			commentMessage: domain.CommentMessage{
				AuthorName: "",
				Message:    "Comment with no author",
				IsPublic:   true,
			},
			sendError:     nil,
			expectedError: nil,
		},
		{
			name: "Handle empty message",
			commentMessage: domain.CommentMessage{
				AuthorName: "User with no message",
				Message:    "",
				IsPublic:   true,
			},
			sendError:     nil,
			expectedError: nil,
		},
		{
			name: "Handle special characters in message",
			commentMessage: domain.CommentMessage{
				AuthorName: "João Silva",
				Message:    "Mensagem com acentos e símbolos: áéíóú çñü @#$%",
				IsPublic:   true,
			},
			sendError:     nil,
			expectedError: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockEmailSender := new(MockEmailSender)
			service := application.NewNotificationService(mockEmailSender)

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

func TestProcessNotificationEdgeCases(t *testing.T) {
	t.Run("should handle long messages", func(t *testing.T) {
		mockEmailSender := new(MockEmailSender)
		service := application.NewNotificationService(mockEmailSender)

		longMessage := "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."

		commentMessage := domain.CommentMessage{
			AuthorName: "Long Message User",
			Message:    longMessage,
			IsPublic:   true,
		}

		expectedSubject := fmt.Sprintf("Novo comentário de %s", commentMessage.AuthorName)
		expectedBody := fmt.Sprintf("Mensagem: %s\nPúblico: %t", commentMessage.Message, commentMessage.IsPublic)

		mockEmailSender.On("Send", expectedSubject, expectedBody).Return(nil).Once()

		err := service.ProcessNotification(commentMessage)

		assert.NoError(t, err)
		mockEmailSender.AssertExpectations(t)
	})

	t.Run("should format email correctly for different visibility", func(t *testing.T) {
		mockEmailSender := new(MockEmailSender)
		service := application.NewNotificationService(mockEmailSender)

		publicMessage := domain.CommentMessage{
			AuthorName: "Public User",
			Message:    "Public message",
			IsPublic:   true,
		}

		privateMessage := domain.CommentMessage{
			AuthorName: "Private User",
			Message:    "Private message",
			IsPublic:   false,
		}

		// Test public message
		mockEmailSender.On("Send", "Novo comentário de Public User", "Mensagem: Public message\nPúblico: true").Return(nil).Once()
		err := service.ProcessNotification(publicMessage)
		assert.NoError(t, err)

		// Test private message
		mockEmailSender.On("Send", "Novo comentário de Private User", "Mensagem: Private message\nPúblico: false").Return(nil).Once()
		err = service.ProcessNotification(privateMessage)
		assert.NoError(t, err)

		mockEmailSender.AssertExpectations(t)
	})
}
