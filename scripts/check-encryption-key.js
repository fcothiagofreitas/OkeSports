#!/usr/bin/env node

/**
 * Script para verificar se a ENCRYPTION_KEY está configurada corretamente
 */

require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

console.log('🔑 Verificação da ENCRYPTION_KEY');
console.log('================================\n');

if (!ENCRYPTION_KEY) {
  console.error('❌ ERRO: ENCRYPTION_KEY não está definida no .env!');
  console.error('\n💡 Adicione no .env:');
  console.error('   ENCRYPTION_KEY="sua-chave-hex-de-64-caracteres"');
  console.error('\n📝 Para gerar uma chave válida:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const keyLength = ENCRYPTION_KEY.length;
const expectedLength = 64; // 32 bytes = 64 caracteres hex

console.log('📋 Informações da chave:');
console.log(`   Tamanho: ${keyLength} caracteres`);
console.log(`   Esperado: ${expectedLength} caracteres (32 bytes em hex)`);
console.log(`   Válida: ${keyLength === expectedLength ? '✅ SIM' : '❌ NÃO'}`);

// Verificar se é hexadecimal válido
const hexRegex = /^[0-9a-fA-F]+$/;
const isValidHex = hexRegex.test(ENCRYPTION_KEY);

console.log(`   Formato hex: ${isValidHex ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

if (keyLength !== expectedLength) {
  console.error('\n❌ ERRO: Tamanho incorreto!');
  console.error(`   A chave deve ter exatamente ${expectedLength} caracteres hexadecimais`);
  console.error('\n💡 Para gerar uma nova chave:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

if (!isValidHex) {
  console.error('\n❌ ERRO: Formato inválido!');
  console.error('   A chave deve conter apenas caracteres hexadecimais (0-9, a-f, A-F)');
  process.exit(1);
}

console.log('\n✅ ENCRYPTION_KEY está configurada corretamente!');
console.log(`   Primeiros 10 chars: ${ENCRYPTION_KEY.substring(0, 10)}...`);
console.log(`   Últimos 10 chars: ...${ENCRYPTION_KEY.substring(keyLength - 10)}`);

// Testar criptografia/descriptografia
console.log('\n🧪 Testando criptografia/descriptografia...');
try {
  const crypto = require('crypto');
  const ALGORITHM = 'aes-256-gcm';
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  // Testar criptografia
  const testText = 'test-token-12345';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(testText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  const encryptedData = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  
  // Testar descriptografia
  const parts = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(parts[0], 'hex'));
  decipher.setAuthTag(Buffer.from(parts[1], 'hex'));
  let decrypted = decipher.update(parts[2], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  if (decrypted === testText) {
    console.log('✅ Teste de criptografia/descriptografia: SUCESSO');
  } else {
    console.error('❌ Teste falhou: texto descriptografado não corresponde ao original');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erro ao testar criptografia:', error.message);
  process.exit(1);
}

console.log('\n✅ Tudo OK! A ENCRYPTION_KEY está funcionando corretamente.');

