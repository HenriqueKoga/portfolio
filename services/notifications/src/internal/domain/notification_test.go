package domain_test

import (
	"notifications/internal/domain"
	"testing"
)

func TestCommentMessage(t *testing.T) {
	msg := domain.CommentMessage{
		AuthorName: "Test Author",
		Message:    "Test Message",
		IsPublic:   true,
	}

	if msg.AuthorName != "Test Author" {
		t.Errorf("Expected AuthorName to be 'Test Author', got %s", msg.AuthorName)
	}

	if msg.Message != "Test Message" {
		t.Errorf("Expected Message to be 'Test Message', got %s", msg.Message)
	}

	if !msg.IsPublic {
		t.Errorf("Expected IsPublic to be true, got %t", msg.IsPublic)
	}
}
