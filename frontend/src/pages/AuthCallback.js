import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback component mounted.');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('Token from URL:', token);

    if (token) {
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage.');
      console.log('localStorage token:', localStorage.getItem('token'));
      navigate('/', { replace: true });
      console.log('Redirecting to home page.');
    } else {
      console.log('No token found in URL. Redirecting to login.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <p>Processando autenticação...</p>
      {/* Você pode adicionar um spinner ou mensagem de carregamento aqui */}
    </div>
  );
};

export default AuthCallback;