import React from 'react';
import { Link } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/logo-portfolio.png" alt="Logo Portfolio" className="navbar-logo" /> Portfolio
      </Link>
      <div className="navbar-collapse">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/projects" className="nav-link">Projetos</Link>
          </li>
          <li className="nav-item">
            <Link to="/comments" className="nav-link">Comentários</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-logout">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span role="img" aria-label="logout" style={{ marginRight: '0.5rem' }}>🔒</span>Logout
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;