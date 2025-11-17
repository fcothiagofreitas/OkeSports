const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Verificar se já existe um participante
  const existingParticipant = await prisma.participant.findFirst();

  const hashedPassword = await bcrypt.hash('123456', 10);

  let participant;

  if (existingParticipant) {
    // Atualizar o primeiro participante encontrado
    participant = await prisma.participant.update({
      where: { id: existingParticipant.id },
      data: {
        email: 'thiago@mail.com',
        password: hashedPassword,
        fullName: 'Thiago Freitas',
      },
    });
    console.log('✅ Participante atualizado!');
  } else {
    // Criar novo participante
    participant = await prisma.participant.create({
      data: {
        email: 'thiago@mail.com',
        password: hashedPassword,
        fullName: 'Thiago Freitas',
        cpf: '037.088.333-09',
      },
    });
    console.log('✅ Participante criado!');
  }

  console.log('');
  console.log('📧 Email: thiago@mail.com');
  console.log('🔑 Senha: 123456');
  console.log('👤 Nome:', participant.fullName);
  console.log('🆔 ID:', participant.id);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
