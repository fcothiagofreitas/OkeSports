/**
 * Script para configurar token de teste do Vendedor (conta3) no organizador
 * 
 * Este script salva o token da conta3 (Vendedor) como token do organizador
 * para permitir testar split payments com as contas de teste do Mercado Pago
 * 
 * Uso:
 * 1. Obtenha o Access Token de teste da conta3 (Vendedor) no painel do MP
 * 2. Execute: node scripts/setup-mp-test-seller-token.js
 * 3. Informe o token quando solicitado
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const { encrypt } = require('../src/lib/auth');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Configuração de Token de Teste - Conta Vendedor (conta3)');
  console.log('==========================================================\n');

  // Informações da conta3 (Vendedor)
  console.log('📋 Informações da conta de teste:');
  console.log('   Tipo: Vendedor (conta3)');
  console.log('   User ID: 3035330929');
  console.log('   Usuário: TESTUSER4742...');
  console.log('   Senha: ZXFXWVtu8s\n');

  console.log('📝 Para obter o Access Token:');
  console.log('   1. Acesse: https://www.mercadopago.com.br/developers/panel/app');
  console.log('   2. Faça login com a conta3 (Vendedor)');
  console.log('   3. Vá em "Suas integrações" → "Credenciais de teste"');
  console.log('   4. Copie o "Access Token de teste" (começa com TEST-)\n');

  const accessToken = await question('🔑 Cole o Access Token de teste da conta3: ');

  if (!accessToken || !accessToken.startsWith('TEST-')) {
    console.error('❌ Token inválido! Deve começar com TEST-');
    process.exit(1);
  }

  const publicKey = await question('🔑 Cole a Public Key de teste (opcional, Enter para pular): ');

  // Buscar primeiro usuário organizador
  const user = await prisma.user.findFirst({
    where: {
      role: 'ORGANIZER',
    },
  });

  if (!user) {
    console.error('❌ Nenhum organizador encontrado no banco de dados');
    process.exit(1);
  }

  console.log(`\n👤 Organizador encontrado: ${user.email}`);

  const confirm = await question('\n⚠️  Deseja continuar? (s/n): ');

  if (confirm.toLowerCase() !== 's') {
    console.log('❌ Operação cancelada');
    process.exit(0);
  }

  // Criptografar token
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(accessToken); // Usar mesmo token como refresh temporariamente

  // Atualizar usuário
  await prisma.user.update({
    where: { id: user.id },
    data: {
      mpConnected: true,
      mpUserId: '3035330929', // User ID da conta3
      mpAccessToken: encryptedAccessToken,
      mpRefreshToken: encryptedRefreshToken,
      mpPublicKey: publicKey || null,
      mpTokenExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 dias
    },
  });

  console.log('\n✅ Token de teste configurado com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Criar um evento de teste');
  console.log('   2. Criar uma inscrição');
  console.log('   3. Gerar checkout - o split payment deve funcionar agora');
  console.log('   4. Verificar logs do servidor para confirmar marketplace_fee');
  console.log('\n⚠️  Lembre-se: Este é um token de TESTE, não use em produção!');
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });

