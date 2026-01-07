# 🔧 Configuração do Banco de Dados

## Problema: "Can't reach database server at localhost:51214"

A URL `localhost:51214` é uma porta de proxy local do Neon que não está ativa. Você precisa usar a URL direta do banco na nuvem.

## ✅ Solução: Obter URL Direta do Banco

### Opção 1: Neon (Recomendado)

1. Acesse: https://console.neon.tech
2. Faça login na sua conta
3. Selecione seu projeto
4. Vá em **Connection Details** ou **Dashboard**
5. Procure por **Connection string** ou **Direct connection**
6. Copie a URL que começa com `postgresql://` (NÃO a do Prisma Accelerate)
7. Cole no `.env`:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Exemplo de URL Neon:**
```
postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Opção 2: Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Database**
4. Role até **Connection string**
5. Selecione **URI** (não Session mode)
6. Copie a URL e cole no `.env`

**Exemplo de URL Supabase:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Opção 3: PostgreSQL Local (Docker)

Se preferir usar um banco local:

```bash
# Criar container PostgreSQL
docker run --name okesports-postgres \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=okesports \
  -p 5432:5432 \
  -d postgres:14

# URL no .env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/okesports"
```

## 🔍 Verificar Conexão

Após configurar a URL correta:

```bash
npm run db:check
```

Se funcionar, você verá:
```
✅ Conexão estabelecida com sucesso!
✅ Query executada com sucesso!
```

## ⚠️ Importante

- **NÃO use** URLs do tipo `prisma+postgres://` (Prisma Accelerate) se não estiver configurado
- **NÃO use** URLs com `localhost:51214` (proxy local do Neon) se o serviço não estiver rodando
- **USE** URLs diretas do tipo `postgresql://host:port/database`

## 🆘 Ainda com problemas?

1. Verifique se o banco está ativo no painel (Neon/Supabase)
2. Verifique se a senha está correta
3. Verifique se o firewall permite conexões
4. Teste a conexão com: `npm run db:check`
