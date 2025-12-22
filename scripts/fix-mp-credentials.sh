#!/bin/bash

# Script para corrigir credenciais do Mercado Pago no .env
# Substitui MP_CLIENT_SECRET de produção por credencial de teste

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Arquivo .env não encontrado!"
  exit 1
fi

echo "🔧 Corrigindo credenciais do Mercado Pago"
echo "========================================="
echo ""
echo "📋 Credenciais de TESTE do Mercado Pago devem:"
echo "   - CLIENT_ID: geralmente são apenas números"
echo "   - CLIENT_SECRET: geralmente começam com 'TEST-'"
echo ""
echo "💡 Para obter credenciais de teste:"
echo "   1. Acesse: https://www.mercadopago.com.br/developers/panel/app"
echo "   2. Certifique-se de estar no modo SANDBOX/TESTE"
echo "   3. Crie uma aplicação Marketplace de TESTE"
echo "   4. Copie CLIENT_ID e CLIENT_SECRET de TESTE"
echo ""

read -p "🔑 Digite o MP_CLIENT_SECRET de TESTE (ou Enter para pular): " NEW_SECRET

if [ -z "$NEW_SECRET" ]; then
  echo "ℹ️  Nenhuma alteração feita"
  exit 0
fi

# Fazer backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Backup criado: ${ENV_FILE}.backup"

# Atualizar MP_CLIENT_SECRET
if grep -q "^MP_CLIENT_SECRET=" "$ENV_FILE"; then
  # Substituir linha existente
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$NEW_SECRET\"|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$NEW_SECRET\"|" "$ENV_FILE"
  fi
  echo "✅ MP_CLIENT_SECRET atualizado"
else
  # Adicionar no final
  echo "MP_CLIENT_SECRET=\"$NEW_SECRET\"" >> "$ENV_FILE"
  echo "✅ MP_CLIENT_SECRET adicionado"
fi

echo ""
echo "✅ Arquivo .env atualizado!"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o servidor"
echo "   2. Execute: node scripts/check-mp-credentials.js"
echo "   3. Verifique se está tudo OK"

