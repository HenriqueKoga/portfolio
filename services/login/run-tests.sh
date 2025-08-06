#!/bin/bash

# Script para executar testes do serviço de login

echo "🔍 Executando testes do serviço de LOGIN..."
echo "=========================================="

# Navegar para o diretório do serviço
cd "$(dirname "$0")"

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
npm install

# Executar testes
echo "🧪 Executando testes unitários..."
npm test -- --coverage --verbose --watchAll=false

# Verificar se os testes passaram
if [ $? -eq 0 ]; then
    echo "✅ Todos os testes do serviço de LOGIN passaram!"
    echo "📊 Relatório de cobertura gerado em coverage/"
else
    echo "❌ Alguns testes falharam no serviço de LOGIN"
    exit 1
fi
