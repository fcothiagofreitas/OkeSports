const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Verificar usuário organizador
  const user = await prisma.user.findFirst({
    where: { email: 'maria@okesports.com' }
  });

  if (!user) {
    console.log('❌ Usuário maria@okesports.com não encontrado');
    return;
  }

  console.log('👤 Usuário Organizador:');
  console.log('   Email:', user.email);
  console.log('   MP Conectado:', user.mpConnected);
  console.log('   MP User ID:', user.mpUserId || 'NULL');
  console.log('   MP Access Token:', user.mpAccessToken ? 'EXISTS (' + user.mpAccessToken.substring(0, 30) + '...)' : 'NULL');
  console.log('   MP Refresh Token:', user.mpRefreshToken ? 'EXISTS' : 'NULL');
  console.log('   MP Public Key:', user.mpPublicKey || 'NULL');
  console.log('');

  // Verificar evento
  const event = await prisma.event.findFirst({
    where: { slug: 'teste' },
    include: { organizer: true }
  });

  if (event) {
    console.log('🎉 Evento:');
    console.log('   Nome:', event.name);
    console.log('   Organizador:', event.organizer.email);
    console.log('   Organizador MP Conectado:', event.organizer.mpConnected);
  }

  await prisma.$disconnect();
}

check().catch(console.error);
