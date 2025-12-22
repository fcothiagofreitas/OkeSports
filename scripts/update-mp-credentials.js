#!/usr/bin/env node

/**
 * Script para atualizar credenciais do Mercado Pago no .env
 * Ajuda a substituir credenciais de produção por credenciais de teste
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(process.cwd(), '.env');

// Verificar se .env existe
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  console.error('   Crie um arquivo .env na raiz do projeto');
  process.exit(1);
}

// Ler .env atual
let envContent = fs.readFileSync(envPath, 'utf8');

// Verificar se já tem as variáveis
const hasClientId = /^MP_CLIENT_ID=/m.test(envContent);
const hasClientSecret = /^MP_CLIENT_SECRET=/m.test(envContent);

console.log('🔧 Atualização de Credenciais do Mercado Pago');
console.log('=============================================\n');

if (!hasClientId || !hasClientSecret) {
  console.log('⚠️  Variáveis MP_CLIENT_ID ou MP_CLIENT_SECRET não encontradas no .env');
  console.log('   Adicionando novas variáveis...\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    console.log('📝 Para obter credenciais de TESTE:');
    console.log('   1. Acesse: https://www.mercadopago.com.br/developers/panel/app');
    console.log('   2. Certifique-se de estar no modo SANDBOX/TESTE (canto superior direito)');
    console.log('   3. Crie ou selecione uma aplicação Marketplace de TESTE');
    console.log('   4. Copie CLIENT_ID e CLIENT_SECRET de TESTE\n');

    // Obter CLIENT_ID
    const clientId = await question('🔑 MP_CLIENT_ID (ou Enter para manter atual): ');
    
    // Obter CLIENT_SECRET
    const clientSecret = await question('🔑 MP_CLIENT_SECRET (ou Enter para manter atual): ');

    // Atualizar .env
    let updated = false;

    // Atualizar ou adicionar MP_CLIENT_ID
    if (clientId.trim()) {
      if (hasClientId) {
        // Substituir linha existente
        envContent = envContent.replace(
          /^MP_CLIENT_ID=.*$/m,
          `MP_CLIENT_ID="${clientId.trim()}"`
        );
      } else {
        // Adicionar no final
        envContent += `\nMP_CLIENT_ID="${clientId.trim()}"\n`;
      }
      updated = true;
      console.log('✅ MP_CLIENT_ID atualizado');
    }

    // Atualizar ou adicionar MP_CLIENT_SECRET
    if (clientSecret.trim()) {
      if (hasClientSecret) {
        // Substituir linha existente
        envContent = envContent.replace(
          /^MP_CLIENT_SECRET=.*$/m,
          `MP_CLIENT_SECRET="${clientSecret.trim()}"`
        );
      } else {
        // Adicionar no final
        envContent += `MP_CLIENT_SECRET="${clientSecret.trim()}"\n`;
      }
      updated = true;
      console.log('✅ MP_CLIENT_SECRET atualizado');
    }

    if (!updated) {
      console.log('ℹ️  Nenhuma alteração feita');
      rl.close();
      return;
    }

    // Salvar .env
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ Arquivo .env atualizado com sucesso!');
    console.log('\n🔄 Próximos passos:');
    console.log('   1. Reinicie o servidor (Ctrl+C e depois npm run dev)');
    console.log('   2. Execute: node scripts/check-mp-credentials.js');
    console.log('   3. Verifique se as credenciais são de TESTE');

  } catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

