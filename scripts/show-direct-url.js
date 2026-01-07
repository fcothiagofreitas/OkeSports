#!/usr/bin/env node

/**
 * Script para mostrar a URL direta extraída do Prisma Accelerate
 * (para copiar manualmente no .env)
 */

function convertAccelerateToDirect(url) {
  if (!url.startsWith('prisma+postgres://')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const apiKey = urlObj.searchParams.get('api_key');
    
    if (!apiKey) {
      return null;
    }

    // Decodificar base64
    let base64 = apiKey;
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    
    let databaseUrl = data.databaseUrl || data.shadowDatabaseUrl;
    
    if (databaseUrl) {
      // Converter postgres:// para postgresql://
      if (databaseUrl.startsWith('postgres://')) {
        databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
      }
      
      // Limpar parâmetros restritivos
      try {
        const urlObj = new URL(databaseUrl);
        const essentialParams = ['sslmode'];
        const newParams = new URLSearchParams();
        for (const key of essentialParams) {
          if (urlObj.searchParams.has(key)) {
            newParams.set(key, urlObj.searchParams.get(key));
          }
        }
        urlObj.search = newParams.toString();
        return urlObj.toString();
      } catch (e) {
        return databaseUrl;
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
  
  return null;
}

// Pegar URL do argumento ou variável de ambiente
const accelerateUrl = process.argv[2] || process.env.DATABASE_URL;

if (!accelerateUrl) {
  console.error('❌ Forneça a URL do Prisma Accelerate como argumento');
  console.error('   Exemplo: node scripts/show-direct-url.js "prisma+postgres://..."');
  console.error('   Ou configure DATABASE_URL no ambiente');
  process.exit(1);
}

console.log('🔍 Convertendo URL do Prisma Accelerate...\n');

const directUrl = convertAccelerateToDirect(accelerateUrl);

if (directUrl) {
  console.log('✅ URL direta extraída:\n');
  console.log(directUrl);
  console.log('\n💡 Copie esta URL e cole no seu .env como:');
  console.log(`   DATABASE_URL="${directUrl}"`);
} else {
  console.error('❌ Não foi possível converter a URL');
  console.error('💡 Verifique se a URL está no formato: prisma+postgres://...');
  process.exit(1);
}
