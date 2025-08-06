package domain_test

import (
	"notifications/internal/domain"
	"testing"
)

func TestCommentMessage(t *testing.T) {
	t.Run("should create comment message with all fields", func(t *testing.T) {
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
	})

	t.Run("should create private comment message", func(t *testing.T) {
		msg := domain.CommentMessage{
			AuthorName: "Private Author",
			Message:    "Private Message",
			IsPublic:   false,
		}

		if msg.IsPublic {
			t.Errorf("Expected IsPublic to be false, got %t", msg.IsPublic)
		}
	})

	t.Run("should handle empty values", func(t *testing.T) {
		msg := domain.CommentMessage{
			AuthorName: "",
			Message:    "",
			IsPublic:   false,
		}

		if msg.AuthorName != "" {
			t.Errorf("Expected AuthorName to be empty, got %s", msg.AuthorName)
		}

		if msg.Message != "" {
			t.Errorf("Expected Message to be empty, got %s", msg.Message)
		}

		if msg.IsPublic {
			t.Errorf("Expected IsPublic to be false, got %t", msg.IsPublic)
		}
	})

	t.Run("should handle long messages", func(t *testing.T) {
		longMessage := "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."

		msg := domain.CommentMessage{
			AuthorName: "Long Message Author",
			Message:    longMessage,
			IsPublic:   true,
		}

		if msg.Message != longMessage {
			t.Errorf("Expected Message to be preserved for long text")
		}
	})

	t.Run("should handle special characters in author name", func(t *testing.T) {
		specialAuthor := "João Silva & García-López"

		msg := domain.CommentMessage{
			AuthorName: specialAuthor,
			Message:    "Test with special chars",
			IsPublic:   true,
		}

		if msg.AuthorName != specialAuthor {
			t.Errorf("Expected AuthorName to preserve special characters, got %s", msg.AuthorName)
		}
	})
}
