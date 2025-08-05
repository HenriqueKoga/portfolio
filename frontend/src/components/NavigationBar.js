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
      <Link to="/" className="navbar-brand">Portfolio</Link>
      <div className="navbar-collapse">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/projects" className="nav-link">Projects</Link>
          </li>
          <li className="nav-item">
            <Link to="/comments" className="nav-link">Comments</Link>
          </li>
          <li className="nav-item logout">
            <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;