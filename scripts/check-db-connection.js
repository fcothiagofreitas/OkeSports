const { PrismaClient } = require('@prisma/client');

async function checkConnection() {
  console.log('🔍 Verificando conexão com o banco de dados...\n');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurada!');
    console.error('💡 Execute: npm run db:setup-env');
    process.exit(1);
  }

  // Se for localhost, tentar garantir que o banco está rodando
  if (process.env.DATABASE_URL.includes('localhost')) {
    const { execSync } = require('child_process');
    try {
      console.log('🔄 Verificando se PostgreSQL local está rodando...');
      execSync('npm run db:ensure', { stdio: 'ignore' });
    } catch (e) {
      // Ignorar erros - pode não ter Docker ou já estar rodando
    }
  }

  // Mascarar senha na URL para exibição
  const maskedUrl = process.env.DATABASE_URL.replace(
    /:\/\/[^:]+:[^@]+@/,
    '://***:***@'
  );
  console.log('📝 DATABASE_URL:', maskedUrl);
  console.log('');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Tentar conectar
    console.log('🔄 Tentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar uma query simples (usar findFirst ao invés de $queryRaw para evitar problemas com Accelerate)
    console.log('🔄 Testando query...');
    try {
      // Tentar uma query simples usando métodos normais do Prisma
      const testResult = await prisma.$executeRaw`SELECT 1`;
      console.log('✅ Query executada com sucesso!\n');
    } catch (queryError) {
      // Se $executeRaw falhar, tentar uma query mais simples
      try {
        await prisma.user.findFirst({ take: 1 });
        console.log('✅ Query executada com sucesso!\n');
      } catch (findError) {
        throw queryError; // Re-throw o erro original
      }
    }

    // Verificar se há tabelas (usar método mais compatível)
    try {
      const userCount = await prisma.user.count();
      console.log('📊 Tabelas encontradas: Sim');
      console.log(`   Usuários no banco: ${userCount}`);
    } catch (countError) {
      console.log('📊 Não foi possível verificar tabelas (pode ser normal se o banco estiver vazio)');
    }
    console.log('');

    console.log('✅ Tudo funcionando corretamente!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:\n');
    console.error('   Código:', error.code || 'N/A');
    console.error('   Mensagem:', error.message);
    console.error('');

    if (error.code === 'P5010') {
      console.error('💡 Este erro geralmente indica:');
      console.error('   1. O Prisma Client não foi gerado - Execute: npm run db:generate');
      console.error('   2. O banco de dados não está rodando');
      console.error('   3. A URL de conexão está incorreta');
      console.error('   4. Problemas de rede/firewall');
    } else if (error.code === 'P1001') {
      console.error('💡 Erro de conexão - Verifique se o banco está rodando');
    } else if (error.code === 'P1000') {
      console.error('💡 Erro de autenticação - Verifique usuário e senha na DATABASE_URL');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
