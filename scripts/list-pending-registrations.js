#!/usr/bin/env node

/**
 * Lista todas as inscrições pendentes
 * 
 * Uso:
 *   node scripts/list-pending-registrations.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listPendingRegistrations() {
  try {
    console.log('🔍 Buscando inscrições pendentes...');
    console.log('');

    const pendingRegistrations = await prisma.registration.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        paymentStatus: true,
        paymentId: true,
        createdAt: true,
        event: {
          select: {
            name: true,
          },
        },
        participant: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingRegistrations.length === 0) {
      console.log('✅ Nenhuma inscrição pendente encontrada');
      return;
    }

    console.log(`📋 Encontradas ${pendingRegistrations.length} inscrição(ões) pendente(s):`);
    console.log('');

    pendingRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. Inscrição #${reg.registrationNumber}`);
      console.log(`   ID: ${reg.id}`);
      console.log(`   Evento: ${reg.event.name}`);
      console.log(`   Participante: ${reg.participant.fullName} (${reg.participant.email})`);
      console.log(`   Status: ${reg.status} | Payment: ${reg.paymentStatus || 'N/A'}`);
      console.log(`   Payment ID: ${reg.paymentId || '(não salvo)'}`);
      console.log(`   Criado em: ${reg.createdAt.toLocaleString('pt-BR')}`);
      console.log('');
      console.log(`   Para sincronizar: node scripts/sync-payment-direct.js ${reg.id}`);
      console.log('');
      console.log('─'.repeat(60));
      console.log('');
    });

    console.log('💡 Use o comando acima para sincronizar cada inscrição');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listPendingRegistrations();

