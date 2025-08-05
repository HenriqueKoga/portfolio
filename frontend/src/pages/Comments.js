import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const Comments = () => {
  const [publicComments, setPublicComments] = useState([]);
  const [myComments, setMyComments] = useState([]);
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

  useEffect(() => {
    fetchComments();
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

  return (
    <div className="page-content-container">
      <div className="summary-card">
        <h2 className="comments-header">Comentários</h2>

        <div className="post-comment-card">
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

        <div className="comment-section">
          <div className="comment-list-section">
            <h3>Comentários Públicos</h3>
            {publicComments.length > 0 ? (
              <ul className="comment-list">
                {publicComments.map(comment => (
                  <li className="comment-item" key={comment.id}>
                    <div>
                      <strong>{comment.user_name}:</strong> {comment.message}
                    </div>
                    <small>{new Date(comment.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-comments-message">
                Nenhum comentário público encontrado.
              </div>
            )}
          </div>
          <div className="comment-list-section">
            <h3>Meus Comentários</h3>
            {myComments.length > 0 ? (
              <ul className="comment-list">
                {myComments.map(comment => (
                  <li className="comment-item" key={comment.id}>
                    <div>
                      <strong>{comment.user_name} ({comment.is_public ? 'Público' : 'Privado'}):</strong> {comment.message}
                    </div>
                    <small>{new Date(comment.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-comments-message">
                Nenhum comentário seu encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;
