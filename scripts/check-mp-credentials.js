#!/usr/bin/env node

/**
 * Script para verificar credenciais do Mercado Pago
 * Verifica se as credenciais são de teste ou produção
 */

require('dotenv').config();

const clientId = process.env.MP_CLIENT_ID || '';
const clientSecret = process.env.MP_CLIENT_SECRET || '';

console.log('🔍 Verificando credenciais do Mercado Pago\n');

// Verificar CLIENT_ID
console.log('📋 MP_CLIENT_ID:');
if (clientId.length === 0) {
  console.log('   ❌ Não definido');
} else {
  console.log(`   Valor: ${clientId.substring(0, 20)}...`);
  
  const isTest = 
    clientId.includes('TEST') || 
    clientId.includes('test') || 
    clientId.includes('sandbox') ||
    /^\d+$/.test(clientId);
  
  if (isTest) {
    console.log('   ✅ Parece ser de TESTE');
  } else {
    console.log('   ⚠️  Parece ser de PRODUÇÃO');
    console.log('   ⚠️  Isso causará erro "Uma das partes é de teste"');
  }
}

console.log('');

// Verificar CLIENT_SECRET
console.log('📋 MP_CLIENT_SECRET:');
if (clientSecret.length === 0) {
  console.log('   ❌ Não definido');
} else {
  console.log(`   Valor: ${clientSecret.substring(0, 20)}...`);
  
  const isTest = 
    clientSecret.startsWith('TEST-') ||
    clientSecret.includes('TEST') ||
    clientSecret.includes('test') ||
    clientSecret.includes('sandbox');
  
  if (isTest) {
    console.log('   ✅ Parece ser de TESTE');
  } else {
    console.log('   ⚠️  Parece ser de PRODUÇÃO');
    console.log('   ⚠️  Isso causará erro "Uma das partes é de teste"');
  }
}

console.log('');

// Verificação final
const isClientIdTest = 
  clientId.length > 0 && (
    clientId.includes('TEST') || 
    clientId.includes('test') || 
    clientId.includes('sandbox') ||
    /^\d+$/.test(clientId)
  );

const isClientSecretTest = 
  clientSecret.length > 0 && (
    clientSecret.startsWith('TEST-') ||
    clientSecret.includes('TEST') ||
    clientSecret.includes('test') ||
    clientSecret.includes('sandbox')
  );

if (clientId.length === 0 || clientSecret.length === 0) {
  console.log('❌ Credenciais não estão definidas no .env');
  console.log('   Adicione MP_CLIENT_ID e MP_CLIENT_SECRET no .env');
} else if (!isClientIdTest || !isClientSecretTest) {
  console.log('🚨 PROBLEMA: Credenciais são de PRODUÇÃO!');
  console.log('');
  console.log('💡 SOLUÇÃO:');
  console.log('   1. Acesse: https://www.mercadopago.com.br/developers/panel/app');
  console.log('   2. Certifique-se de estar no modo SANDBOX/TESTE');
  console.log('   3. Crie uma aplicação Marketplace de TESTE');
  console.log('   4. Copie CLIENT_ID e CLIENT_SECRET de TESTE');
  console.log('   5. Atualize .env com as credenciais de teste');
  console.log('   6. Reinicie o servidor');
  process.exit(1);
} else {
  console.log('✅ Credenciais são de TESTE - Tudo OK!');
  console.log('');
  console.log('💡 Dica: Se ainda tiver erro "Uma das partes é de teste":');
  console.log('   - Verifique se o token OAuth do organizador também é de teste');
  console.log('   - O organizador deve conectar usando conta de TESTE do Mercado Pago');
}

