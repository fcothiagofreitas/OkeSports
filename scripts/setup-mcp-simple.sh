#!/bin/bash

# Script simplificado de configuração de MCPs para OkeSports

echo "🔌 Configuração de MCPs para OkeSports"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Caminho do arquivo de configuração do Cursor (macOS)
MCP_CONFIG_FILE="$HOME/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"

# Criar diretório se não existir
mkdir -p "$(dirname "$MCP_CONFIG_FILE")"

# Tentar ler DATABASE_URL do .env automaticamente
DB_URL=""
if [ -f ".env" ]; then
    DB_URL=$(grep "^DATABASE_URL=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
    if [ ! -z "$DB_URL" ]; then
        echo -e "${GREEN}✅ DATABASE_URL encontrado no .env${NC}"
    fi
fi

# Se não encontrou, perguntar
if [ -z "$DB_URL" ]; then
    echo -e "${BLUE}📝 PostgreSQL MCP${NC}"
    echo "   Para configurar o PostgreSQL MCP, preciso da string de conexão."
    echo "   Exemplo: postgresql://user:pass@localhost:5432/okesports"
    echo ""
    read -p "   DATABASE_URL (ou Enter para pular): " DB_URL
    if [ -z "$DB_URL" ]; then
        echo -e "${YELLOW}   ⚠️  PostgreSQL MCP não será configurado.${NC}"
        echo ""
    fi
fi

# GitHub Token
echo -e "${BLUE}📝 GitHub MCP${NC}"
echo "   Para configurar o GitHub MCP, preciso de um Personal Access Token."
echo "   Obtenha em: https://github.com/settings/tokens"
echo "   Permissões necessárias: repo, issues, pull_requests"
echo ""
read -p "   GitHub Token (ou Enter para pular): " GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}   ⚠️  GitHub MCP não será configurado.${NC}"
    echo ""
fi

# Caminho do projeto
PROJECT_PATH=$(pwd)

# Gerar configuração JSON
echo ""
echo "🔧 Gerando configuração..."

# Construir JSON
JSON="{"
JSON="$JSON\n  \"mcpServers\": {"

# PostgreSQL
if [ ! -z "$DB_URL" ]; then
    DB_URL_ESCAPED=$(echo "$DB_URL" | sed 's/"/\\"/g')
    JSON="$JSON\n    \"postgres\": {"
    JSON="$JSON\n      \"command\": \"npx\","
    JSON="$JSON\n      \"args\": ["
    JSON="$JSON\n        \"-y\","
    JSON="$JSON\n        \"@modelcontextprotocol/server-postgres\","
    JSON="$JSON\n        \"$DB_URL_ESCAPED\""
    JSON="$JSON\n      ],"
    JSON="$JSON\n      \"env\": {"
    JSON="$JSON\n        \"POSTGRES_CONNECTION_STRING\": \"$DB_URL_ESCAPED\""
    JSON="$JSON\n      }"
    JSON="$JSON\n    },"
fi

# GitHub
if [ ! -z "$GITHUB_TOKEN" ]; then
    JSON="$JSON\n    \"github\": {"
    JSON="$JSON\n      \"command\": \"npx\","
    JSON="$JSON\n      \"args\": ["
    JSON="$JSON\n        \"-y\","
    JSON="$JSON\n        \"@modelcontextprotocol/server-github\""
    JSON="$JSON\n      ],"
    JSON="$JSON\n      \"env\": {"
    JSON="$JSON\n        \"GITHUB_PERSONAL_ACCESS_TOKEN\": \"$GITHUB_TOKEN\""
    JSON="$JSON\n      }"
    JSON="$JSON\n    },"
fi

# Filesystem (sempre)
JSON="$JSON\n    \"filesystem\": {"
JSON="$JSON\n      \"command\": \"npx\","
JSON="$JSON\n      \"args\": ["
JSON="$JSON\n        \"-y\","
JSON="$JSON\n        \"@modelcontextprotocol/server-filesystem\","
JSON="$JSON\n        \"$PROJECT_PATH\""
JSON="$JSON\n      ]"
JSON="$JSON\n    },"

# Browser (sempre)
JSON="$JSON\n    \"browser\": {"
JSON="$JSON\n      \"command\": \"npx\","
JSON="$JSON\n      \"args\": ["
JSON="$JSON\n        \"-y\","
JSON="$JSON\n        \"@modelcontextprotocol/server-browser\""
JSON="$JSON\n      ]"
JSON="$JSON\n    }"

JSON="$JSON\n  }"
JSON="$JSON\n}"

# Remover última vírgula antes do fechamento
JSON=$(echo -e "$JSON" | sed 's/,$//' | sed 's/},$/}/' | sed 's/},$/}/')

# Salvar
echo -e "$JSON" > "$MCP_CONFIG_FILE"

echo ""
echo -e "${GREEN}✅ Configuração salva!${NC}"
echo "   Arquivo: $MCP_CONFIG_FILE"
echo ""
echo "🔄 Reinicie o Cursor para aplicar as mudanças."
echo ""
echo "📚 Mais informações: docs/MCP_SETUP.md"
