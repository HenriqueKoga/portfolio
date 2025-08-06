#!/bin/bash

# Script para executar testes do serviço de notificações

echo "🔍 Executando testes do serviço de NOTIFICAÇÕES..."
echo "=========================================="

# Navegar para o diretório do serviço
cd "$(dirname "$0")/src"

# Verificar se o Go está instalado
if ! command -v go &> /dev/null; then
    echo "❌ Go não está instalado. Por favor, instale Go primeiro."
    exit 1
fi

# Baixar dependências
echo "📦 Baixando dependências..."
go mod tidy

# Executar testes
echo "🧪 Executando testes unitários..."
go test -v -cover -coverprofile=coverage.out ./...

# Gerar relatório de cobertura em HTML
if [ -f coverage.out ]; then
    echo "📊 Gerando relatório de cobertura..."
    go tool cover -html=coverage.out -o coverage.html
    echo "📊 Relatório de cobertura gerado em coverage.html"
fi

# Verificar se os testes passaram
if [ $? -eq 0 ]; then
    echo "✅ Todos os testes do serviço de NOTIFICAÇÕES passaram!"
else
    echo "❌ Alguns testes falharam no serviço de NOTIFICAÇÕES"
    exit 1
fi
