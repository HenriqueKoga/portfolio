package main

import (
	"errors"
	"notifications/internal/domain"
	"notifications/internal/infrastructure/vault"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockVaultLoader is a mock implementation of the VaultLoader interface.
type MockVaultLoader struct {
	mock.Mock
}

func (m *MockVaultLoader) LoadSecrets(client vault.HTTPClient) error {
	args := m.Called(client)
	return args.Error(0)
}

// MockEmailSender is a mock implementation of the domain.EmailSender interface.
type MockEmailSender struct {
	mock.Mock
}

func (m *MockEmailSender) Send(subject string, body string) error {
	args := m.Called(subject, body)
	return args.Error(0)
}

// MockNotificationService is a mock implementation of the domain.NotificationService interface.
type MockNotificationService struct {
	mock.Mock
}

func (m *MockNotificationService) ProcessNotification(msg domain.CommentMessage) error {
	args := m.Called(msg)
	return args.Error(0)
}

// MockMessageConsumer is a mock implementation of the domain.MessageConsumer interface.
type MockMessageConsumer struct {
	mock.Mock
}

func (m *MockMessageConsumer) ConsumeMessages(handler func(domain.CommentMessage), doneChan chan struct{}) error {
	args := m.Called(handler, doneChan)
	return args.Error(0)
}

func TestRunApp_Success(t *testing.T) {
	mockVaultLoader := new(MockVaultLoader)
	mockEmailSender := new(MockEmailSender)
	mockNotificationService := new(MockNotificationService)
	mockMessageConsumer := new(MockMessageConsumer)

	mockVaultLoader.On("LoadSecrets", mock.Anything).Return(nil).Once()

	// Capture the handler function passed to ConsumeMessages
	var capturedHandler func(domain.CommentMessage)
	mockMessageConsumer.On("ConsumeMessages", mock.AnythingOfType("func(domain.CommentMessage)"), mock.Anything).Return(nil).Run(func(args mock.Arguments) {
		capturedHandler = args.Get(0).(func(domain.CommentMessage))
	}).Once()

	mockNotificationService.On("ProcessNotification", mock.Anything).Return(nil).Once()

	err := runApp(mockVaultLoader, mockEmailSender, mockNotificationService, mockMessageConsumer)
	assert.NoError(t, err)

	// Manually call the captured handler to simulate message consumption
	if capturedHandler != nil {
		capturedHandler(domain.CommentMessage{AuthorName: "test", Message: "test", IsPublic: true})
	}

	mockVaultLoader.AssertExpectations(t)
	mockMessageConsumer.AssertExpectations(t)
	mockNotificationService.AssertExpectations(t)
}

func TestRunApp_VaultLoadSecretsError(t *testing.T) {
	mockVaultLoader := new(MockVaultLoader)
	mockEmailSender := new(MockEmailSender)
	mockNotificationService := new(MockNotificationService)
	mockMessageConsumer := new(MockMessageConsumer)

	mockVaultLoader.On("LoadSecrets", mock.Anything).Return(errors.New("vault error")).Once()

	err := runApp(mockVaultLoader, mockEmailSender, mockNotificationService, mockMessageConsumer)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "vault error")

	mockVaultLoader.AssertExpectations(t)
	mockMessageConsumer.AssertNotCalled(t, "ConsumeMessages", mock.Anything, mock.Anything)
	mockNotificationService.AssertNotCalled(t, "ProcessNotification", mock.Anything)
}

func TestRunApp_ConsumeMessagesError(t *testing.T) {
	mockVaultLoader := new(MockVaultLoader)
	mockEmailSender := new(MockEmailSender)
	mockNotificationService := new(MockNotificationService)
	mockMessageConsumer := new(MockMessageConsumer)

	mockVaultLoader.On("LoadSecrets", mock.Anything).Return(nil).Once()
	mockMessageConsumer.On("ConsumeMessages", mock.Anything, mock.Anything).Return(errors.New("consumer error")).Once()

	err := runApp(mockVaultLoader, mockEmailSender, mockNotificationService, mockMessageConsumer)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "consumer error")

	mockVaultLoader.AssertExpectations(t)
	mockMessageConsumer.AssertExpectations(t)
	mockNotificationService.AssertNotCalled(t, "ProcessNotification", mock.Anything)
}

func TestRunApp_ProcessNotificationError(t *testing.T) {
	mockVaultLoader := new(MockVaultLoader)
	mockEmailSender := new(MockEmailSender)
	mockNotificationService := new(MockNotificationService)
	mockMessageConsumer := new(MockMessageConsumer)

	mockVaultLoader.On("LoadSecrets", mock.Anything).Return(nil).Once()

	var capturedHandler func(domain.CommentMessage)
	mockMessageConsumer.On("ConsumeMessages", mock.AnythingOfType("func(domain.CommentMessage)"), mock.Anything).Return(nil).Run(func(args mock.Arguments) {
		capturedHandler = args.Get(0).(func(domain.CommentMessage))
	}).Once()

	mockNotificationService.On("ProcessNotification", mock.Anything).Return(errors.New("notification error")).Once()

	err := runApp(mockVaultLoader, mockEmailSender, mockNotificationService, mockMessageConsumer)
	assert.NoError(t, err)

	if capturedHandler != nil {
		capturedHandler(domain.CommentMessage{AuthorName: "test", Message: "test", IsPublic: true})
	}

	mockVaultLoader.AssertExpectations(t)
	mockMessageConsumer.AssertExpectations(t)
	mockNotificationService.AssertExpectations(t)
}
