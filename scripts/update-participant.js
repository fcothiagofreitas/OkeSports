const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const participant = await prisma.participant.updateMany({
    where: {
      email: 'maria@okesports.com',
    },
    data: {
      email: 'thiago@mail.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Participante atualizado:', participant);
  console.log('Email: thiago@mail.com');
  console.log('Senha: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
