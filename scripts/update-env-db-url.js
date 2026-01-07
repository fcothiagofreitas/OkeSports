#!/usr/bin/env node

/**
 * Atualiza DATABASE_URL no .env para usar PostgreSQL local
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const newUrl = 'postgresql://postgres:postgres@localhost:5434/okesports';

if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n');
let updated = false;

const newLines = lines.map(line => {
  if (line.trim().startsWith('DATABASE_URL=')) {
    updated = true;
    return `DATABASE_URL="${newUrl}"`;
  }
  return line;
});

if (!updated) {
  // Adicionar no final se não existir
  newLines.push(`DATABASE_URL="${newUrl}"`);
}

fs.writeFileSync(envPath, newLines.join('\n'), 'utf-8');

console.log('✅ DATABASE_URL atualizada no .env');
console.log(`   ${newUrl}`);
