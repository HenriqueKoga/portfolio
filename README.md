# Portfolio

Este projeto é um portfólio profissional desenvolvido com arquitetura de microserviços, demonstrando competências em diversas linguagens, bancos de dados, mensageria, autenticação e segurança.

🔥 Funcionalidades
✅ Login via Google e GitHub (OAuth2)
✅ Página inicial com informações profissionais
✅ Sessão de comentários públicos e privados
✅ Sessão de projetos desenvolvidos com suas stacks
✅ Sessão de contato
✅ Notificações por e-mail quando novos comentários são publicados
✅ Gestão de segredos com HashiCorp Vault
✅ Comunicação entre serviços via RabbitMQ
✅ APIs seguras com JWT
✅ Separação de contexto usando DDD, Clean Architecture e Design Patterns
✅ Containers Docker e Docker Compose

| Serviço             | Linguagem | Stack                     | Banco                    | Outras Tecnologias  |
| ------------------- | --------- | ------------------------- | ------------------------ | ------------------- |
| **Login Service**   | Node.js   | Express, Passport.js, JWT | MongoDB                  | OAuth2, Vault       |
| **Comment Service** | Python    | FastAPI, SQLAlchemy, JWT  | MongoDB                  | RabbitMQ, Vault     |
| **Project Service** | Python    | FastAPI, SQLAlchemy, JWT  | MongoDB                  | Vault               |
| **Notify Service**  | Go        | RabbitMQ, SMTP            | -                        | Vault, Email (SMTP) |
| **Infraestrutura**  | Docker    | Docker Compose            | RabbitMQ, MongoDB, MySQL | Vault               |

## Tecnologias

🔷 Node.js (Login) → Forte ecossistema para autenticação OAuth e JWT.
🐍 Python (Comentários e Projetos) → Facilidade em APIs com FastAPI, tipagem forte, SQLAlchemy para SQL e integração simples com MongoDB.
🦫 Golang (Notificações) → Eficiência, concorrência e robustez para processamento assíncrono, como consumidores de filas.
🔗 RabbitMQ → Mensageria robusta e eficiente para desacoplamento entre os serviços.
🗄️ MongoDB → Modelagem flexível para dados de autenticação, comentários e projetos.
🔐 Vault → Gestão segura de segredos, credenciais e configuração sensível.
🐳 Docker & Docker Compose → Padronização de ambientes, isolamento e facilidade de deploy.
🧠 DDD + Clean Code + Design Patterns → Escalabilidade, organização e manutenção facilitada.
