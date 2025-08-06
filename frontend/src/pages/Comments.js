import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Comments.css';

const Comments = () => {
  const [publicComments, setPublicComments] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newCommentMessage, setNewCommentMessage] = useState('');
  const [newCommentIsPublic, setNewCommentIsPublic] = useState(true);

  const fetchComments = () => {
    console.log("Fetching public comments...");
    apiClient.get('/comments/all_public').then(response => {
      console.log("Public comments fetched successfully:", response.data);
      setPublicComments(response.data);
    }).catch(error => {
      console.error("Error fetching public comments:", error.response ? error.response.data : error.message);
    });

    console.log("Fetching my comments...");
    apiClient.get('/comments/my').then(response => {
      console.log("My comments fetched successfully:", response.data);
      setMyComments(response.data);
    }).catch(error => {
      console.error("Error fetching my comments:", error.response ? error.response.data : error.message);
    });
  };

  const checkUserAuth = () => {
    console.log("Checking user authentication...");
    apiClient.get('/auth/me').then(response => {
      console.log("User authenticated:", response.data);
      setCurrentUser(response.data);
    }).catch(error => {
      console.error("User not authenticated:", error.response ? error.response.data : error.message);
      setCurrentUser(null);
    });
  };

  useEffect(() => {
    fetchComments();
    checkUserAuth();
  }, []);

  const handlePostComment = async (e) => {
    e.preventDefault();
    console.log("Posting comment:", { message: newCommentMessage, is_public: newCommentIsPublic });
    try {
      await apiClient.post('/comments', {
        message: newCommentMessage,
        is_public: newCommentIsPublic,
      });
      console.log("Comment posted successfully.");
      setNewCommentMessage('');
      setNewCommentIsPublic(true);
      fetchComments(); // Refresh the lists of comments
    } catch (error) {
      console.error("Error posting comment:", error.response ? error.response.data : error.message);
      alert("Error posting comment. Check console for details.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Tem certeza que deseja deletar este comentário?')) {
      return;
    }

    try {
      console.log("Deleting comment:", commentId);
      await apiClient.delete(`/comments/${commentId}`);
      console.log("Comment deleted successfully");
      alert("Comment deleted successfully!");
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error.response ? error.response.data : error.message);
      alert("Error deleting comment. Check console for details. You might not be authorized.");
    }
  };

  return (
    <div className="page-content-container">
      <h2 className="comments-header">Comentários</h2>

      {/* Seção de Comentários Públicos */}
      <div className="comments-section">
        <h3 className="section-title">Comentários Públicos</h3>
        <div className="comments-grid">
          {publicComments.length > 0 ? (
            publicComments.map(comment => (
              <div className="comment-card" key={comment.id}>
                {currentUser && currentUser.id === comment.user_id && (
                  <button
                    className="delete-button-top"
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Deletar comentário"
                  >
                    ×
                  </button>
                )}
                <div className="comment-author">
                  <strong>{comment.user_name}</strong>
                </div>
                <div className="comment-message">
                  {comment.message}
                </div>
                <div className="comment-date">
                  {new Date(comment.created_at).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-comments-message">
              Nenhum comentário público encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Seção de Meus Comentários */}
      <div className="comments-section">
        <h3 className="section-title">Meus Comentários</h3>
        <div className="comments-grid">
          {myComments.length > 0 ? (
            myComments.map(comment => (
              <div className="comment-card" key={comment.id}>
                <button
                  className="delete-button-top"
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Deletar comentário"
                >
                  ×
                </button>
                <div className="comment-author">
                  <strong>{comment.user_name}</strong>
                  <span className="visibility-badge">
                    {comment.is_public ? 'Público' : 'Privado'}
                  </span>
                </div>
                <div className="comment-message">
                  {comment.message}
                </div>
                <div className="comment-date">
                  {new Date(comment.created_at).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-comments-message">
              Nenhum comentário seu encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Formulário de cadastro - Card separado */}
      <div className="comments-form-card">
        <h3>Postar Novo Comentário</h3>
        <form onSubmit={handlePostComment}>
          <div className="form-group">
            <label htmlFor="commentMessage" className="form-label">Mensagem</label>
            <textarea
              className="form-textarea"
              id="commentMessage"
              rows="3"
              value={newCommentMessage}
              onChange={(e) => setNewCommentMessage(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="form-checkbox-group">
            <input
              type="checkbox"
              className="form-checkbox-input"
              id="commentIsPublic"
              checked={newCommentIsPublic}
              onChange={(e) => setNewCommentIsPublic(e.target.checked)}
            />
            <label className="form-label" htmlFor="commentIsPublic">Comentário Público</label>
          </div>
          <button type="submit" className="submit-button">Postar Comentário</button>
        </form>
      </div>
    </div>
  );
};

export default Comments;
