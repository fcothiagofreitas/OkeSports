#!/usr/bin/env node

/**
 * Script para verificar e atualizar pagamentos que ficaram em status intermediário
 * Útil quando o pagamento foi autorizado mas o webhook não atualizou
 * 
 * Uso:
 *   node scripts/check-pending-payments.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function decrypt(encryptedData) {
  const crypto = require('crypto');
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const ALGORITHM = 'aes-256-gcm';
  
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY não configurada no .env');
  }

  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error(`ENCRYPTION_KEY deve ter 64 caracteres (32 bytes em hex). Atual: ${ENCRYPTION_KEY.length}`);
  }

  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY não é hexadecimal válido');
  }

  const cleaned = encryptedData.trim().replace(/\s+/g, '');
  
  if (!cleaned) {
    throw new Error('Token encriptado está vazio');
  }

  const parts = cleaned.split(':');
  if (parts.length !== 3) {
    throw new Error(`Formato de token inválido. Esperado 3 partes separadas por ':', encontrado ${parts.length}. Token pode estar no formato antigo - reconecte a conta via OAuth.`);
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  
  if (!hexRegex.test(ivHex) || !hexRegex.test(authTagHex) || !hexRegex.test(encryptedHex)) {
    throw new Error('Formato hexadecimal inválido no token encriptado');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');

  if (iv.length !== 16 || authTag.length !== 16 || key.length !== 32) {
    throw new Error('Tamanhos inválidos: IV e authTag devem ter 16 bytes, key deve ter 32 bytes');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function decryptOAuthTokens({ encryptedAccessToken, encryptedRefreshToken }) {
  return {
    accessToken: decrypt(encryptedAccessToken),
    refreshToken: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : '',
  };
}

async function checkPendingPayments() {
  try {
    console.log('🔍 Buscando inscrições com pagamentos pendentes...');
    console.log('');

    // Buscar inscrições pendentes que têm paymentId
    const pendingRegistrations = await prisma.registration.findMany({
      where: {
        status: 'PENDING',
        paymentId: {
          not: null,
        },
      },
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
      orderBy: { createdAt: 'desc' },
    });

    if (pendingRegistrations.length === 0) {
      console.log('✅ Nenhuma inscrição pendente com paymentId encontrada');
      return;
    }

    console.log(`📋 Encontradas ${pendingRegistrations.length} inscrição(ões) pendente(s) com paymentId:`);
    console.log('');

    for (const registration of pendingRegistrations) {
      console.log(`🔍 Verificando inscrição #${registration.registrationNumber}...`);
      console.log(`   ID: ${registration.id}`);
      console.log(`   Payment ID: ${registration.paymentId}`);
      console.log('');

      if (!registration.event.organizer.mpAccessToken) {
        console.warn('   ⚠️  Organizador não tem token OAuth configurado');
        console.log('');
        continue;
      }

      try {
        // Descriptografar token
        const { accessToken: mpAccessToken } = decryptOAuthTokens({
          encryptedAccessToken: registration.event.organizer.mpAccessToken,
          encryptedRefreshToken: '',
        });

        // Buscar payment no MP
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${registration.paymentId}`,
          {
            headers: { Authorization: `Bearer ${mpAccessToken}` },
          }
        );

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error(`   ❌ Erro ao buscar payment: ${errorText}`);
          console.log('');
          continue;
        }

        const payment = await paymentResponse.json();
        const paymentStatus = payment.status;

        console.log(`   📊 Status no MP: ${paymentStatus}`);
        console.log(`   📊 Status no sistema: ${registration.status}`);

        // Se foi aprovado no MP mas ainda está pendente no sistema
        if (paymentStatus === 'approved' && registration.status === 'PENDING') {
          console.log('   ✅ Pagamento aprovado no MP! Atualizando status...');

          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: 'APPROVED',
              status: 'CONFIRMED',
              paymentMethod: payment.payment_type_id,
              confirmedAt: new Date(),
            },
          });

          console.log('   ✅ Status atualizado para CONFIRMED!');
        } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
          console.log(`   ⚠️  Pagamento ${paymentStatus} no MP. Atualizando status...`);

          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
              status: 'CANCELLED',
            },
          });

          console.log('   ✅ Status atualizado para CANCELLED');
        } else {
          console.log(`   ⏳ Pagamento ainda em processamento (${paymentStatus})`);
          console.log('   💡 O webhook será chamado quando o status mudar');
        }

        console.log('');
      } catch (error) {
        console.error(`   ❌ Erro ao processar: ${error.message}`);
        console.log('');
      }
    }

    console.log('✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingPayments();

