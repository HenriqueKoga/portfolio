package domain

type CommentMessage struct {
	AuthorName string `json:"author_name"`
	Message    string `json:"message"`
	IsPublic   bool   `json:"is_public"`
}
