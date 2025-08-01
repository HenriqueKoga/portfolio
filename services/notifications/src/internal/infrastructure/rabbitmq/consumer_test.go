package rabbitmq_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"notifications/internal/domain"
	"notifications/internal/infrastructure/rabbitmq"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/streadway/amqp"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAMQPConnection is a mock for amqp.Connection
type MockAMQPConnection struct {
	mock.Mock
}

func (m *MockAMQPConnection) Channel() (rabbitmq.AMQPChannel, error) {
	args := m.Called()
	return args.Get(0).(rabbitmq.AMQPChannel), args.Error(1)
}

func (m *MockAMQPConnection) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockAMQPChannel is a mock for amqp.Channel
type MockAMQPChannel struct {
	mock.Mock
	wg *sync.WaitGroup
}

func (m *MockAMQPChannel) ExchangeDeclare(name, kind string, durable, autoDelete, internal, noWait bool, args amqp.Table) error {
	argsCalled := m.Called(name, kind, durable, autoDelete, internal, noWait, args)
	return argsCalled.Error(0)
}

func (m *MockAMQPChannel) QueueDeclare(name string, durable, autoDelete, exclusive, noWait bool, args amqp.Table) (amqp.Queue, error) {
	argsCalled := m.Called(name, durable, autoDelete, exclusive, noWait, args)
	return argsCalled.Get(0).(amqp.Queue), argsCalled.Error(1)
}

func (m *MockAMQPChannel) QueueBind(name, key, exchange string, noWait bool, args amqp.Table) error {
	argsCalled := m.Called(name, key, exchange, noWait, args)
	return argsCalled.Error(0)
}

func (m *MockAMQPChannel) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error) {
	argsCalled := m.Called(queue, consumer, autoAck, exclusive, noLocal, noWait, args)
	return argsCalled.Get(0).(<-chan amqp.Delivery), argsCalled.Error(1)
}

func (m *MockAMQPChannel) Close() error {
	defer func() {
		if m.wg != nil {
			m.wg.Done()
		}
	}()
	args := m.Called()
	return args.Error(0)
}

func TestNewRabbitMQConsumer(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)

	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")
	consumer := rabbitmq.NewRabbitMQConsumer()
	assert.NotNil(t, consumer)
}

func TestConsumeMessages_Success(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	var wg sync.WaitGroup
	mockChannel := &MockAMQPChannel{wg: &wg}
	mockChannel.Mock.Test(t)

	// Setup mock expectations
	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()

	mockChannel.On("ExchangeDeclare", "comment_notifications", "fanout", true, false, false, false, amqp.Table(nil)).Return(nil).Once()
	mockChannel.On("QueueDeclare", "comment_notifications_queue", true, false, false, false, amqp.Table(nil)).Return(amqp.Queue{Name: "comment_notifications_queue"}, nil).Once()
	mockChannel.On("QueueBind", "comment_notifications_queue", "", "comment_notifications", false, amqp.Table(nil)).Return(nil).Once()
	mockChannel.On("Close").Return(nil).Once()

	deliveries := make(chan amqp.Delivery)
	mockChannel.On("Consume", "comment_notifications_queue", "", true, false, false, false, amqp.Table(nil)).Return((<-chan amqp.Delivery)(deliveries), nil).Once()

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	expectedMsg := domain.CommentMessage{AuthorName: "Test User", Message: "Hello, RabbitMQ!", IsPublic: true}
	msgBytes, _ := json.Marshal(expectedMsg)

	var receivedMsg domain.CommentMessage
	handlerDone := make(chan struct{})
	handler := func(msg domain.CommentMessage) {
		fmt.Printf("Handler received: %+v\n", msg)
		receivedMsg = msg
		close(handlerDone)
	}

	done := make(chan struct{})
	wg.Add(1)
	go func() {
		assert.NoError(t, consumer.ConsumeMessages(handler, done))
	}()

	time.Sleep(100 * time.Millisecond)
	deliveries <- amqp.Delivery{Body: msgBytes}
	<-handlerDone

	assert.Equal(t, expectedMsg, receivedMsg)

	close(done)
	close(deliveries)
	wg.Wait()

	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_UnmarshalError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	var wg sync.WaitGroup
	mockChannel := &MockAMQPChannel{wg: &wg}
	mockChannel.Mock.Test(t)

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()
	mockChannel.On("ExchangeDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("QueueDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(amqp.Queue{}, nil).Once()
	mockChannel.On("QueueBind", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("Close").Return(nil).Once()

	deliveries := make(chan amqp.Delivery)
	mockChannel.On("Consume", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return((<-chan amqp.Delivery)(deliveries), nil).Once()

	malformedMsgBytes := []byte("invalid json")

	done := make(chan struct{})
	wg.Add(1)
	go func() {
		_ = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
	}()

	time.Sleep(100 * time.Millisecond)
	deliveries <- amqp.Delivery{Body: malformedMsgBytes}
	time.Sleep(100 * time.Millisecond)

	close(done)
	close(deliveries)
	wg.Wait()

	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_DialError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	callCount := 0
	mockConn := new(MockAMQPConnection)
	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		callCount++
		if callCount == 1 {
			return nil, errors.New("dial error")
		}
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockChannel := new(MockAMQPChannel)
	mockConn.On("Channel").Return(mockChannel, errors.New("channel error")).Once()
	mockConn.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	assert.Eventually(t, func() bool { return callCount >= 2 }, 2*time.Second, 10*time.Millisecond)

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "channel error")
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_ChannelError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(new(MockAMQPChannel), errors.New("channel error")).Once()
	mockConn.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "channel error")
	mockConn.AssertExpectations(t)
}

func TestConsumeMessages_ExchangeDeclareError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	mockChannel := new(MockAMQPChannel)

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()

	mockChannel.On("ExchangeDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("exchange declare error")).Once()
	mockChannel.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "exchange declare error")
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_QueueDeclareError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	mockChannel := new(MockAMQPChannel)

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()

	mockChannel.On("ExchangeDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("QueueDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(amqp.Queue{}, errors.New("queue declare error")).Once()
	mockChannel.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "queue declare error")
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_QueueBindError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	mockChannel := new(MockAMQPChannel)

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()

	mockChannel.On("ExchangeDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("QueueDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(amqp.Queue{}, nil).Once()
	mockChannel.On("QueueBind", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("queue bind error")).Once()
	mockChannel.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "queue bind error")
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}

func TestConsumeMessages_ConsumeError(t *testing.T) {
	originalRabbitMQURI := os.Getenv("RABBITMQ_URI")
	defer os.Setenv("RABBITMQ_URI", originalRabbitMQURI)
	os.Setenv("RABBITMQ_URI", "amqp://guest:guest@localhost:5672/")

	mockConn := new(MockAMQPConnection)
	mockChannel := new(MockAMQPChannel)

	consumer := rabbitmq.NewRabbitMQConsumerWithFactory(func(uri string) (rabbitmq.AMQPConnection, error) {
		return mockConn, nil
	}, 1*time.Millisecond, 10)

	mockConn.On("Channel").Return(mockChannel, nil).Once()
	mockConn.On("Close").Return(nil).Once()

	mockChannel.On("ExchangeDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("QueueDeclare", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(amqp.Queue{}, nil).Once()
	mockChannel.On("QueueBind", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	mockChannel.On("Consume", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return((<-chan amqp.Delivery)(nil), errors.New("consume error")).Once()
	mockChannel.On("Close").Return(nil).Once()

	done := make(chan struct{})
	var errResult error
	go func() {
		errResult = consumer.ConsumeMessages(func(msg domain.CommentMessage) {}, done)
		close(done)
	}()

	<-done

	assert.Error(t, errResult)
	assert.Contains(t, errResult.Error(), "consume error")
	mockConn.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
}
