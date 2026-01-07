#!/bin/bash

echo "🗄️  Configurando banco de dados local..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "💡 Instale Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando!"
    echo "💡 Inicie o Docker Desktop e tente novamente"
    exit 1
fi

echo "✅ Docker encontrado"

# Parar container existente se houver
if docker ps -a | grep -q okesports-postgres; then
    echo "🔄 Parando container existente..."
    docker stop okesports-postgres 2>/dev/null
    docker rm okesports-postgres 2>/dev/null
fi

# Iniciar PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
cd "$(dirname "$0")/.."
docker-compose up -d postgres

# Aguardar banco ficar pronto
echo "⏳ Aguardando banco ficar pronto..."
for i in {1..30}; do
    if docker exec okesports-postgres pg_isready -U postgres &> /dev/null; then
        echo "✅ Banco de dados pronto!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout aguardando banco ficar pronto"
        exit 1
    fi
    sleep 1
done

# Mostrar URL para o .env
echo ""
echo "✅ PostgreSQL está rodando!"
echo ""
echo "📝 Adicione esta linha no seu .env:"
echo ""
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5434/okesports"'
echo ""
echo "💡 Ou execute: npm run db:setup-env"
