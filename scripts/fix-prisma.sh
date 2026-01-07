#!/bin/bash

echo "🔧 Corrigindo Prisma Client..."

# 1. Limpar cache do Next.js
echo "🧹 Limpando cache do Next.js..."
rm -rf .next
echo "✅ Cache limpo"

# 2. Regenerar Prisma Client
echo ""
echo "🔄 Regenerando Prisma Client..."
npm run db:generate

# 3. Verificar se foi gerado corretamente
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client gerado com sucesso!"
else
    echo "❌ Erro ao gerar Prisma Client"
    exit 1
fi

echo ""
echo "✅ Prisma corrigido! Agora execute: npm run dev"
