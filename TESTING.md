# 🧪 Testes Unitários - Portfolio Services

Este documento descreve como executar os testes unitários para todos os serviços do projeto Portfolio.

## 📋 Visão Geral

O projeto contém 4 serviços com testes unitários completos:

- **🐍 Serviço de Projetos** (Python/FastAPI)
- **🐍 Serviço de Comentários** (Python/FastAPI)
- **🟨 Serviço de Login** (Node.js/Express)
- **🟦 Serviço de Notificações** (Go)

## 🚀 Execução Rápida

### Executar Todos os Testes

```bash
# Na raiz do projeto
./run-all-tests.sh
```

### Executar Testes por Serviço

#### Serviço de Projetos

```bash
cd services/projects
./run-tests.sh
```

#### Serviço de Comentários  

```bash
cd services/comments
./run-tests.sh
```

#### Serviço de Login

```bash
cd services/login
./run-tests.sh
```

#### Serviço de Notificações

```bash
cd services/notifications
./run-tests.sh
```

## 📊 Cobertura de Testes

### Serviço de Projetos (Python)

- **Domain**: `Project` model e `ProjectRepository` interface
- **Use Cases**: `ProjectService` com todas as operações CRUD
- **Infrastructure**: `ProjectMongoRepository` com mocks do MongoDB
- **Cobertura**: Relatório gerado em `htmlcov/`

**Testes incluem:**

- ✅ Criação, leitura, atualização e exclusão de projetos
- ✅ Validações de modelo
- ✅ Tratamento de erros e exceções
- ✅ Operações assíncronas
- ✅ Integração com MongoDB (mock)

### Serviço de Comentários (Python)

- **Domain**: `Comment`, `CommentCreate` models e `CommentRepository` interface
- **Application**: `CommentService` com integração de publisher
- **Infrastructure**: `CommentMongoRepository` com mocks do MongoDB
- **Cobertura**: Relatório gerado em `htmlcov/`

**Testes incluem:**

- ✅ Criação e gerenciamento de comentários
- ✅ Comentários públicos e privados
- ✅ Paginação e filtros por usuário
- ✅ Publicação de notificações
- ✅ Tratamento de timestamps e timezones

### Serviço de Login (Node.js)

- **Domain**: `User` model com validações
- **Application**: `AuthService` para autenticação OAuth
- **Infrastructure**: `MongoUserRepository` com mocks do MongoDB
- **Cobertura**: Relatório gerado em `coverage/`

**Testes incluem:**

- ✅ Criação e serialização de usuários
- ✅ Autenticação com Google e GitHub
- ✅ Busca e criação de usuários
- ✅ Tratamento de provedores OAuth
- ✅ Gerenciamento de sessões

### Serviço de Notificações (Go)

- **Domain**: `CommentMessage` struct e interfaces
- **Application**: `NotificationService` para processamento
- **Infrastructure**: Mocks para email e RabbitMQ
- **Cobertura**: Relatório gerado em `coverage.html`

**Testes incluem:**

- ✅ Processamento de mensagens de comentários
- ✅ Formatação de emails de notificação
- ✅ Tratamento de caracteres especiais
- ✅ Validação de visibilidade (público/privado)
- ✅ Mocks de dependências externas

## 🛠️ Configuração Manual

### Pré-requisitos

- **Python 3.12+** (para serviços Python)
- **Node.js 18+** (para serviço de Login)
- **Go 1.21+** (para serviço de Notificações)

### Serviços Python (Projetos e Comentários)

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar testes específicos
python -m pytest src/tests/unit/domain/ -v
python -m pytest src/tests/unit/application/ -v  
python -m pytest src/tests/unit/infrastructure/ -v

# Com cobertura
python -m pytest src/tests/ --cov=src/app --cov-report=html
```

### Serviço Node.js (Login)

```bash
# Instalar dependências
npm install

# Executar testes específicos
npm test -- --testPathPattern=domain
npm test -- --testPathPattern=application
npm test -- --testPathPattern=infrastructure

# Com cobertura
npm test -- --coverage
```

### Serviço Go (Notificações)

```bash
# Navegar para src/
cd src/

# Executar testes específicos
go test -v ./internal/domain/
go test -v ./internal/application/
go test -v ./internal/infrastructure/

# Com cobertura
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

## 🧪 Padrões de Teste

### Estrutura de Testes

```
src/tests/
├── unit/
│   ├── domain/          # Testes de modelos e entidades
│   ├── application/     # Testes de casos de uso/serviços
│   └── infrastructure/  # Testes de repositórios e adapters
└── integration/         # Testes de integração (futuros)
```

### Convenções

- **Nomenclatura**: `test_[funcionalidade]_[cenario].py` (Python), `test_[funcionalidade].test.js` (Node.js)
- **Organização**: Arrange, Act, Assert
- **Mocks**: Utilizados para dependências externas (DB, APIs, etc.)
- **Fixtures**: Dados de teste reutilizáveis
- **Cobertura**: Meta mínima de 80% por serviço

### Exemplos de Casos de Teste

- ✅ **Sucesso**: Operações normais funcionando
- ❌ **Falha**: Tratamento de erros e validações
- 🔄 **Edge Cases**: Valores limite, dados vazios/nulos
- 🔒 **Segurança**: Validações de autorização
- ⚡ **Performance**: Operações assíncronas e timeouts

## 🐛 Debugging de Testes

### Logs Detalhados

```bash
# Python
python -m pytest -v --tb=long --log-cli-level=DEBUG

# Node.js  
npm test -- --verbose --detectOpenHandles

# Go
go test -v -race ./...
```

### Executar Teste Específico

```bash
# Python
python -m pytest src/tests/unit/domain/test_project.py::TestProject::test_project_creation

# Node.js
npm test -- --testNamePattern="should create user"

# Go
go test -run TestCommentMessage ./internal/domain/
```

## 📈 Métricas e Relatórios

Os relatórios de cobertura são gerados automaticamente:

- **Python**: `htmlcov/index.html`
- **Node.js**: `coverage/lcov-report/index.html`  
- **Go**: `coverage.html`

## 🔧 Troubleshooting

### Problemas Comuns

1. **Dependências não instaladas**

   ```bash
   # Verificar e instalar dependências de cada serviço
   pip install -r requirements.txt  # Python
   npm install                      # Node.js
   go mod tidy                      # Go
   ```

2. **Problemas de permissão nos scripts**

   ```bash
   chmod +x run-all-tests.sh
   chmod +x services/*/run-tests.sh
   ```

3. **Falhas de importação (Python)**

   ```bash
   # Verificar PYTHONPATH
   export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
   ```

4. **Timeouts em testes assíncronos**
   - Verificar se mocks estão configurados corretamente
   - Aumentar timeout se necessário para operações lentas

## 🚦 CI/CD Integration

Os testes estão prontos para integração com pipelines de CI/CD:

```yaml
# Exemplo GitHub Actions
- name: Run All Tests
  run: ./run-all-tests.sh

# Exemplo para serviço específico  
- name: Test Projects Service
  run: cd services/projects && ./run-tests.sh
```

## 📚 Documentação Adicional

- [Jest Documentation](https://jestjs.io/) (Node.js)
- [Pytest Documentation](https://docs.pytest.org/) (Python)
- [Go Testing](https://golang.org/pkg/testing/) (Go)
- [Testify](https://github.com/stretchr/testify) (Go Assertions)

---

**✨ Criado com carinho para garantir a qualidade do código!** 🧪
