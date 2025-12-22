#!/bin/bash

# Script para atualizar a ENCRYPTION_KEY no .env
# Gera uma nova chave segura e atualiza o arquivo .env

echo "🔑 Atualizando ENCRYPTION_KEY no .env"
echo "====================================="
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Gerar nova chave
echo "🔐 Gerando nova chave segura..."
NEW_KEY=$(node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));")

if [ -z "$NEW_KEY" ]; then
    echo "❌ Erro ao gerar nova chave!"
    exit 1
fi

echo "✅ Nova chave gerada: ${NEW_KEY:0:20}... (64 caracteres)"
echo ""

# Verificar se já existe ENCRYPTION_KEY no .env
if grep -q "^ENCRYPTION_KEY=" .env; then
    echo "📝 Atualizando ENCRYPTION_KEY existente..."
    
    # Atualizar a linha existente
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_KEY\"|" .env
    else
        # Linux
        sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_KEY\"|" .env
    fi
else
    echo "📝 Adicionando ENCRYPTION_KEY..."
    
    # Adicionar após o comentário (se existir)
    if grep -q "# Encryption Key" .env; then
        # Adicionar após o comentário
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "/# Encryption Key/a\\
ENCRYPTION_KEY=\"$NEW_KEY\"
" .env
        else
            sed -i "/# Encryption Key/a ENCRYPTION_KEY=\"$NEW_KEY\"" .env
        fi
    else
        # Adicionar no final do arquivo
        echo "" >> .env
        echo "# Encryption Key for OAuth tokens (CHANGE IN PRODUCTION!)" >> .env
        echo "# Must be 32 bytes (64 hex characters)" >> .env
        echo "ENCRYPTION_KEY=\"$NEW_KEY\"" >> .env
    fi
fi

echo ""
echo "✅ ENCRYPTION_KEY atualizada com sucesso!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Todos os tokens OAuth antigos NÃO funcionarão mais"
echo "   2. É necessário reconectar TODAS as contas Mercado Pago"
echo "   3. Após reconectar, os novos tokens funcionarão corretamente"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o servidor (npm run dev)"
echo "   2. Peça para a Maria reconectar a conta Mercado Pago"
echo "   3. Teste criando uma nova inscrição"
echo ""

