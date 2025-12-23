#!/usr/bin/env node

/**
 * Script para sincronizar status de pagamento diretamente (sem autenticação)
 * Acessa o banco e a API do Mercado Pago diretamente
 * 
 * Uso:
 *   node scripts/sync-payment-direct.js <registrationId>
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

async function syncPaymentDirect(registrationId) {
  try {
    console.log('🔄 Sincronizando status do pagamento...');
    console.log('📋 Registration ID:', registrationId);
    console.log('');

    // 1. Buscar inscrição
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
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
    });

    if (!registration) {
      console.error('❌ Inscrição não encontrada');
      console.error('');
      console.error('💡 Verificações:');
      console.error('   1. Verifique se o registrationId está correto:', registrationId);
      console.error('   2. Confirme que a inscrição existe no banco de dados');
      console.error('');
      
      // Tentar buscar por qualquer ID similar (primeiros caracteres)
      console.log('🔍 Tentando buscar por padrão similar...');
      const similarRegistrations = await prisma.registration.findMany({
        where: {
          id: {
            startsWith: registrationId.substring(0, 10),
          },
        },
        select: {
          id: true,
          registrationNumber: true,
          status: true,
        },
        take: 5,
      });
      
      if (similarRegistrations.length > 0) {
        console.log('');
        console.log('📋 IDs similares encontrados:');
        similarRegistrations.forEach((reg) => {
          console.log(`   - ${reg.id} (Número: #${reg.registrationNumber}, Status: ${reg.status})`);
        });
        console.log('');
      }
      
      // Listar inscrições pendentes para ajudar
      console.log('🔍 Buscando todas as inscrições pendentes...');
      const pendingRegistrations = await prisma.registration.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      
      if (pendingRegistrations.length > 0) {
        console.log('');
        console.log(`📋 Encontradas ${pendingRegistrations.length} inscrição(ões) pendente(s):`);
        console.log('');
        pendingRegistrations.forEach((reg, index) => {
          console.log(`   ${index + 1}. ID: ${reg.id}`);
          console.log(`      Número: #${reg.registrationNumber}`);
          console.log(`      Status: ${reg.status} | Payment: ${reg.paymentStatus || 'N/A'}`);
          console.log(`      Criado: ${reg.createdAt.toLocaleString('pt-BR')}`);
          console.log('');
        });
        console.log('💡 Use um dos IDs acima para sincronizar');
      } else {
        console.log('   Nenhuma inscrição pendente encontrada');
      }
      
      // Tentar buscar por qualquer registro (para debug)
      console.log('');
      console.log('🔍 Verificando se há registros no banco...');
      const totalCount = await prisma.registration.count();
      console.log(`   Total de inscrições no banco: ${totalCount}`);
      
      if (totalCount > 0) {
        const firstReg = await prisma.registration.findFirst({
          select: { id: true, registrationNumber: true },
        });
        console.log(`   Exemplo de ID: ${firstReg?.id}`);
        console.log(`   Formato do ID: ${firstReg?.id?.length} caracteres`);
      }
      
      console.error('');
      console.error('📋 Para ver todas as inscrições:');
      console.error('   npm run db:studio');
      console.error('   Ou execute SQL: SELECT id, "registrationNumber", status FROM registrations;');
      process.exit(1);
    }

    console.log('✅ Inscrição encontrada:');
    console.log('   ID:', registration.id);
    console.log('   Número:', registration.registrationNumber);
    console.log('   Status atual:', registration.status);
    console.log('   Payment Status:', registration.paymentStatus);
    console.log('   Payment ID:', registration.paymentId || '(não salvo)');
    console.log('   Evento:', registration.event?.name || 'N/A');
    console.log('   Criado em:', registration.createdAt);
    console.log('');

    // 2. Obter token OAuth do organizador (necessário para buscar payment)
    if (!registration.event.organizer.mpAccessToken) {
      console.error('❌ Organizador não tem token OAuth configurado');
      console.error('   A conta Mercado Pago precisa estar conectada via OAuth');
      process.exit(1);
    }
    
    console.log('🔐 Descriptografando token OAuth do organizador...');
    let mpAccessToken;
    try {
      const tokens = await decryptOAuthTokens({
        encryptedAccessToken: registration.event.organizer.mpAccessToken,
        encryptedRefreshToken: '',
      });
      mpAccessToken = tokens.accessToken;
      console.log('   ✅ Token descriptografado');
    } catch (error) {
      console.error('❌ Erro ao descriptografar token OAuth:', error.message);
      console.error('   Possível causa: ENCRYPTION_KEY diferente ou token corrompido');
      console.error('   Solução: Reconecte a conta Mercado Pago via OAuth');
      process.exit(1);
    }
    
    // 3. Buscar payment no MP
    let mpPaymentId = registration.paymentId;
    
    // Se não tem paymentId, tentar buscar pelo external_reference
    if (!mpPaymentId) {
      console.log('🔍 Payment ID não encontrado no banco. Buscando no MP pelo external_reference...');
      console.log('   External Reference:', registrationId);
      
      const searchResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${registrationId}`,
        {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`   Resposta: ${searchData.results?.length || 0} resultado(s) encontrado(s)`);
        
        if (searchData.results && searchData.results.length > 0) {
          // Pegar o mais recente
          const latestPayment = searchData.results[0];
          mpPaymentId = latestPayment.id.toString();
          console.log('✅ Payment encontrado no MP:');
          console.log(`   Payment ID: ${mpPaymentId}`);
          console.log(`   Status: ${latestPayment.status}`);
          console.log(`   Valor: R$ ${latestPayment.transaction_amount}`);
        } else {
          console.warn('⚠️  Nenhum payment encontrado com esse external_reference');
        }
      } else {
        const errorText = await searchResponse.text();
        console.error('❌ Erro ao buscar payment:', errorText);
        console.error(`   Status: ${searchResponse.status} ${searchResponse.statusText}`);
      }
    } else {
      console.log('✅ Payment ID encontrado no banco:', mpPaymentId);
    }

    if (!mpPaymentId) {
      console.error('');
      console.error('❌ Payment ID não encontrado.');
      console.error('');
      console.error('💡 Possíveis causas:');
      console.error('   1. O pagamento ainda não foi criado no Mercado Pago');
      console.error('   2. O external_reference não está sendo enviado corretamente na preferência');
      console.error('   3. O token não tem permissão para buscar payments');
      console.error('   4. O pagamento foi feito com outra conta/credencial');
      console.error('');
      console.error('📋 Verifique:');
      console.error('   - Se a preferência foi criada com external_reference');
      console.error('   - Se o pagamento foi realmente processado no MP');
      console.error('   - Se o external_reference na preferência corresponde ao registrationId');
      process.exit(1);
    }

    // 4. Buscar detalhes do pagamento no MP
    console.log('');
    console.log('🔍 Buscando detalhes do pagamento no MP...');

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
      {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('❌ Erro ao buscar pagamento no MP:', errorText);
      process.exit(1);
    }

    const payment = await paymentResponse.json();
    const paymentStatus = payment.status;

    console.log('✅ Payment encontrado no MP:');
    console.log('   Payment ID:', payment.id);
    console.log('   Status:', paymentStatus);
    console.log('   External Reference:', payment.external_reference);
    console.log('   Transaction Amount:', payment.transaction_amount);
    console.log('');

    // 4. Atualizar status baseado no status do MP
    if (paymentStatus === 'approved' && registration.status !== 'CONFIRMED') {
      console.log('🔄 Atualizando status para CONFIRMED...');
      
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentId: mpPaymentId,
          paymentStatus: 'APPROVED',
          status: 'CONFIRMED',
          paymentMethod: payment.payment_type_id,
          confirmedAt: new Date(),
        },
      });

      console.log('✅ Status atualizado com sucesso!');
      console.log('   Novo status: CONFIRMED');
      console.log('   Payment Status: APPROVED');
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      console.log('🔄 Atualizando status para CANCELLED...');
      
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentId: mpPaymentId,
          paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
          status: 'CANCELLED',
        },
      });

      console.log('✅ Status atualizado para CANCELLED');
    } else {
      console.log('ℹ️  Status já está atualizado ou é intermediário');
      console.log('   Status atual:', registration.status);
      console.log('   Status no MP:', paymentStatus);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse arguments
const args = process.argv.slice(2);
const registrationId = args[0];

if (!registrationId) {
  console.log('📋 Uso:');
  console.log('   node scripts/sync-payment-direct.js <registrationId>');
  console.log('');
  console.log('💡 Exemplo:');
  console.log('   node scripts/sync-payment-direct.js cmjh9g9nd000cy4sggon4gxa8');
  process.exit(1);
}

syncPaymentDirect(registrationId);

