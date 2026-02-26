# 🏃 Okê Sports

**Plataforma Marketplace para Inscrições em Eventos Esportivos**

Sistema SaaS que conecta organizadores de eventos esportivos com participantes (atletas), facilitando inscrições, pagamentos e gestão de eventos através de split payment automático.

---

## 🎯 Diferenciais

- **Modelo Marketplace:** Dinheiro vai DIRETO para o organizador via split payment
- **Zero risco financeiro:** Plataforma não retém valores
- **Mais barato:** Taxa única de 10% (vs 12% da concorrência)
- **Repasse D+0:** PIX instantâneo, sem taxa de repasse
- **OAuth Mercado Pago:** Organizador conecta sua própria conta

---

## 🛠 Stack Tecnológico

### Frontend

- **Next.js 14+** (App Router, Server Components)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **React Hook Form** + Zod
- **Zustand** (state management)

### Backend

- **Next.js API Routes** (REST)
- **TypeScript**
- **PostgreSQL 14+** (Neon/Supabase)
- **Prisma ORM**

### Pagamentos

- **Mercado Pago Marketplace** (OAuth + Split Payment)
- **Formas:** PIX, Cartão (até 12x), Boleto

### Outros

- **Resend** (emails transacionais)
- **AWS S3 / Cloudflare R2** (storage)
- **Redis / Upstash** (cache)

---

## 📋 Pré-requisitos

- **Node.js** 18+
- **npm** ou **yarn**
- **PostgreSQL** 14+ (ou Neon/Supabase)
- **Git**

---

## 🚀 Setup do Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/fcothiagofreitas/OkeSports.git
cd OkeSports
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

**Variáveis OBRIGATÓRIAS para rodar localmente:**

```env
# Database (use Neon ou Supabase para começar rápido)
DATABASE_URL="postgresql://user:password@localhost:5432/okesports"

# Auth (gere com: openssl rand -base64 32)
JWT_SECRET="seu-secret-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui"
ENCRYPTION_KEY="seu-encryption-key-32-bytes-hex"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Configure o banco de dados

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas no banco (desenvolvimento)
npm run db:push

# OU rodar migrations (produção)
npm run db:migrate
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📂 Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Grupo: login, register
│   ├── (dashboard)/       # Grupo: área do organizador
│   ├── (public)/          # Landing pages públicas
│   └── api/               # API routes
│       ├── auth/
│       ├── events/
│       ├── payments/
│       └── webhooks/
├── components/
│   ├── ui/                # Componentes base (shadcn)
│   └── features/          # Componentes de feature
│       ├── auth/
│       ├── events/
│       └── payments/
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # JWT helpers
│   ├── mercadopago.ts    # MP SDK wrapper
│   └── email.ts          # Resend wrapper
├── types/                # TypeScript types
└── utils/                # Funções auxiliares
```

---

## 🗂 Modelo de Dados

### Entidades Principais

- **User** (Organizador) - Dados pessoais + OAuth Mercado Pago
- **Participant** (Atleta) - CPF, endereço, histórico
- **Event** - Evento esportivo com modalidades
- **Modality** - 5km, 10km, 21km, etc
- **Batch** - Lotes de preço por data ou volume
- **Coupon** - Cupons de desconto
- **Registration** - Inscrição com valores e pagamento

Veja o schema completo em: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Rodar build de produção

# Prisma
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Atualizar schema (dev)
npm run db:migrate       # Rodar migrations (prod)
npm run db:studio        # Abrir Prisma Studio (GUI)
npm run sync:external:fcat # Sincronizar corridas da FCAt

# Qualidade de código
npm run lint             # Rodar ESLint
npm run format           # Formatar com Prettier
npm run format:check     # Verificar formatação
npm run type-check       # Verificar TypeScript
```

---

## 🏁 Corridas do Ceará (FCAt)

- Home pública mostra:
- `Eventos cadastrados na OkeSports` (inscrição direta na plataforma)
- `Corridas de rua no Ceará (FCAt)` (fonte externa com link oficial)
- Sincronização manual:

```bash
# ano atual + próximo ano
npm run sync:external:fcat

# anos específicos
npm run sync:external:fcat -- 2026,2027
```

- Endpoint para cron/webhook:
- `POST /api/external-events/sync?years=2026,2027`
- Em produção, enviar `Authorization: Bearer <EXTERNAL_EVENTS_SYNC_TOKEN>`

---

## 🔐 Configuração do Mercado Pago

### 1. Criar Application no Mercado Pago

1. Acesse: [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Crie uma nova aplicação do tipo **Marketplace**
3. Obtenha as credenciais:
   - `MP_CLIENT_ID`
   - `MP_CLIENT_SECRET`
   - `MP_ACCESS_TOKEN` (sua conta para receber splits)
   - `MP_PUBLIC_KEY`

### 2. Configurar Redirect URI

No painel do Mercado Pago, adicione a URL de callback:

```
http://localhost:3000/api/auth/mp/callback (dev)
https://okesports.com.br/api/auth/mp/callback (prod)
```

### 3. Adicionar no .env

```env
MP_CLIENT_ID="123456789"
MP_CLIENT_SECRET="abc123xyz"
MP_ACCESS_TOKEN="APP_USR-okesports-token"
MP_PUBLIC_KEY="APP_USR-public-key"
MP_WEBHOOK_SECRET="seu-webhook-secret"
```

---

## 📊 Banco de Dados

### Opções para desenvolvimento

#### 1. PostgreSQL Local (Docker)

```bash
docker run --name okesports-postgres \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=okesports \
  -p 5432:5432 \
  -d postgres:14
```

#### 2. Neon (Serverless PostgreSQL) - Recomendado

1. Crie uma conta em [https://neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Copie a `DATABASE_URL` e adicione no `.env`

#### 3. Supabase

1. Crie uma conta em [https://supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a `DATABASE_URL` (Connection String) no `.env`

---

## 🔄 Fluxo de Split Payment

```
Atleta paga R$ 88,00 (inscrição R$ 80 + taxa R$ 8)
        ↓ (Mercado Pago divide AUTOMATICAMENTE)
        ├─ R$ 79,13 → Organizador (conta dele, D+0)
        └─ R$ 8,00  → Okê Sports (nossa conta)

✅ Automático | ✅ D+0 | ✅ Zero risco
```

Leia mais em: [`.claude.md`](.claude.md#fluxos-detalhados)

---

## 🧪 Testes (futuro)

```bash
npm run test           # Rodar testes
npm run test:watch     # Testes em modo watch
npm run test:e2e       # Testes end-to-end
```

---

## 📐 Convenções de Código

### Commits (Conventional Commits)

```
feat(auth): implementar login com JWT
fix(payment): corrigir validação de webhook
refactor(db): otimizar query de inscrições
docs(readme): adicionar instruções de setup
```

### Branches

```
feature/M1.1-setup-projeto
fix/payment-webhook-error
refactor/auth-middleware
docs/update-readme
```

### Nomenclatura

- **Componentes:** `PascalCase` (`EventCard.tsx`)
- **Funções:** `camelCase` (`createPayment()`)
- **Constantes:** `UPPER_SNAKE_CASE` (`MAX_UPLOAD_SIZE`)
- **Arquivos:** `kebab-case` (`user-profile.ts`)

---

## 🗺 Roadmap (resumido)

### ✅ Concluído

- [x] Planejamento estratégico
- [x] Stack tecnológico definido
- [x] Setup do projeto (M1.1)
- [x] Schema Prisma completo
- [x] Autenticação do organizador (JWT + refresh) – M1.2
- [x] Integração básica OAuth Mercado Pago (organizador) – M1.3
- [x] CRUD inicial de eventos e modalidades – início de M2

### 🚧 Em Andamento

- [ ] Consolidação de pagamentos (M3/M4)
  - Split payment com `marketplace_fee` (taxa 10%)
  - Fluxo completo de inscrição + criação de preference
  - Webhook Mercado Pago com validação de assinatura e idempotência

### 📅 Próximos

- [ ] Refinar dashboard do organizador (M4)
- [ ] Melhorar fluxo completo do atleta (M3/M5)
- [ ] Marketplace público e busca de eventos (M5)

Veja o roadmap completo em: [`Milestones_Oke_Sports_Completo.md`](Milestones_Oke_Sports_Completo.md)

---

## 📚 Documentação

- **[.claude.md](.claude.md)** - Contexto completo do projeto
- **[Decisoes_Estrategicas_Oke_Sports.md](Decisoes_Estrategicas_Oke_Sports.md)** - Decisões importantes
- **[TASKS_DETALHADAS.md](TASKS_DETALHADAS.md)** - Tasks quebradas (91 SP)
- **[Milestones_Oke_Sports_Completo.md](Milestones_Oke_Sports_Completo.md)** - M0-M16

---

## 🤝 Contribuindo

1. Pegue uma issue no GitHub
2. Crie uma branch: `git checkout -b feature/M1.1-nome`
3. Desenvolva + teste
4. Commit seguindo convenções
5. Push e abra PR
6. Code review (mínimo 1 aprovação)

---

## 📞 Links

- **GitHub:** [https://github.com/fcothiagofreitas/OkeSports](https://github.com/fcothiagofreitas/OkeSports)
- **Issues:** [https://github.com/fcothiagofreitas/OkeSports/issues](https://github.com/fcothiagofreitas/OkeSports/issues)

---

## 📄 Licença

ISC

---

**Desenvolvido com ❤️ para revolucionar inscrições esportivas no Brasil** 🏃🚴🏊
