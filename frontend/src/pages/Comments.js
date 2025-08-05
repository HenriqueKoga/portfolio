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
    <div className="container mt-5">
      <h2 className="text-center mb-4" style={{ color: '#343a40' }}>Comentários</h2>

      <div className="card shadow-sm mb-5" style={{ borderRadius: '10px' }}>
        <div className="card-body">
          <h3 className="card-title mb-3" style={{ color: '#007bff' }}>Postar Novo Comentário</h3>
          <form onSubmit={handlePostComment}>
            <div className="mb-3">
              <label htmlFor="commentMessage" className="form-label">Mensagem</label>
              <textarea
                className="form-control"
                id="commentMessage"
                rows="3"
                value={newCommentMessage}
                onChange={(e) => setNewCommentMessage(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="mb-3 form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                id="commentIsPublic"
                checked={newCommentIsPublic}
                onChange={(e) => setNewCommentIsPublic(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="commentIsPublic">Comentário Público</label>
            </div>
            <button type="submit" className="btn btn-primary w-100">Postar Comentário</button>
          </form>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <h3 className="mb-3" style={{ color: '#343a40' }}>Comentários Públicos</h3>
          {publicComments.length > 0 ? (
            <ul className="list-group shadow-sm" style={{ borderRadius: '10px' }}>
              {publicComments.map(comment => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={comment.id}>
                  <div>
                    <strong>{comment.user_name}:</strong> {comment.message}
                  </div>
                  <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="alert alert-info text-center" role="alert">
              Nenhum comentário público encontrado.
            </div>
          )}
        </div>
        <div className="col-md-6">
          <h3 className="mb-3" style={{ color: '#343a40' }}>Meus Comentários</h3>
          {myComments.length > 0 ? (
            <ul className="list-group shadow-sm" style={{ borderRadius: '10px' }}>
              {myComments.map(comment => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={comment.id}>
                  <div>
                    <strong>{comment.user_name} ({comment.is_public ? 'Público' : 'Privado'}):</strong> {comment.message}
                  </div>
                  <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="alert alert-info text-center" role="alert">
              Nenhum comentário seu encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
