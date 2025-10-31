# TASKS DETALHADAS - OKÊ SPORTS
## Breakdown completo dos Milestones em Issues

**Versão:** 1.0
**Data:** 31/10/2025

---

## 📋 **LEGENDA**

- **Estimativa:** Story Points (1 = 2-4h, 2 = 4-8h, 3 = 1-2 dias, 5 = 2-3 dias, 8 = 1 semana)
- **Prioridade:** P0 (crítico), P1 (alto), P2 (médio), P3 (baixo)
- **Labels:** `frontend`, `backend`, `infra`, `design`, `docs`, `bug`, `feature`

---

# FASE 0: VALIDAÇÃO DE MERCADO

## **M0: Pesquisa e Validação (1 semana)**

### 📊 **M0.1: Pesquisa com Organizadores**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `research`

**Checklist:**
- [ ] Criar roteiro de entrevista estruturado
- [ ] Identificar 15-20 organizadores para contatar
- [ ] Realizar 10+ entrevistas (30-45min cada)
- [ ] Documentar feedbacks e dores
- [ ] Validar disposição a conectar conta de gateway
- [ ] Definir faixa de preço aceitável

**Perguntas-chave:**
- Como você gerencia inscrições hoje?
- Quanto paga de taxa atualmente?
- Aceitaria conectar sua conta do Mercado Pago?
- Quanto pagaria por uma solução melhor?

---

### 📈 **M0.2: Análise de Concorrência**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `research`

**Checklist:**
- [ ] Mapear Ticket Sports (features, preços, UX)
- [ ] Mapear Sympla (caso usado para eventos)
- [ ] Mapear outras plataformas regionais
- [ ] Identificar gaps e oportunidades
- [ ] Criar matriz comparativa
- [ ] Definir diferencial competitivo

---

### ✅ **M0.3: Decisão Go/No-Go**
**Estimativa:** 2 SP | **Prioridade:** P0 | **Label:** `research`

**Checklist:**
- [ ] Consolidar dados das entrevistas
- [ ] Calcular viabilidade financeira
- [ ] Apresentar findings para stakeholders
- [ ] Tomar decisão Go/No-Go
- [ ] Definir modelo de precificação final
- [ ] Documentar premissas validadas

**Critérios de Go:**
- 70%+ dos entrevistados demonstram interesse real
- Dispostos a pagar 5-7% ou R$ 49-99/mês
- Aceitam modelo de marketplace (conectar gateway)
- Mercado com 50k+ eventos/ano no Brasil

---

# FASE 1: SUPER MVP

## **M1: Setup e Core Mínimo (Semana 1)**

### 🔧 **M1.1: Setup do Projeto**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `infra`

**Checklist:**
- [ ] Criar repositório no GitHub
- [ ] Setup Next.js 14 com App Router
- [ ] Configurar TypeScript + ESLint + Prettier
- [ ] Setup Tailwind CSS
- [ ] Configurar estrutura de pastas (src/app, src/components, etc)
- [ ] Criar README.md com instruções
- [ ] Setup .env.example

**Estrutura de Pastas:**
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   └── features/
├── lib/
└── types/
```

**Dependências principais:**
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0"
}
```

---

### 🗄️ **M1.2: Setup PostgreSQL + Prisma**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `backend`, `infra`

**Checklist:**
- [ ] Criar conta no Neon/Supabase (PostgreSQL)
- [ ] Configurar DATABASE_URL
- [ ] Setup Prisma ORM
- [ ] Criar schema inicial (User, Event)
- [ ] Rodar primeira migration
- [ ] Setup Prisma Studio para debug
- [ ] Documentar comandos no README

**Schema Inicial (Prisma):**
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  company       String?

  // Gateway connection
  mpConnected   Boolean  @default(false)
  mpAccessToken String?  // encrypted
  mpRefreshToken String? // encrypted
  mpUserId      String?

  events        Event[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}

model Event {
  id          String   @id @default(cuid())
  name        String
  description String?
  date        DateTime
  location    String
  price       Decimal  @db.Decimal(10, 2)
  maxSlots    Int
  imageUrl    String?
  status      String   @default("draft") // draft, published

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  registrations Registration[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("events")
}

model Registration {
  id          String   @id @default(cuid())

  // Participant data
  name        String
  email       String
  cpf         String
  phone       String
  shirtSize   String?

  // Payment
  amount      Decimal  @db.Decimal(10, 2)
  paymentId   String?  // MP payment ID
  paymentStatus String @default("pending") // pending, paid, failed

  eventId     String
  event       Event    @relation(fields: [eventId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("registrations")
}
```

---

### 🔐 **M1.3: Autenticação (NextAuth ou JWT)**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `backend`, `security`

**Checklist:**
- [ ] Decidir: NextAuth.js ou JWT manual
- [ ] Implementar registro de usuário
- [ ] Hash de senha com bcrypt
- [ ] Login com email + senha
- [ ] Geração de JWT
- [ ] Middleware de autenticação
- [ ] Rotas protegidas
- [ ] Página de login/registro (UI básica)

**Rotas:**
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

**UI Pages:**
- `/login` - Página de login
- `/register` - Página de cadastro

---

### 🎨 **M1.4: Design System Básico**
**Estimativa:** 3 SP | **Prioridade:** P1 | **Label:** `frontend`, `design`

**Checklist:**
- [ ] Definir paleta de cores
- [ ] Escolher tipografia
- [ ] Criar componentes base:
  - [ ] Button
  - [ ] Input
  - [ ] Card
  - [ ] Badge
  - [ ] Alert
- [ ] Configurar shadcn/ui ou Headless UI
- [ ] Criar layout do dashboard

**Paleta sugerida:**
```css
:root {
  --primary: #2563eb; /* Blue */
  --secondary: #10b981; /* Green */
  --danger: #ef4444; /* Red */
  --warning: #f59e0b; /* Orange */
  --gray: #6b7280;
}
```

---

### 📄 **M1.5: CRUD de Eventos (Básico)**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Criar formulário de evento (apenas corrida)
- [ ] Validação de campos (Zod)
- [ ] Upload de 1 imagem (S3 ou Cloudflare R2)
- [ ] Salvar evento no banco
- [ ] Listar eventos do organizador
- [ ] Editar evento
- [ ] Alterar status (rascunho/publicado)
- [ ] Página de visualização do evento

**Campos do Formulário:**
- Nome do evento (required)
- Data (required)
- Local (required)
- Descrição (opcional)
- Valor da inscrição (required)
- Vagas disponíveis (required)
- Imagem (required)

**Rotas API:**
- `POST /api/events` - Criar evento
- `GET /api/events` - Listar eventos
- `GET /api/events/[id]` - Ver evento
- `PATCH /api/events/[id]` - Editar evento
- `DELETE /api/events/[id]` - Deletar evento

---

### 🔒 **M1.6: Segurança Básica + LGPD**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `security`, `legal`

**Checklist:**
- [ ] HTTPS obrigatório (Vercel já fornece)
- [ ] Rate limiting (API routes)
- [ ] Sanitização de inputs
- [ ] CORS configurado
- [ ] Helmet.js (headers de segurança)
- [ ] Criar página de Termos de Uso
- [ ] Criar página de Política de Privacidade
- [ ] Checkbox de aceite no cadastro

**Rate Limiting:**
```typescript
// lib/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
});
```

---

### 🚀 **M1.7: Deploy Staging**
**Estimativa:** 2 SP | **Prioridade:** P0 | **Label:** `infra`

**Checklist:**
- [ ] Criar projeto no Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Deploy automático em cada push (main)
- [ ] Configurar domínio staging (ex: staging.okesports.com.br)
- [ ] Testar deploy

**Variáveis de Ambiente:**
```
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## **M2: Marketplace + Pagamentos (Semanas 2-3)**

### 🔗 **M2.1: OAuth Mercado Pago - Autorização**
**Estimativa:** 8 SP | **Prioridade:** P0 | **Label:** `backend`, `payments`

**Checklist:**
- [ ] Criar aplicação no Mercado Pago Developers
- [ ] Obter CLIENT_ID e CLIENT_SECRET
- [ ] Implementar fluxo OAuth:
  - [ ] `GET /api/payments/connect/mp` - Redirect para MP
  - [ ] `GET /api/payments/callback/mp` - Callback OAuth
- [ ] Trocar code por access_token
- [ ] Salvar tokens (CRIPTOGRAFADOS) no banco
- [ ] Implementar refresh token automático
- [ ] Adicionar status de conexão no dashboard
- [ ] Botão "Conectar Mercado Pago"
- [ ] Botão "Desconectar"
- [ ] Tratamento de erros

**Fluxo:**
```
User → Clica "Conectar MP"
    → Redirect /api/payments/connect/mp
    → Redirect https://auth.mercadopago.com.br/...
    → User autoriza
    → Callback /api/payments/callback/mp
    → Salva tokens
    → Redirect dashboard (sucesso)
```

**Criptografia:**
```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY; // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

### 💳 **M2.2: Criar Pagamento PIX**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `backend`, `payments`

**Checklist:**
- [ ] SDK do Mercado Pago instalado
- [ ] Endpoint: `POST /api/payments/create`
- [ ] Criar pagamento PIX usando access_token do organizador
- [ ] Gerar QR Code PIX
- [ ] Retornar QR Code + código copia-e-cola
- [ ] Configurar split payment (taxa Okê Sports)
- [ ] Salvar payment_id na inscrição
- [ ] Página de pagamento (mostrar QR Code)

**Exemplo:**
```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: organizador.mpAccessToken
});

const payment = new Payment(client);

const result = await payment.create({
  body: {
    transaction_amount: 150.00,
    description: 'Inscrição Corrida São João',
    payment_method_id: 'pix',
    payer: {
      email: 'participante@email.com',
      identification: { type: 'CPF', number: '12345678900' }
    },
    application_fee: 7.50, // 5% para Okê Sports
    notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
    metadata: {
      registration_id: 'reg_123',
      event_id: 'evt_456'
    }
  }
});

return {
  qrCode: result.point_of_interaction.transaction_data.qr_code,
  qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
  paymentId: result.id
};
```

---

### 💳 **M2.3: Criar Pagamento Cartão de Crédito**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `backend`, `frontend`, `payments`

**Checklist:**
- [ ] Integrar Mercado Pago Checkout Pro ou Brick
- [ ] Formulário de cartão (frontend)
- [ ] Tokenização de cartão
- [ ] Criar pagamento com parcelamento (até 6x)
- [ ] Split payment configurado
- [ ] Tratamento de erros (cartão recusado)
- [ ] 3D Secure (se necessário)

**Frontend (React/Next.js):**
```tsx
import { CardPayment } from '@mercadopago/sdk-react';

<CardPayment
  initialization={{ amount: 150 }}
  onSubmit={async (formData) => {
    const response = await fetch('/api/payments/create-card', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    return response.json();
  }}
/>
```

---

### 🔔 **M2.4: Webhook de Confirmação**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `backend`, `payments`

**Checklist:**
- [ ] Endpoint: `POST /api/webhooks/mercadopago`
- [ ] Validar assinatura do webhook
- [ ] Processar eventos:
  - [ ] `payment.created`
  - [ ] `payment.updated`
  - [ ] `payment.approved`
  - [ ] `payment.rejected`
- [ ] Atualizar status da inscrição no banco
- [ ] Disparar email de confirmação (se aprovado)
- [ ] Logs detalhados
- [ ] Idempotência (não processar 2x)

**Exemplo:**
```typescript
export async function POST(req: Request) {
  const body = await req.json();

  // Validar assinatura
  const signature = req.headers.get('x-signature');
  if (!validateSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { type, data } = body;

  if (type === 'payment') {
    const paymentId = data.id;
    const payment = await mercadopago.payment.get(paymentId);

    // Atualizar inscrição
    await db.registration.update({
      where: { paymentId },
      data: {
        paymentStatus: payment.status === 'approved' ? 'paid' : 'failed'
      }
    });

    // Enviar email se aprovado
    if (payment.status === 'approved') {
      await sendConfirmationEmail(registration);
    }
  }

  return new Response('OK', { status: 200 });
}
```

---

### 📝 **M2.5: Formulário de Inscrição**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `frontend`

**Checklist:**
- [ ] Página pública: `/events/[slug]/register`
- [ ] Formulário com campos:
  - [ ] Nome completo
  - [ ] Email
  - [ ] CPF (validação)
  - [ ] Telefone
  - [ ] Tamanho de camisa
  - [ ] Checkbox termos
- [ ] Validação frontend (Zod)
- [ ] Resumo do pedido
- [ ] Botão "Finalizar Inscrição"
- [ ] Redirect para página de pagamento

---

### 📊 **M2.6: Dashboard do Organizador**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `frontend`, `backend`

**Checklist:**
- [ ] Página: `/dashboard`
- [ ] Overview:
  - [ ] Total de eventos
  - [ ] Total de inscrições
  - [ ] Total arrecadado
  - [ ] Status conexão gateway
- [ ] Lista de eventos (cards)
- [ ] Página: `/dashboard/events/[id]`
  - [ ] Detalhes do evento
  - [ ] Lista de inscritos
  - [ ] Filtro por status de pagamento
  - [ ] Exportar CSV
- [ ] Preview de valores líquidos (após taxas)

**API:**
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/events/[id]/registrations` - Inscrições

**Exportar CSV:**
```typescript
function exportToCSV(registrations: Registration[]) {
  const headers = ['Nome', 'Email', 'CPF', 'Status', 'Valor'];
  const rows = registrations.map(r => [
    r.name, r.email, r.cpf, r.paymentStatus, r.amount
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csv;
}
```

---

## **M3: Landing Page e Comunicação (Semana 4)**

### 🎨 **M3.1: Landing Page do Evento**
**Estimativa:** 8 SP | **Prioridade:** P0 | **Label:** `frontend`, `design`

**Checklist:**
- [ ] Página pública: `/events/[slug]`
- [ ] Template responsivo (mobile-first)
- [ ] Seções:
  - [ ] Hero (imagem + nome + data + local)
  - [ ] Descrição do evento
  - [ ] Informações (horário, endereço)
  - [ ] Valor + vagas disponíveis
  - [ ] CTA: "Inscreva-se Agora"
  - [ ] Footer com contato organizador
- [ ] Contador de vagas em tempo real
- [ ] Botão compartilhar (WhatsApp, Facebook)
- [ ] SEO: meta tags básicas

**Meta Tags:**
```tsx
<Head>
  <title>{event.name} | Okê Sports</title>
  <meta name="description" content={event.description} />
  <meta property="og:title" content={event.name} />
  <meta property="og:image" content={event.imageUrl} />
  <meta property="og:type" content="event" />
</Head>
```

---

### 📧 **M3.2: Setup Email (Resend)**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `backend`

**Checklist:**
- [ ] Criar conta no Resend
- [ ] Adicionar domínio e configurar DNS
- [ ] Instalar SDK: `npm install resend`
- [ ] Criar função helper: `sendEmail()`
- [ ] Testar envio

**Helper:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: 'Okê Sports <noreply@okesports.com.br>',
    to,
    subject,
    html
  });
}
```

---

### 📧 **M3.3: Templates de Email**
**Estimativa:** 5 SP | **Prioridade:** P0 | **Label:** `frontend`, `design`

**Checklist:**
- [ ] Email 1: Confirmação de inscrição (aguardando pagamento)
- [ ] Email 2: Pagamento confirmado (PIX)
- [ ] Email 3: Pagamento confirmado (Cartão)
- [ ] Email 4: Notificação ao organizador (nova inscrição)
- [ ] Templates responsivos (React Email ou MJML)
- [ ] Incluir QR Code no email (se aplicável)

**Usando React Email:**
```tsx
import { Html, Button } from '@react-email/components';

export function ConfirmationEmail({ name, eventName, qrCode }) {
  return (
    <Html>
      <h1>Olá {name}!</h1>
      <p>Sua inscrição em {eventName} foi confirmada!</p>
      <img src={qrCode} alt="QR Code" />
      <Button href="https://okesports.com.br/my-events">
        Ver minha inscrição
      </Button>
    </Html>
  );
}
```

**Integração:**
```typescript
import { render } from '@react-email/render';
import { ConfirmationEmail } from '@/emails/confirmation';

const html = render(ConfirmationEmail({ name, eventName, qrCode }));
await sendEmail({ to, subject: 'Inscrição confirmada!', html });
```

---

### 🚀 **M3.4: Deploy Produção**
**Estimativa:** 3 SP | **Prioridade:** P0 | **Label:** `infra`

**Checklist:**
- [ ] Configurar domínio produção (okesports.com.br)
- [ ] Atualizar DNS
- [ ] Deploy no Vercel (produção)
- [ ] Configurar variáveis de ambiente produção
- [ ] Testar fluxo completo end-to-end
- [ ] Setup monitoramento (Sentry)
- [ ] Setup uptime monitoring (Uptime Robot)

---

### 🧪 **M3.5: Testes End-to-End MVP**
**Estimativa:** 5 SP | **Prioridade:** P1 | **Label:** `testing`

**Checklist:**
- [ ] Teste 1: Cadastro de organizador
- [ ] Teste 2: Conectar Mercado Pago
- [ ] Teste 3: Criar evento
- [ ] Teste 4: Inscrição + pagamento PIX
- [ ] Teste 5: Inscrição + pagamento Cartão
- [ ] Teste 6: Webhook (aprovar pagamento)
- [ ] Teste 7: Email recebido
- [ ] Teste 8: Dashboard atualizado
- [ ] Teste 9: Exportar CSV

**Usar Playwright:**
```typescript
test('fluxo completo de inscrição', async ({ page }) => {
  // 1. Acessar landing page
  await page.goto('/events/corrida-sao-joao');

  // 2. Clicar em "Inscrever-se"
  await page.click('text=Inscrever-se');

  // 3. Preencher formulário
  await page.fill('input[name="name"]', 'João Silva');
  await page.fill('input[name="email"]', 'joao@test.com');
  // ...

  // 4. Submeter
  await page.click('button[type="submit"]');

  // 5. Verificar redirecionamento para pagamento
  await expect(page).toHaveURL(/\/payment/);

  // 6. Ver QR Code PIX
  await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
});
```

---

### 📝 **M3.6: Documentação MVP**
**Estimativa:** 2 SP | **Prioridade:** P1 | **Label:** `docs`

**Checklist:**
- [ ] Atualizar README.md
- [ ] Documentar variáveis de ambiente
- [ ] Documentar comandos principais
- [ ] Criar guia de setup local
- [ ] Documentar fluxo OAuth
- [ ] Criar CONTRIBUTING.md (se open source)

---

# CHECKPOINT 1 ✅

**Critérios de Sucesso:**
- [ ] 3-5 organizadores testando
- [ ] 1 evento real publicado
- [ ] 50+ inscrições processadas
- [ ] PIX + Cartão funcionando 100%
- [ ] Taxa de sucesso pagamento > 95%
- [ ] 0 bugs críticos

**Se não atingir:** Analisar feedback, ajustar e iterar antes de prosseguir para M4.

---

# FASE 2: CRESCIMENTO (após validação)

## **M4: Dashboard Avançado (2 semanas)**

### 📊 **M4.1: Gráficos e Métricas**
**Estimativa:** 5 SP | **Prioridade:** P1 | **Label:** `frontend`, `backend`

**Checklist:**
- [ ] Instalar lib de gráficos (Recharts ou Chart.js)
- [ ] Gráfico 1: Vendas por dia (últimos 30 dias)
- [ ] Gráfico 2: Taxa de conversão por evento
- [ ] Métrica: Ticket médio
- [ ] Métrica: Comparativo entre eventos
- [ ] Projeção de vendas (baseada em histórico)

---

### 🛒 **M4.2: Análise de Funil**
**Estimativa:** 5 SP | **Prioridade:** P2 | **Label:** `backend`, `analytics`

**Checklist:**
- [ ] Tracking de eventos:
  - [ ] Visualização da landing
  - [ ] Clique em "Inscrever-se"
  - [ ] Preenchimento do formulário
  - [ ] Chegada na página de pagamento
  - [ ] Pagamento confirmado
- [ ] Cálculo de taxa de conversão por etapa
- [ ] Identificar pontos de abandono
- [ ] Dashboard visual do funil

---

### 🔄 **M4.3: Recuperação de Carrinho Abandonado**
**Estimativa:** 5 SP | **Prioridade:** P2 | **Label:** `backend`

**Checklist:**
- [ ] Identificar inscrições iniciadas mas não pagas (> 1h)
- [ ] Job cron (a cada hora)
- [ ] Enviar email de lembrete com link de pagamento
- [ ] Cupom de desconto opcional (5-10%)
- [ ] Tracking de recuperação

---

### 📄 **M4.4: Relatórios Avançados**
**Estimativa:** 5 SP | **Prioridade:** P1 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Filtros: período, evento, status
- [ ] Relatório: Vendas por período
- [ ] Relatório: Perfil demográfico (idade, cidade)
- [ ] Relatório: Meios de pagamento
- [ ] Exportação: CSV, Excel, PDF
- [ ] Gráficos visuais

---

## **M5: Gestão de Eventos Avançada (2 semanas)**

### 🎫 **M5.1: Sistema de Lotes**
**Estimativa:** 8 SP | **Prioridade:** P1 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Modelo de dados: Lote (price, startDate, endDate, slots)
- [ ] CRUD de lotes no admin
- [ ] Ativação automática por data
- [ ] Desativação automática (data ou esgotamento)
- [ ] Landing page mostra lote atual
- [ ] Countdown para próximo lote
- [ ] Validação: não sobrepor lotes

**Schema:**
```prisma
model Batch {
  id        String   @id @default(cuid())
  name      String   // "1º Lote", "2º Lote"
  price     Decimal
  startDate DateTime
  endDate   DateTime?
  maxSlots  Int
  soldSlots Int      @default(0)

  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
}
```

---

### 🎟️ **M5.2: Cupons de Desconto**
**Estimativa:** 5 SP | **Prioridade:** P1 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Modelo de dados: Cupom
- [ ] CRUD de cupons
- [ ] Tipos: percentual, valor fixo
- [ ] Validações:
  - [ ] Limite de usos
  - [ ] Validade (data início/fim)
  - [ ] Cupom único por organizador
- [ ] Campo "Cupom" no checkout
- [ ] Aplicar desconto no total
- [ ] Tracking de uso

**Schema:**
```prisma
model Coupon {
  id        String   @id @default(cuid())
  code      String   @unique
  type      String   // "percentage" | "fixed"
  value     Decimal
  maxUses   Int?
  usedCount Int      @default(0)
  startDate DateTime
  endDate   DateTime?

  eventId   String?
  event     Event?   @relation(fields: [eventId], references: [id])

  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### 🏃 **M5.3: Múltiplas Modalidades**
**Estimativa:** 5 SP | **Prioridade:** P1 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Tabela: Modalidade (name, distance, price, slots)
- [ ] Evento pode ter N modalidades
- [ ] Formulário: adicionar modalidades ao evento
- [ ] Landing: participante escolhe modalidade
- [ ] Preços diferentes por modalidade
- [ ] Relatórios separados por modalidade

---

### 🛍️ **M5.4: Produtos Adicionais**
**Estimativa:** 5 SP | **Prioridade:** P2 | **Label:** `backend`, `frontend`

**Checklist:**
- [ ] Tabela: Product (name, description, price, stock)
- [ ] CRUD de produtos
- [ ] Variações (ex: tamanhos de camisa)
- [ ] Checkout: adicionar produtos extras
- [ ] Controle de estoque
- [ ] Relatório de produtos vendidos

---

## **M6-M15: Outras Tasks**

> **Nota:** As tasks de M6 até M15 seguem a mesma estrutura. Por questão de espaço, vou resumir os principais itens. Posso detalhar qualquer milestone específico se necessário.

### **M6: Landing Pages Avançadas**
- M6.1: Múltiplos templates (5 SP)
- M6.2: Galeria de imagens (3 SP)
- M6.3: Vídeo embed (2 SP)
- M6.4: Google Maps integração (3 SP)
- M6.5: Countdown timer (2 SP)
- M6.6: FAQ accordion (3 SP)
- M6.7: SEO avançado (5 SP)

### **M7: Comunicação Avançada**
- M7.1: Email marketing (8 SP)
- M7.2: Segmentação de público (5 SP)
- M7.3: Tracking (abertura/cliques) (5 SP)
- M7.4: Notificações automáticas avançadas (5 SP)
- M7.5: WhatsApp Business API (8 SP)

### **M8: Check-in**
- M8.1: Web app responsivo (8 SP)
- M8.2: QR Code scanner (5 SP)
- M8.3: Modo offline (PWA) (8 SP)
- M8.4: Dashboard check-in (5 SP)
- M8.5: Relatórios de presença (3 SP)

### **M9: Painel Admin Avançado**
- M9.1: Multi-usuários (8 SP)
- M9.2: Permissões (5 SP)
- M9.3: Logs de atividades (3 SP)
- M9.4: Edição manual de inscrições (5 SP)
- M9.5: Cortesias (3 SP)
- M9.6: Cancelamento e reembolso (8 SP)

### **M10: Grupos e Assessorias**
- M10.1: CRUD de grupos (5 SP)
- M10.2: Inscrição coletiva (8 SP)
- M10.3: Dashboard do grupo (5 SP)
- M10.4: Comissões (5 SP)

### **M11: Portal do Participante**
- M11.1: Área do participante (8 SP)
- M11.2: Busca de eventos (5 SP)
- M11.3: Certificados digitais (5 SP)
- M11.4: Histórico (3 SP)

### **M12: Integrações**
- M12.1: Facebook Pixel (2 SP)
- M12.2: Google Analytics 4 (3 SP)
- M12.3: API pública (8 SP)
- M12.4: Webhooks (5 SP)

### **M13: Testes e Otimizações**
- M13.1: Testes unitários (13 SP)
- M13.2: Testes E2E (13 SP)
- M13.3: Performance (8 SP)
- M13.4: Load testing (5 SP)

### **M14: Segurança e LGPD**
- M14.1: Auditoria de segurança (8 SP)
- M14.2: LGPD completo (8 SP)
- M14.3: 2FA (5 SP)

### **M15: Lançamento**
- M15.1: Infra produção (5 SP)
- M15.2: Monitoramento (3 SP)
- M15.3: Documentação (5 SP)
- M15.4: Go-live (3 SP)

---

## 🏷️ **LABELS SUGERIDAS**

```
Tipo:
- feature (nova funcionalidade)
- bug (correção)
- enhancement (melhoria)
- refactor (refatoração)
- docs (documentação)
- test (testes)

Área:
- frontend
- backend
- infra
- design
- security
- payments
- analytics

Prioridade:
- P0-critical (bloqueador)
- P1-high (alto)
- P2-medium (médio)
- P3-low (baixo)

Status:
- todo
- in-progress
- in-review
- done
```

---

## 📦 **MILESTONES NO GITHUB**

```
Milestone: M0 - Validação
Milestone: M1 - Setup
Milestone: M2 - Pagamentos
Milestone: M3 - MVP Launch
Milestone: M4 - Dashboard
Milestone: M5 - Eventos Avançados
...
Milestone: M15 - Lançamento Oficial
```

---

**Próximo passo:** Importar essas tasks como issues no GitHub!
