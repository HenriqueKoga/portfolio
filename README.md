# Portfolio

Este projeto é um portfólio profissional desenvolvido com arquitetura de microserviços, demonstrando competências em diversas linguagens, bancos de dados, mensageria, autenticação e segurança.

🔥 Funcionalidades

- ✅ Login via Google e GitHub (OAuth2)
- ✅ Sessão de comentários públicos e privados
- ✅ Sessão de projetos desenvolvidos com suas stacks
- ✅ Sessão de contato
- ✅ Notificações por e-mail quando novos comentários são publicados
- ✅ Gestão de segredos com HashiCorp Vault
- ✅ Comunicação entre serviços via RabbitMQ
- ✅ APIs seguras com JWT
- ✅ Separação de contexto usando DDD, Clean Architecture e Design Patterns
- ✅ Containers Docker e Docker Compose

| Serviço             | Linguagem | Stack                     | Banco                    | Outras Tecnologias  |
| ------------------- | --------- | ------------------------- | ------------------------ | ------------------- |
| **Login Service**   | Node.js   | Express, Passport.js, JWT | MongoDB                  | OAuth2, Vault       |
| **Comment Service** | Python    | FastAPI, SQLAlchemy, JWT  | MongoDB                  | RabbitMQ, Vault     |
| **Project Service** | Python    | FastAPI, SQLAlchemy, JWT  | MongoDB                  | Vault               |
| **Notify Service**  | Go        | RabbitMQ, SMTP            | -                        | Vault, Email (SMTP) |

## Tecnologias

- 🔷 Node.js (Login) → Forte ecossistema para autenticação OAuth e JWT.
- 🐍 Python (Comentários e Projetos) → Facilidade em APIs com FastAPI, tipagem forte, SQLAlchemy para SQL e integração simples com MongoDB.
- 🦫 Golang (Notificações) → Eficiência, concorrência e robustez para processamento assíncrono, como consumidores de filas.
- 🔗 RabbitMQ → Mensageria robusta e eficiente para desacoplamento entre os serviços.
- 🗄️ MongoDB → Modelagem flexível para dados de autenticação, comentários e projetos.
- 🔐 Vault → Gestão segura de segredos, credenciais e configuração sensível.
- 🐳 Docker & Docker Compose → Padronização de ambientes, isolamento e facilidade de deploy.
- 🧠 DDD + Clean Code + Design Patterns → Escalabilidade, organização e manutenção facilitada.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto localmente.

### Pré-requisitos

Certifique-se de ter o Docker e o Docker Compose instalados em sua máquina.

- [Instalar Docker](https://docs.docker.com/get-docker/)
- [Instalar Docker Compose](https://docs.docker.com/compose/install/)

### 1. Configuração das Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configurações sensíveis e específicas do ambiente.

Crie um arquivo `.env` na raiz do projeto, copiando o exemplo fornecido:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha as seguintes variáveis:

- `VAULT_ADDR`: Endereço do servidor Vault (ex: `http://127.0.0.1:8200`).
- `VAULT_TOKEN`: Token de acesso ao Vault (para desenvolvimento, pode ser `root`).
- `REACT_APP_API_URL`
- `AUTHORIZED_USER_ID`

### 1.1. Variáveis de Ambiente por Serviço (Pasta 'envs/')

Além do arquivo `.env` na raiz do projeto, cada serviço possui um arquivo de variáveis de ambiente correspondente na pasta `envs/`. Estes arquivos contêm segredos específicos de cada serviço que serão carregados no HashiCorp Vault pelo script `setup-vault.sh`.

Você deve criar ou editar os seguintes arquivos dentro da pasta `envs/`, preenchendo-os com as variáveis de ambiente necessárias para cada serviço.

**Exemplos de arquivos em `envs/`:**

- **`envs/login-service.env`:**

    ```
    MONGO_URI=mongodb://mongo:27017/portfolio
    JWT_SECRET=your_login_jwt_secret
    SESSION_SECRET=your_login_session_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    AUTH_CALLBACK_URL=http://localhost
    ```

- **`envs/comment-service.env`:**

    ```
    MONGO_URI=mongodb://mongo:27017/portfolio
    RABBITMQ_URI=amqp://rabbitmq:5672
    JWT_SECRET=your_comment_jwt_secret
    ```

- **`envs/project-service.env`:**

    ```
    MONGO_URI=mongodb://mongo:27017/portfolio
    JWT_SECRET=your_project_jwt_secret
    ```

- **`envs/notifications-service.env`:**

    ```
    RABBITMQ_URI=amqp://rabbitmq:5672
    SMTP_HOST=your_smtp_host
    SMTP_PORT=your_smtp_port
    SMTP_USER=your_smtp_user
    SMTP_PASS=your_smtp_password
    SENDER_EMAIL=your_sender_email
    ```

Certifique-se de que todos os arquivos `.env` necessários para seus serviços estejam presentes e configurados corretamente nesta pasta antes de executar o `setup-vault.sh`.

### 2. Configuração do HashiCorp Vault

O Vault é utilizado para gerenciar segredos. Um script de setup é fornecido para inicializar e configurar o Vault com os segredos necessários para os serviços.

Primeiro, inicie apenas o serviço do Vault:

```bash
docker-compose up -d vault
```

Após o Vault estar em execução e saudável, execute o script de setup:

```bash
bash setup-vault.sh
```

Este script irá:

- Aguardar o Vault estar pronto.
- Inicializar o Vault (se não estiver inicializado).
- Deslacrar o Vault (se estiver lacrado).
- Habilitar o motor de segredos KV.
- Carregar os segredos dos arquivos `.env` localizados na pasta `envs/` para o Vault.
- Criar uma política de acesso (`app-policy`) e gerar um token com essa política.

### 3. Executando os Demais Serviços

Após o Vault estar configurado, você pode iniciar os demais serviços do projeto:

```bash
docker-compose up -d
```

Isso irá construir as imagens (se necessário) e iniciar todos os contêineres definidos no `docker-compose.yml`.

### 4. Acessando a Aplicação

- **Frontend:** A aplicação estará disponível em `http://localhost:3000`.
- **API Gateway:** As APIs estarão acessíveis através do Nginx em `http://localhost`.

Para verificar o status dos contêineres:

```bash
docker-compose ps
```

Para visualizar os logs de um serviço específico (ex: `login-service`):

```bash
docker-compose logs login-service
```

Para parar todos os serviços:

```bash
docker-compose down
```
