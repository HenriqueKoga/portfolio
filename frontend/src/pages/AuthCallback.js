import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthCallback.css';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback component mounted.');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');

    console.log('Token from URL:', token);
    console.log('RefreshToken from URL:', refreshToken);

    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="auth-callback-container">
      <p>Processando autenticação...</p>
      {/* Você pode adicionar um spinner ou mensagem de carregamento aqui */}
    </div>
  );
};

export default AuthCallback;