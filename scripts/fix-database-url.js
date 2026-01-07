#!/usr/bin/env node

/**
 * Script para converter DATABASE_URL do formato Prisma Accelerate para formato direto
 * ou vice-versa, dependendo da necessidade
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function parseEnvFile(content) {
  const lines = content.split('\n');
  const env = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
  }
  
  return env;
}

function writeEnvFile(filePath, env) {
  const lines = [];
  
  for (const [key, value] of Object.entries(env)) {
    // Preservar valores que contêm espaços ou caracteres especiais com aspas
    const needsQuotes = value.includes(' ') || value.includes('$') || value.includes('#');
    const formattedValue = needsQuotes ? `"${value}"` : value;
    lines.push(`${key}=${formattedValue}`);
  }
  
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

function convertAccelerateToDirect(url) {
  // Extrair a URL real do formato prisma+postgres://
  if (url.startsWith('prisma+postgres://')) {
    // Decodificar o api_key se necessário
    try {
      const urlObj = new URL(url);
      const apiKey = urlObj.searchParams.get('api_key');
      
      if (apiKey) {
        // api_key pode ser um JWT (header.payload.signature) ou base64 direto
        let decoded;
        
        if (apiKey.includes('.')) {
          // É um JWT - pegar o payload (segunda parte)
          const parts = apiKey.split('.');
          if (parts.length >= 2) {
            let payload = parts[1];
            // Adicionar padding se necessário para base64
            while (payload.length % 4) {
              payload += '=';
            }
            decoded = Buffer.from(payload, 'base64').toString('utf-8');
          } else {
            throw new Error('JWT inválido');
          }
        } else {
          // É base64 direto
          let base64 = apiKey;
          while (base64.length % 4) {
            base64 += '=';
          }
          decoded = Buffer.from(base64, 'base64').toString('utf-8');
        }
        
        const data = JSON.parse(decoded);
        
        let databaseUrl = null;
        if (data.databaseUrl) {
          databaseUrl = data.databaseUrl;
        } else if (data.shadowDatabaseUrl) {
          databaseUrl = data.shadowDatabaseUrl;
        }
        
        if (databaseUrl) {
          // Converter postgres:// para postgresql:// (formato padrão)
          if (databaseUrl.startsWith('postgres://')) {
            databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
          }
          
          // Remover parâmetros de conexão restritivos para desenvolvimento
          // (connection_limit=1, single_use_connections=true, etc)
          try {
            const urlObj = new URL(databaseUrl);
            // Manter apenas parâmetros essenciais
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
            // Se falhar ao parsear, retornar a URL original
            return databaseUrl;
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao decodificar URL do Accelerate:', error.message);
      console.error('   Detalhes:', error.stack);
    }
  }
  
  return null; // Retornar null se não conseguir converter
}

function main() {
  console.log('🔍 Verificando DATABASE_URL...\n');
  
  const envContent = readEnvFile(envPath);
  
  if (!envContent) {
    console.error('❌ Arquivo .env não encontrado!');
    console.error('💡 Crie um arquivo .env com a variável DATABASE_URL');
    process.exit(1);
  }
  
  const env = parseEnvFile(envContent);
  const currentUrl = env.DATABASE_URL;
  
  if (!currentUrl) {
    console.error('❌ DATABASE_URL não encontrada no .env!');
    process.exit(1);
  }
  
  // Mascarar URL para exibição
  const maskedUrl = currentUrl.replace(
    /:\/\/[^:]+:[^@]+@/,
    '://***:***@'
  );
  console.log('📝 DATABASE_URL atual:', maskedUrl);
  console.log('');
  
  if (currentUrl.startsWith('prisma+postgres://')) {
    console.log('⚠️  Detectado formato Prisma Accelerate/Data Proxy');
    console.log('💡 Convertendo para formato direto...\n');
    
    const directUrl = convertAccelerateToDirect(currentUrl);
    
    if (directUrl && directUrl !== currentUrl) {
      env.DATABASE_URL = directUrl;
      writeEnvFile(envPath, env);
      
      const maskedDirect = directUrl.replace(
        /:\/\/[^:]+:[^@]+@/,
        '://***:***@'
      );
      console.log('✅ Convertido para:', maskedDirect);
      console.log('');
      console.log('💡 Agora você pode usar conexão direta ao PostgreSQL');
      console.log('💡 Execute: npm run db:check para testar');
    } else {
      console.error('❌ Não foi possível converter a URL automaticamente');
      console.error('');
      console.error('💡 A URL do Prisma Accelerate contém a URL real do banco.');
      console.error('💡 Você precisa acessar o painel do Prisma Accelerate ou Neon/Supabase');
      console.error('   para obter a URL direta do banco de dados.');
      console.error('');
      console.error('💡 Formato esperado:');
      console.error('   postgresql://user:password@host:port/database');
      console.error('');
      console.error('💡 Se estiver usando Neon:');
      console.error('   1. Acesse https://console.neon.tech');
      console.error('   2. Vá em Connection Details');
      console.error('   3. Copie a "Connection string" (não a do Accelerate)');
      console.error('');
      console.error('💡 Se estiver usando Supabase:');
      console.error('   1. Acesse o projeto no Supabase');
      console.error('   2. Vá em Settings > Database');
      console.error('   3. Copie a "Connection string"');
      process.exit(1);
    }
  } else if (currentUrl.startsWith('postgresql://') || currentUrl.startsWith('postgres://')) {
    console.log('✅ DATABASE_URL já está no formato direto');
    console.log('💡 Formato correto para conexão direta');
  } else {
    console.error('❌ Formato de DATABASE_URL não reconhecido');
    console.error('💡 Use um dos formatos:');
    console.error('   - postgresql://user:password@host:port/database (direto)');
    console.error('   - prisma+postgres://... (Accelerate - requer configuração adicional)');
    process.exit(1);
  }
}

main();
