#!/bin/bash

# Script para executar todos os testes unitários dos serviços

echo "=========================================="
echo "🚀 Executando todos os testes unitários"
echo "=========================================="

# Função para verificar se o comando anterior falhou
check_status() {
    if [ $? -ne 0 ]; then
        echo "❌ Falha detectada no serviço: $1"
        echo "=========================================="
        exit 1
    else
        echo "✅ Testes do $1 executados com sucesso!"
        echo "=========================================="
    fi
}

# Navegar para o diretório raiz do projeto
cd "$(dirname "$0")"

echo ""
echo "🔍 Executando testes do serviço de PROJETOS (Python)..."
echo "=========================================="
cd services/projects
../../.venv/bin/python -m pytest src/tests/ -v --tb=short --cov=src/app --cov-report=term-missing
check_status "PROJETOS"

echo ""
echo "🔍 Executando testes do serviço de COMENTÁRIOS (Python)..."
echo "=========================================="
cd ../comments
../../.venv/bin/python -m pytest src/tests/ -v --tb=short --cov=src/app --cov-report=term-missing
check_status "COMENTÁRIOS"

echo ""
echo "🔍 Executando testes do serviço de LOGIN (Node.js)..."
echo "=========================================="
cd ../login
npm test -- --coverage --verbose
check_status "LOGIN"

echo ""
echo "🔍 Executando testes do serviço de NOTIFICAÇÕES (Go)..."
echo "=========================================="
cd ../notifications/src
go test -v -cover ./...
check_status "NOTIFICAÇÕES"

echo ""
echo "🎉 TODOS OS TESTES EXECUTADOS COM SUCESSO!"
echo "=========================================="
echo "📊 Resumo:"
echo "   ✅ Serviço de Projetos (Python)"
echo "   ✅ Serviço de Comentários (Python)"  
echo "   ✅ Serviço de Login (Node.js)"
echo "   ✅ Serviço de Notificações (Go)"
echo "=========================================="
