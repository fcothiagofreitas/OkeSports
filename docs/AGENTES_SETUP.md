# 🤖 Guia de Agentes para OkeSports

Este documento lista os agentes recomendados para automatizar tarefas no projeto OkeSports.

---

## 🎯 O que são Agentes?

Agentes são sistemas automatizados que executam tarefas específicas no seu projeto, como:
- **CI/CD**: Testes automáticos, builds, deploys
- **Monitoramento**: Alertas, métricas, logs
- **Manutenção**: Atualizações de dependências, backups
- **Qualidade**: Linting, formatação, type-checking

---

## 🚀 Agentes Essenciais (Alta Prioridade)

### 1. **GitHub Actions (CI/CD)** ⭐⭐⭐

**Por que usar:** Automatizar testes, builds e deploys a cada push/PR.

**O que faz:**
- Roda testes automaticamente
- Verifica TypeScript e linting
- Faz build do projeto
- Deploy automático em staging/produção

**Configuração:**

Crie `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: okesports_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npm run db:generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/okesports_test
      
      - name: Run migrations
        run: npm run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/okesports_test
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Format check
        run: npm run format:check
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/okesports_test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

**Secrets necessários no GitHub:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

### 2. **Dependabot (Atualização de Dependências)** ⭐⭐⭐

**Por que usar:** Mantém dependências atualizadas automaticamente.

**Configuração:**

Crie `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Dependências npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "automated"
    
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**O que faz:**
- Cria PRs automaticamente quando há atualizações
- Testa atualizações antes de mergear
- Mantém o projeto seguro e atualizado

---

### 3. **Sentry (Error Tracking)** ⭐⭐

**Por que usar:** Monitora erros em produção e alerta em tempo real.

**Configuração:**

```bash
npm install @sentry/nextjs
```

```bash
npx @sentry/wizard@latest -i nextjs
```

**Integração no código:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**O que faz:**
- Captura erros automaticamente
- Envia alertas por email/Slack
- Mostra stack traces completos
- Rastreia performance

---

## 🔧 Agentes Recomendados (Média Prioridade)

### 4. **Renovate (Alternativa ao Dependabot)** ⭐⭐

**Por que usar:** Mais configurações e controle que Dependabot.

**Configuração:**

Crie `renovate.json`:

```json
{
  "extends": ["config:base"],
  "schedule": ["before 10am on monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "all non-major dependencies",
      "groupSlug": "all-minor-patch"
    }
  ],
  "prConcurrentLimit": 3,
  "prHourlyLimit": 2
}
```

---

### 5. **CodeQL (Security Scanning)** ⭐⭐

**Por que usar:** Detecta vulnerabilidades de segurança no código.

**Configuração:**

Crie `.github/workflows/codeql.yml`:

```yaml
name: CodeQL Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Semanal

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript,typescript
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

---

### 6. **Lighthouse CI (Performance Monitoring)** ⭐

**Por que usar:** Monitora performance e acessibilidade do site.

**Configuração:**

Crie `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/e/corrida-teste-okesports
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## 📊 Agentes de Monitoramento

### 7. **Uptime Robot / Better Uptime** ⭐⭐

**Por que usar:** Monitora se o site está online 24/7.

**Configuração:**
1. Crie conta em [Better Uptime](https://betteruptime.com) ou [Uptime Robot](https://uptimerobot.com)
2. Adicione monitor para:
   - `https://okesports.com.br`
   - `https://api.okesports.com.br/health`
3. Configure alertas por email/Slack

---

### 8. **PostHog / Mixpanel (Analytics)** ⭐

**Por que usar:** Analytics e tracking de eventos.

**Configuração:**

```bash
npm install posthog-js
```

```typescript
// lib/analytics.ts
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com'
  })
}
```

---

## 🔄 Agentes de Backup

### 9. **Database Backup Agent** ⭐⭐

**Por que usar:** Backups automáticos do banco de dados.

**Configuração:**

Crie `.github/workflows/backup-db.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Diário às 2h
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup PostgreSQL
        uses: actions/checkout@v4
      
      - name: Setup pg_dump
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
      
      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_BACKUP_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: '.'
```

---

## 🧪 Agentes de Testes

### 10. **Playwright (E2E Testing)** ⭐⭐

**Por que usar:** Testes end-to-end automatizados.

**Configuração:**

```bash
npm install -D @playwright/test
npx playwright install
```

Crie `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📝 Checklist de Implementação

### Fase 1 (Essencial - Primeira Semana)
- [ ] Configurar GitHub Actions (CI/CD)
- [ ] Configurar Dependabot
- [ ] Configurar Sentry

### Fase 2 (Recomendado - Primeiro Mês)
- [ ] Configurar CodeQL
- [ ] Configurar Uptime Monitor
- [ ] Configurar Database Backup

### Fase 3 (Opcional - Conforme Necessidade)
- [ ] Configurar Lighthouse CI
- [ ] Configurar Playwright
- [ ] Configurar PostHog/Mixpanel

---

## 🔗 Links Úteis

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Playwright Docs](https://playwright.dev)
- [CodeQL Docs](https://codeql.github.com/docs)

---

## 💡 Dicas

1. **Comece simples:** Implemente GitHub Actions primeiro
2. **Monitore gradualmente:** Adicione Sentry antes de ir para produção
3. **Automatize backups:** Configure backups antes de ter dados importantes
4. **Teste localmente:** Sempre teste workflows localmente antes de commitar

---

**Última atualização:** Dezembro 2024

