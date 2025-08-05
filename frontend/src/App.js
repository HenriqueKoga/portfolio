import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Comments from './pages/Comments';
import AuthCallback from './pages/AuthCallback'; // Importa o novo componente
import NavigationBar from './components/NavigationBar'; // Importa o NavigationBar

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const currentPath = window.location.pathname;
  const showNavBar = currentPath !== '/login' && currentPath !== '/auth/callback';
  return (
    <Router>
      {showNavBar && <NavigationBar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/comments" element={<PrivateRoute><Comments /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;