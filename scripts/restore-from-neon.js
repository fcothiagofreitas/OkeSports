#!/usr/bin/env node

/**
 * Script para recuperar dados do banco Neon antigo
 * e migrar para o banco local
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// URL do banco antigo (do .env.bak)
const oldUrl = process.argv[2] || process.env.OLD_DATABASE_URL;

if (!oldUrl) {
  console.error('❌ URL do banco antigo não fornecida!');
  console.error('');
  console.error('💡 Uso:');
  console.error('   OLD_DATABASE_URL="prisma+postgres://..." node scripts/restore-from-neon.js');
  console.error('   OU');
  console.error('   node scripts/restore-from-neon.js "prisma+postgres://..."');
  console.error('');
  console.error('💡 A URL está no arquivo .env.bak');
  process.exit(1);
}

// Converter URL do Accelerate para direta
function convertAccelerateUrl(url) {
  if (!url.startsWith('prisma+postgres://')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const apiKey = urlObj.searchParams.get('api_key');
    
    if (apiKey) {
      let base64 = apiKey;
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      
      let databaseUrl = data.databaseUrl || data.shadowDatabaseUrl;
      
      if (databaseUrl && databaseUrl.startsWith('postgres://')) {
        databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
      }
      
      return databaseUrl;
    }
  } catch (error) {
    console.error('❌ Erro ao converter URL:', error.message);
    return null;
  }
  
  return null;
}

async function restoreData() {
  console.log('🔄 Tentando recuperar dados do banco antigo...\n');

  // Converter URL
  const directUrl = convertAccelerateUrl(oldUrl);
  
  if (!directUrl) {
    console.error('❌ Não foi possível converter a URL do banco antigo');
    console.error('💡 Você precisa obter a URL direta do Neon:');
    console.error('   1. Acesse https://console.neon.tech');
    console.error('   2. Vá em Connection Details');
    console.error('   3. Copie a "Connection string" (não a do Accelerate)');
    process.exit(1);
  }

  console.log('📝 Conectando ao banco antigo...');
  
  // Conectar ao banco antigo
  const oldPrisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });

  // Conectar ao banco novo (local)
  const newPrisma = new PrismaClient();

  try {
    // Testar conexão com banco antigo
    await oldPrisma.$connect();
    console.log('✅ Conectado ao banco antigo\n');

    // Testar conexão com banco novo
    await newPrisma.$connect();
    console.log('✅ Conectado ao banco novo\n');

    // Listar tabelas e dados
    console.log('📊 Recuperando dados...\n');

    // Users
    const users = await oldPrisma.user.findMany();
    console.log(`👤 Usuários encontrados: ${users.length}`);
    if (users.length > 0) {
      for (const user of users) {
        await newPrisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            password: user.password,
            fullName: user.fullName,
            cpfCnpj: user.cpfCnpj,
            phone: user.phone,
            mpConnected: user.mpConnected,
            mpUserId: user.mpUserId,
            mpAccessToken: user.mpAccessToken,
            mpRefreshToken: user.mpRefreshToken,
            mpPublicKey: user.mpPublicKey,
            mpTokenExpiresAt: user.mpTokenExpiresAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            emailVerified: user.emailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
          },
        });
      }
      console.log('✅ Usuários migrados');
    }

    // Participants
    const participants = await oldPrisma.participant.findMany();
    console.log(`🏃 Participantes encontrados: ${participants.length}`);
    if (participants.length > 0) {
      for (const participant of participants) {
        await newPrisma.participant.upsert({
          where: { email: participant.email },
          update: {},
          create: {
            email: participant.email,
            password: participant.password,
            fullName: participant.fullName,
            cpf: participant.cpf,
            phone: participant.phone,
            birthDate: participant.birthDate,
            gender: participant.gender,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt,
          },
        });
      }
      console.log('✅ Participantes migrados');
    }

    // Events (e relacionamentos)
    const events = await oldPrisma.event.findMany({
      include: {
        location: true,
        modalities: true,
        kit: {
          include: {
            sizes: true,
          },
        },
      },
    });
    console.log(`🎯 Eventos encontrados: ${events.length}`);
    if (events.length > 0) {
      for (const event of events) {
        await newPrisma.event.create({
          data: {
            id: event.id,
            name: event.name,
            slug: event.slug,
            description: event.description,
            shortDescription: event.shortDescription,
            eventDate: event.eventDate,
            registrationStart: event.registrationStart,
            registrationEnd: event.registrationEnd,
            status: event.status,
            maxRegistrations: event.maxRegistrations,
            allowGroupReg: event.allowGroupReg,
            maxGroupSize: event.maxGroupSize,
            bannerUrl: event.bannerUrl,
            logoUrl: event.logoUrl,
            coverUrl: event.coverUrl,
            landingSellingPoints: event.landingSellingPoints,
            landingAbout: event.landingAbout,
            landingFaq: event.landingFaq,
            supportEmail: event.supportEmail,
            supportWhatsapp: event.supportWhatsapp,
            mercadoPagoFee: event.mercadoPagoFee,
            userId: event.userId,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            location: event.location ? {
              create: {
                city: event.location.city,
                state: event.location.state,
                address: event.location.address,
                zipCode: event.location.zipCode,
                latitude: event.location.latitude,
                longitude: event.location.longitude,
              },
            } : undefined,
            modalities: {
              create: event.modalities.map(m => ({
                id: m.id,
                name: m.name,
                description: m.description,
                price: m.price,
                maxSlots: m.maxSlots,
                active: m.active,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
              })),
            },
            kit: event.kit ? {
              create: {
                includeShirt: event.kit.includeShirt,
                shirtRequired: event.kit.shirtRequired,
                items: event.kit.items,
                sizes: {
                  create: event.kit.sizes.map(s => ({
                    size: s.size,
                    stock: s.stock,
                    reserved: s.reserved,
                    sold: s.sold,
                  })),
                },
              },
            } : undefined,
          },
        });
      }
      console.log('✅ Eventos migrados');
    }

    // Registrations
    const registrations = await oldPrisma.registration.findMany();
    console.log(`📝 Inscrições encontradas: ${registrations.length}`);
    if (registrations.length > 0) {
      for (const reg of registrations) {
        await newPrisma.registration.create({
          data: {
            id: reg.id,
            eventId: reg.eventId,
            modalityId: reg.modalityId,
            participantId: reg.participantId,
            couponId: reg.couponId,
            status: reg.status,
            totalAmount: reg.totalAmount,
            platformFee: reg.platformFee,
            netAmount: reg.netAmount,
            mpPreferenceId: reg.mpPreferenceId,
            mpPaymentId: reg.mpPaymentId,
            paidAt: reg.paidAt,
            cancelledAt: reg.cancelledAt,
            createdAt: reg.createdAt,
            updatedAt: reg.updatedAt,
          },
        });
      }
      console.log('✅ Inscrições migradas');
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('💡 Agora você pode usar o banco local normalmente');

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error.message);
    if (error.code === 'P1001') {
      console.error('💡 Não foi possível conectar ao banco antigo');
      console.error('💡 Verifique se a URL está correta ou se o banco ainda está ativo');
    }
    process.exit(1);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

restoreData();
