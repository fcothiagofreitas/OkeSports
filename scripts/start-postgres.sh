#!/bin/bash

# Script para iniciar PostgreSQL no macOS

echo "🔍 Verificando PostgreSQL..."

# Verificar se está usando Homebrew
if command -v brew &> /dev/null; then
    echo "📦 Homebrew encontrado"
    
    # Verificar se PostgreSQL está instalado via Homebrew
    if brew list postgresql@14 &> /dev/null || brew list postgresql@15 &> /dev/null || brew list postgresql@16 &> /dev/null; then
        echo "✅ PostgreSQL encontrado via Homebrew"
        
        # Tentar iniciar via brew services
        if brew services list | grep -i postgres | grep -i started &> /dev/null; then
            echo "✅ PostgreSQL já está rodando!"
        else
            echo "🔄 Iniciando PostgreSQL..."
            brew services start postgresql@14 2>/dev/null || \
            brew services start postgresql@15 2>/dev/null || \
            brew services start postgresql@16 2>/dev/null || \
            brew services start postgresql 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo "✅ PostgreSQL iniciado com sucesso!"
                sleep 2
            else
                echo "❌ Erro ao iniciar PostgreSQL"
                echo "💡 Tente manualmente: brew services start postgresql@14"
            fi
        fi
    else
        echo "⚠️  PostgreSQL não encontrado via Homebrew"
        echo "💡 Para instalar: brew install postgresql@14"
    fi
else
    echo "⚠️  Homebrew não encontrado"
    echo "💡 Para instalar: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
fi

# Verificar se está usando Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Verificando Docker..."
    if docker ps | grep -i postgres &> /dev/null; then
        echo "✅ Container PostgreSQL está rodando!"
    else
        echo "⚠️  Nenhum container PostgreSQL encontrado"
        echo "💡 Para iniciar: docker start okesports-postgres"
        echo "💡 Ou criar novo: docker run --name okesports-postgres -e POSTGRES_PASSWORD=senha123 -e POSTGRES_DB=okesports -p 5432:5432 -d postgres:14"
    fi
fi

echo ""
echo "📝 Verificando conexão..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -d postgres -c "SELECT 1;" &> /dev/null; then
        echo "✅ Conexão com PostgreSQL funcionando!"
    else
        echo "⚠️  Não foi possível conectar ao PostgreSQL local"
        echo "💡 Verifique se está usando Neon/Supabase (banco na nuvem)"
    fi
else
    echo "⚠️  psql não encontrado"
fi

echo ""
echo "✅ Verificação concluída!"
