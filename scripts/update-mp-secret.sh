#!/bin/bash

# Script para atualizar MP_CLIENT_SECRET no .env

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Arquivo .env não encontrado!"
  exit 1
fi

echo "🔧 Atualizar MP_CLIENT_SECRET"
echo "============================="
echo ""
echo "📋 Credencial de TESTE deve começar com 'TEST-'"
echo "💡 Obtenha em: https://www.mercadopago.com.br/developers/panel/app"
echo "   (Certifique-se de estar no modo SANDBOX/TESTE)"
echo ""

read -p "🔑 Digite o novo MP_CLIENT_SECRET de TESTE: " NEW_SECRET

if [ -z "$NEW_SECRET" ]; then
  echo "❌ Valor não fornecido"
  exit 1
fi

# Fazer backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Backup criado: ${ENV_FILE}.backup"

# Atualizar
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$NEW_SECRET\"|" "$ENV_FILE"
else
  # Linux
  sed -i "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$NEW_SECRET\"|" "$ENV_FILE"
fi

echo "✅ MP_CLIENT_SECRET atualizado!"
echo ""
echo "🔍 Verificando credenciais..."
node scripts/check-mp-credentials.js

