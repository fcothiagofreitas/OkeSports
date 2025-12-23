#!/usr/bin/env node

/**
 * Script para sincronizar status de pagamento pendente
 * 
 * Uso:
 *   node scripts/sync-payment-status.js <registrationId>
 *   node scripts/sync-payment-status.js --payment-id <paymentId>
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function syncPaymentStatus(registrationId, paymentId) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = `${appUrl}/api/payments/sync-status`;

  const body = registrationId 
    ? { registrationId } 
    : { paymentId };

  console.log('🔄 Sincronizando status do pagamento...');
  console.log('📋 Dados:', JSON.stringify(body, null, 2));
  console.log('🌐 URL:', apiUrl);
  console.log('');

  try {
    // Nota: Esta rota requer autenticação (withAuth)
    // Você precisará passar o accessToken no header Authorization
    // Por enquanto, vamos fazer uma chamada direta ao banco para testar
    
    console.log('⚠️  ATENÇÃO: Esta rota requer autenticação.');
    console.log('   Você pode testar via:');
    console.log('   1. Interface do frontend (se houver botão)');
    console.log('   2. curl com token de autenticação');
    console.log('   3. Teste direto no código (ver abaixo)');
    console.log('');
    
    // Mostrar comando curl
    console.log('📝 Comando curl (substitua <TOKEN> pelo seu accessToken):');
    console.log('');
    console.log(`curl -X POST "${apiUrl}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer <TOKEN>" \\`);
    console.log(`  -d '${JSON.stringify(body)}'`);
    console.log('');

    // Alternativa: buscar direto no banco
    console.log('💡 Alternativa: Testar diretamente no código');
    console.log('   Execute este script com Node.js após configurar o .env:');
    console.log('');
    
    // Criar script alternativo que acessa o banco diretamente
    const directScript = `
// Teste direto no banco (sem autenticação)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSync() {
  const registrationId = '${registrationId || 'SEU_REGISTRATION_ID'}';
  
  // Buscar inscrição
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              mpAccessToken: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    console.error('❌ Inscrição não encontrada');
    process.exit(1);
  }

  console.log('✅ Inscrição encontrada:');
  console.log('   ID:', registration.id);
  console.log('   Status:', registration.status);
  console.log('   Payment Status:', registration.paymentStatus);
  console.log('   Payment ID:', registration.paymentId);
  console.log('');

  // Aqui você pode adicionar a lógica de sincronização
  // ou chamar a função do route diretamente
}

testSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
`;

    console.log(directScript);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
let registrationId = null;
let paymentId = null;

if (args[0] === '--payment-id' && args[1]) {
  paymentId = args[1];
} else if (args[0] && !args[0].startsWith('--')) {
  registrationId = args[0];
} else {
  console.log('📋 Uso:');
  console.log('   node scripts/sync-payment-status.js <registrationId>');
  console.log('   node scripts/sync-payment-status.js --payment-id <paymentId>');
  console.log('');
  console.log('💡 Exemplo:');
  console.log('   node scripts/sync-payment-status.js cmjh9g9nd000cy4sggon4gxa8');
  console.log('   node scripts/sync-payment-status.js --payment-id 139040854508');
  process.exit(1);
}

syncPaymentStatus(registrationId, paymentId)
  .then(() => {
    rl.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    rl.close();
    process.exit(1);
  });

