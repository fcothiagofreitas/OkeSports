#!/bin/bash

# Script para garantir que o PostgreSQL está rodando

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    exit 1
fi

# Verificar se container está rodando
if docker ps | grep -q okesports-postgres; then
    echo "✅ PostgreSQL já está rodando"
    exit 0
fi

# Verificar se container existe mas está parado
if docker ps -a | grep -q okesports-postgres; then
    echo "🔄 Iniciando container existente..."
    docker start okesports-postgres
    sleep 2
    if docker ps | grep -q okesports-postgres; then
        echo "✅ PostgreSQL iniciado"
        exit 0
    fi
fi

# Container não existe, criar novo
echo "🚀 Criando e iniciando PostgreSQL..."
cd "$(dirname "$0")/.."
docker-compose up -d postgres

# Aguardar ficar pronto
for i in {1..20}; do
    if docker exec okesports-postgres pg_isready -U postgres &> /dev/null; then
        echo "✅ PostgreSQL pronto!"
        exit 0
    fi
    sleep 1
done

echo "❌ Timeout aguardando PostgreSQL"
exit 1
