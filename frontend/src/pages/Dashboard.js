import React from 'react';
import { Outlet } from 'react-router-dom';
import Banner from '../components/Banner';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="page-content-container">
      <Banner />
      <div className="summary-card">
        <h2>Resumo Profissional</h2>
        <p>Olá! Sou Henrique Koga, engenheiro de software com experiência em desenvolvimento full-stack e arquitetura de sistemas distribuídos.</p>
        <p>Mais de 7 anos atuando com desenvolvimento de aplicações web, APIs REST e microsserviços.<br />
          Especialista em Python, Go, JavaScript, TypeScript, React, FastAPI, Express.js e Docker.<br />
          Experiência em DevOps, CI/CD, automação de testes, monitoramento e deploy em cloud (AWS, GCP).<br />
          Forte atuação em projetos de alta escalabilidade, segurança, integração entre sistemas e cultura ágil.<br />
          Mentor de equipes, promovendo boas práticas, code review e evolução técnica.</p>
        <p>Busco sempre aprender novas tecnologias, contribuir com soluções inovadoras e entregar valor real ao negócio.</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <strong>LinkedIn:</strong><br />
            <a href="https://www.linkedin.com/in/henrique-koga" target="_blank" rel="noopener noreferrer">linkedin.com/in/henrique-koga</a>
          </div>
          <div>
            <strong>GitHub deste projeto:</strong><br />
            <a href="https://github.com/HenriqueKoga/portfolio" target="_blank" rel="noopener noreferrer">github.com/HenriqueKoga/portfolio</a>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default Dashboard;