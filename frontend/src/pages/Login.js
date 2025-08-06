import React from 'react';
import './Login.css';

const Login = () => {
  const handleLogin = (provider) => {
    window.location.href = `http://localhost/api/login/${provider}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo-portfolio.png" alt="Portfolio Logo" className="logo-image" />
        </div>
        <h2>Login</h2>
        <div>
          <button className="login-button google" onClick={() => handleLogin('google')}>Login with Google</button>
          <button className="login-button github" onClick={() => handleLogin('github')}>Login with GitHub</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
