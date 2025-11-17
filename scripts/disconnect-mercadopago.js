const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function disconnect() {
  const user = await prisma.user.findFirst({
    where: { email: 'maria@okesports.com' }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mpConnected: false,
      mpUserId: null,
      mpAccessToken: null,
      mpRefreshToken: null,
      mpPublicKey: null,
      mpTokenExpiresAt: null,
    },
  });

  console.log('✅ Mercado Pago desconectado com sucesso!');
  console.log('');
  console.log('Agora você pode:');
  console.log('1. Fazer login no dashboard como maria@okesports.com');
  console.log('2. Clicar em "Conectar Mercado Pago"');
  console.log('3. Autorizar novamente');

  await prisma.$disconnect();
}

disconnect().catch(console.error);
