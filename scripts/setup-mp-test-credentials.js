const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../src/lib/auth');

const prisma = new PrismaClient();

async function main() {
  // Credenciais de teste do Mercado Pago
  // Você precisa obter essas credenciais em: https://www.mercadopago.com.br/developers/panel/app
  // Crie uma aplicação de teste e copie as credenciais

  const TEST_ACCESS_TOKEN = 'TEST-YOUR-ACCESS-TOKEN-HERE'; // Substitua com seu token de teste
  const TEST_PUBLIC_KEY = 'TEST-YOUR-PUBLIC-KEY-HERE'; // Substitua com sua chave pública de teste
  const TEST_REFRESH_TOKEN = 'TEST-YOUR-REFRESH-TOKEN-HERE'; // Substitua com seu refresh token
  const TEST_USER_ID = '123456789'; // ID do usuário de teste

  // Para desenvolvimento, vamos usar tokens não criptografados temporariamente
  // Ou você pode criptografar se preferir
  const encryptedAccessToken = encrypt(TEST_ACCESS_TOKEN);
  const encryptedRefreshToken = encrypt(TEST_REFRESH_TOKEN);

  // Atualizar o primeiro usuário encontrado
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log('❌ Nenhum usuário encontrado');
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mpConnected: true,
      mpUserId: TEST_USER_ID,
      mpAccessToken: encryptedAccessToken,
      mpRefreshToken: encryptedRefreshToken,
      mpPublicKey: TEST_PUBLIC_KEY,
      mpTokenExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 dias
    },
  });

  console.log('✅ Credenciais de teste do Mercado Pago configuradas!');
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('1. Acesse https://www.mercadopago.com.br/developers/panel/app');
  console.log('2. Crie uma aplicação de teste');
  console.log('3. Copie as credenciais de teste (Access Token, Public Key, etc)');
  console.log('4. Atualize este script com suas credenciais reais');
  console.log('5. Execute este script novamente');
  console.log('');
  console.log('👤 Usuário atualizado:', user.email);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
