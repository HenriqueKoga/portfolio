import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';

const Dashboard = () => {
  return (
    <div>
      <NavigationBar />
      <div className="container mt-4">
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="card-title">Resumo Profissional</h2>
            <p className="card-text">
              Olá! Sou Henrique Koga, um engenheiro de software apaixonado por criar soluções inovadoras.
              Minha experiência abrange desenvolvimento full-stack, com foco em APIs robustas e interfaces de usuário intuitivas.
              Tenho proficiência em diversas tecnologias e busco constantemente aprender e aplicar as melhores práticas do mercado.
              Você pode encontrar mais detalhes sobre minha experiência e projetos no meu LinkedIn:
              <a href="https://www.linkedin.com/in/henrique-koga" target="_blank" rel="noopener noreferrer">linkedin.com/in/henrique-koga</a>
            </p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;