import { PrismaClient, Gender, EventStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados de teste...');

  // ============================================
  // Organizador de teste (Maria)
  // ============================================
  const organizerEmail = 'maria@okesports.com';

  const organizerPasswordHash = await hash('Senha123', 12);

  const organizer = await prisma.user.upsert({
    where: { email: organizerEmail },
    update: {},
    create: {
      email: organizerEmail,
      password: organizerPasswordHash,
      fullName: 'Maria Organizadora',
      cpfCnpj: '12345678000199',
      phone: '85999990000',
      mpConnected: true,
      mpUserId: 'TEST_ORGANIZER_USER_ID',
      mpAccessToken: 'DUMMY_ACCESS_TOKEN',
      mpRefreshToken: 'DUMMY_REFRESH_TOKEN',
      mpPublicKey: 'DUMMY_PUBLIC_KEY',
    },
  });

  console.log('✅ Organizador de teste disponível:', organizer.email);

  // ============================================
  // Atleta de teste (Thiago)
  // ============================================
  const participantEmail = 'thiago@mail.com';

  const participantPasswordHash = await hash('Senha123', 12);

  const participant = await prisma.participant.upsert({
    where: { email: participantEmail },
    update: {},
    create: {
      email: participantEmail,
      password: participantPasswordHash,
      fullName: 'Thiago Freitas',
      cpf: '03708833309',
      phone: '85981907619',
      birthDate: new Date('1990-01-01'),
      gender: Gender.NOT_INFORMED,
    },
  });

  console.log('✅ Participante de teste disponível:', participant.email);

  // ============================================
  // Eventos de teste para Maria
  // ============================================
  const now = new Date();
  const registrationStart = new Date(now);
  const registrationEnd = new Date(now);
  registrationEnd.setDate(registrationEnd.getDate() + 7);
  const eventDate = new Date(now);
  eventDate.setDate(eventDate.getDate() + 14);

  const publishedEvent = await prisma.event.upsert({
    where: { slug: 'corrida-teste-okesports' },
    update: {},
    create: {
      slug: 'corrida-teste-okesports',
      name: 'Corrida Teste Okê Sports',
      description: 'Evento de corrida de rua para testes da plataforma Okê Sports.',
      shortDescription: 'Corrida teste 5km e 10km.',
      eventDate,
      registrationStart,
      registrationEnd,
      status: EventStatus.PUBLISHED,
      maxRegistrations: 500,
      organizerId: organizer.id,
      location: {
        create: {
          street: 'Av. Beira Mar',
          number: '1000',
          neighborhood: 'Praia de Iracema',
          city: 'Fortaleza',
          state: 'CE',
          cep: '60060000',
        },
      },
      modalities: {
        create: [
          {
            name: '5km',
            description: 'Corrida de 5km para iniciantes.',
            price: 79.9,
            maxSlots: 200,
            order: 1,
            active: true,
          },
          {
            name: '10km',
            description: 'Corrida de 10km para intermediários.',
            price: 109.9,
            maxSlots: 300,
            order: 2,
            active: true,
          },
        ],
      },
    },
    include: {
      modalities: true,
    },
  });

  console.log('✅ Evento de teste publicado criado:', publishedEvent.name);

  const draftEvent = await prisma.event.upsert({
    where: { slug: 'corrida-teste-rascunho' },
    update: {},
    create: {
      slug: 'corrida-teste-rascunho',
      name: 'Corrida Teste (Rascunho)',
      description: 'Evento em rascunho para testar edição de eventos.',
      shortDescription: 'Rascunho de evento de teste.',
      eventDate,
      registrationStart,
      registrationEnd,
      status: EventStatus.DRAFT,
      organizerId: organizer.id,
      location: {
        create: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'Fortaleza',
          state: 'CE',
          cep: '60000000',
        },
      },
    },
  });

  console.log('✅ Evento de teste em rascunho criado:', draftEvent.name);

  console.log('✨ Seed finalizado.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


