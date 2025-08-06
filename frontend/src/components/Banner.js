import React from 'react';
import './Banner.css';

const Banner = () => (
    <div className="banner">
        <img src="/public/logo512.png" alt="Portfolio Banner" className="banner-img" />
        <div className="banner-text">
            <h1>Bem-vindo ao Portfolio</h1>
            <p>Seu espaço para mostrar projetos, comentários e conquistas profissionais.</p>
        </div>
    </div>
);

export default Banner;
