#!/bin/bash

# Script para executar testes do serviço de projetos

echo "🔍 Executando testes do serviço de PROJETOS..."
echo "=========================================="

# Navegar para o diretório do serviço
cd "$(dirname "$0")"

# Ativar ambiente virtual se existir
if [ -d "../../.venv" ]; then
    echo "📦 Usando ambiente virtual compartilhado..."
    PYTHON_CMD="../../.venv/bin/python"
elif [ -d "ENV" ]; then
    echo "📦 Ativando ambiente virtual local..."
    source ENV/bin/activate
    PYTHON_CMD="python"
else
    echo "📦 Usando Python do sistema..."
    PYTHON_CMD="python"
fi

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
$PYTHON_CMD -m pip install -q -r requirements.txt

# Executar testes
echo "🧪 Executando testes unitários..."
$PYTHON_CMD -m pytest src/tests/ -v --tb=short --cov=src/app --cov-report=term-missing --cov-report=html

# Verificar se os testes passaram
if [ $? -eq 0 ]; then
    echo "✅ Todos os testes do serviço de PROJETOS passaram!"
    echo "📊 Relatório de cobertura gerado em htmlcov/"
else
    echo "❌ Alguns testes falharam no serviço de PROJETOS"
    exit 1
fi
