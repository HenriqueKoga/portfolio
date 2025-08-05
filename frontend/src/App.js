import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Comments from './pages/Comments';
import AuthCallback from './pages/AuthCallback'; // Importa o novo componente
import 'bootstrap/dist/css/bootstrap.min.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} /> {/* Nova rota para o callback */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route path="projects" element={<Projects />} />
          <Route path="comments" element={<Comments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;