#!/bin/bash

# Script para atualizar credenciais de PRODUÇÃO do Mercado Pago no .env

echo "🔧 Atualizando credenciais de PRODUÇÃO do Mercado Pago"
echo "========================================================"
echo ""

# Credenciais fornecidas
MP_CLIENT_ID="2642842033203243"
MP_CLIENT_SECRET="gP0lSC9qWFA10e74EbwzKF7vUTECwqnL"
MP_PUBLIC_KEY="APP_USR-0161042f-d54d-4761-87c6-35bc45be8c68"
MP_ACCESS_TOKEN="APP_USR-2642842033203243-110615-e7bed9b41bfc610539899a2a3c079d35-219525264"

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo "📝 Atualizando credenciais no .env..."
echo ""

# Atualizar MP_CLIENT_ID
if grep -q "^MP_CLIENT_ID=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^MP_CLIENT_ID=.*|MP_CLIENT_ID=\"$MP_CLIENT_ID\"|" .env
    else
        sed -i "s|^MP_CLIENT_ID=.*|MP_CLIENT_ID=\"$MP_CLIENT_ID\"|" .env
    fi
    echo "✅ MP_CLIENT_ID atualizado"
else
    echo "MP_CLIENT_ID=\"$MP_CLIENT_ID\"" >> .env
    echo "✅ MP_CLIENT_ID adicionado"
fi

# Atualizar MP_CLIENT_SECRET
if grep -q "^MP_CLIENT_SECRET=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$MP_CLIENT_SECRET\"|" .env
    else
        sed -i "s|^MP_CLIENT_SECRET=.*|MP_CLIENT_SECRET=\"$MP_CLIENT_SECRET\"|" .env
    fi
    echo "✅ MP_CLIENT_SECRET atualizado"
else
    echo "MP_CLIENT_SECRET=\"$MP_CLIENT_SECRET\"" >> .env
    echo "✅ MP_CLIENT_SECRET adicionado"
fi

# Adicionar/atualizar MP_PUBLIC_KEY (se necessário)
if grep -q "^MP_PUBLIC_KEY=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^MP_PUBLIC_KEY=.*|MP_PUBLIC_KEY=\"$MP_PUBLIC_KEY\"|" .env
    else
        sed -i "s|^MP_PUBLIC_KEY=.*|MP_PUBLIC_KEY=\"$MP_PUBLIC_KEY\"|" .env
    fi
    echo "✅ MP_PUBLIC_KEY atualizado"
else
    echo "MP_PUBLIC_KEY=\"$MP_PUBLIC_KEY\"" >> .env
    echo "✅ MP_PUBLIC_KEY adicionado"
fi

# Remover DISABLE_SPLIT_PAYMENTS_TEST se existir (para produção)
if grep -q "^DISABLE_SPLIT_PAYMENTS_TEST=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/^DISABLE_SPLIT_PAYMENTS_TEST=/d" .env
    else
        sed -i "/^DISABLE_SPLIT_PAYMENTS_TEST=/d" .env
    fi
    echo "✅ DISABLE_SPLIT_PAYMENTS_TEST removido (não necessário em produção)"
fi

echo ""
echo "✅ Credenciais de PRODUÇÃO atualizadas com sucesso!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Essas são credenciais de PRODUÇÃO"
echo "   - A conta da Maria já está conectada via OAuth"
echo "   - Split payments deve funcionar normalmente"
echo "   - Reinicie o servidor para carregar as novas credenciais"
echo ""
echo "🧪 Para testar:"
echo "   1. Crie um evento com modalidade de R$ 1,00"
echo "   2. Faça uma inscrição de teste"
echo "   3. O checkout deve funcionar com split payments"
echo ""

