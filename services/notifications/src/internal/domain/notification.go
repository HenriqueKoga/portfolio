package domain

type CommentMessage struct {
	AuthorName string `json:"author_name"`
	Message    string `json:"message"`
	IsPublic   bool   `json:"is_public"`
}

type NotificationService interface {
	ProcessNotification(msg CommentMessage) error
}

type EmailSender interface {
	Send(subject string, body string) error
}

type MessageConsumer interface {
	ConsumeMessages(handler func(CommentMessage)) error
}
