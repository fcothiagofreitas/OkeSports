#!/bin/bash

# GitHub Setup Script para Okê Sports
# Este script cria labels, milestones e issues no GitHub usando GitHub CLI (gh)
#
# Pré-requisitos:
# 1. Instalar GitHub CLI: https://cli.github.com/
# 2. Autenticar: gh auth login
# 3. Estar na pasta do repositório
#
# Uso: ./github-setup.sh

set -e

echo "🚀 Configurando repositório Okê Sports no GitHub..."

# ============================================
# CRIAR LABELS
# ============================================
echo ""
echo "📝 Criando labels..."

# Tipo
gh label create "feature" --description "Nova funcionalidade" --color "0e8a16" || true
gh label create "bug" --description "Correção de bug" --color "d73a4a" || true
gh label create "enhancement" --description "Melhoria" --color "a2eeef" || true
gh label create "refactor" --description "Refatoração" --color "fbca04" || true
gh label create "docs" --description "Documentação" --color "0075ca" || true
gh label create "test" --description "Testes" --color "d4c5f9" || true

# Área
gh label create "frontend" --description "Frontend" --color "1d76db" || true
gh label create "backend" --description "Backend" --color "5319e7" || true
gh label create "infra" --description "Infraestrutura" --color "c2e0c6" || true
gh label create "design" --description "Design/UX" --color "e99695" || true
gh label create "security" --description "Segurança" --color "b60205" || true
gh label create "payments" --description "Pagamentos" --color "006b75" || true
gh label create "analytics" --description "Analytics" --color "bfd4f2" || true
gh label create "research" --description "Pesquisa" --color "f9d0c4" || true
gh label create "legal" --description "Legal/LGPD" --color "c5def5" || true

# Prioridade
gh label create "P0-critical" --description "Crítico/Bloqueador" --color "d93f0b" || true
gh label create "P1-high" --description "Alta prioridade" --color "e99695" || true
gh label create "P2-medium" --description "Média prioridade" --color "fbca04" || true
gh label create "P3-low" --description "Baixa prioridade" --color "d4c5f9" || true

echo "✅ Labels criadas!"

# ============================================
# CRIAR MILESTONES
# ============================================
echo ""
echo "🎯 Criando milestones..."

gh api repos/:owner/:repo/milestones -f title="M0: Validação de Mercado" -f description="Pesquisa com organizadores e validação do modelo de negócio" -f due_on="2025-11-07T00:00:00Z" || true

gh api repos/:owner/:repo/milestones -f title="M1: Setup e Core Mínimo" -f description="Setup do projeto, autenticação, CRUD básico de eventos" -f due_on="2025-11-14T00:00:00Z" || true

gh api repos/:owner/:repo/milestones -f title="M2: Marketplace + Pagamentos" -f description="OAuth com gateway, PIX, cartão de crédito, webhooks" -f due_on="2025-11-28T00:00:00Z" || true

gh api repos/:owner/:repo/milestones -f title="M3: Landing Page e Comunicação" -f description="Landing page pública, emails transacionais, deploy produção" -f due_on="2025-12-05T00:00:00Z" || true

gh api repos/:owner/:repo/milestones -f title="M4: Dashboard Avançado" -f description="Gráficos, métricas, funil de conversão, relatórios" || true

gh api repos/:owner/:repo/milestones -f title="M5: Gestão de Eventos Avançada" -f description="Lotes, cupons, múltiplas modalidades, produtos extras" || true

gh api repos/:owner/:repo/milestones -f title="M6: Landing Pages Avançadas" -f description="Templates, galeria, vídeo, maps, SEO" || true

gh api repos/:owner/:repo/milestones -f title="M7: Comunicação Avançada" -f description="Email marketing, segmentação, WhatsApp Business" || true

gh api repos/:owner/:repo/milestones -f title="M8: Check-in" -f description="Web app de check-in, QR Code, modo offline" || true

gh api repos/:owner/:repo/milestones -f title="M9: Painel Admin Avançado" -f description="Multi-usuários, permissões, edição de inscrições" || true

gh api repos/:owner/:repo/milestones -f title="M10: Grupos e Assessorias" -f description="CRUD de grupos, inscrição coletiva" || true

gh api repos/:owner/:repo/milestones -f title="M11: Portal do Participante" -f description="Área do participante, busca de eventos, certificados" || true

gh api repos/:owner/:repo/milestones -f title="M12: Integrações Externas" -f description="Facebook Pixel, Google Analytics, API pública" || true

gh api repos/:owner/:repo/milestones -f title="M13: Testes e Otimizações" -f description="Testes automatizados, performance, load testing" || true

gh api repos/:owner/:repo/milestones -f title="M14: Segurança e LGPD" -f description="Auditoria de segurança, LGPD completo, 2FA" || true

gh api repos/:owner/:repo/milestones -f title="M15: Lançamento Oficial" -f description="Infra produção, monitoramento, documentação, go-live" || true

echo "✅ Milestones criados!"

# ============================================
# CRIAR ISSUES - FASE 0 (M0)
# ============================================
echo ""
echo "📋 Criando issues da Fase 0: Validação..."

gh issue create \
  --title "[M0.1] Pesquisa com Organizadores" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Objetivo:** Validar o problema e o modelo de marketplace com organizadores reais.

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
- Quanto pagaria por uma solução melhor?" \
  --label "research,P0-critical" \
  --milestone "M0: Validação de Mercado"

gh issue create \
  --title "[M0.2] Análise de Concorrência" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] Mapear Ticket Sports (features, preços, UX)
- [ ] Mapear Sympla (caso usado para eventos)
- [ ] Mapear outras plataformas regionais
- [ ] Identificar gaps e oportunidades
- [ ] Criar matriz comparativa
- [ ] Definir diferencial competitivo" \
  --label "research,P0-critical" \
  --milestone "M0: Validação de Mercado"

gh issue create \
  --title "[M0.3] Decisão Go/No-Go" \
  --body "**Estimativa:** 2 SP | **Prioridade:** P0

**Checklist:**
- [ ] Consolidar dados das entrevistas
- [ ] Calcular viabilidade financeira
- [ ] Apresentar findings para stakeholders
- [ ] Tomar decisão Go/No-Go
- [ ] Definir modelo de precificação final
- [ ] Documentar premissas validadas

**Critérios de Go:**
- 70%+ dos entrevistados demonstram interesse real
- Dispostos a pagar 5-7% ou R\$ 49-99/mês
- Aceitam modelo de marketplace (conectar gateway)
- Mercado com 50k+ eventos/ano no Brasil" \
  --label "research,P0-critical" \
  --milestone "M0: Validação de Mercado"

# ============================================
# CRIAR ISSUES - FASE 1 (M1-M3)
# ============================================
echo ""
echo "📋 Criando issues da Fase 1: Super MVP..."

# M1.1
gh issue create \
  --title "[M1.1] Setup do Projeto" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar repositório no GitHub
- [ ] Setup Next.js 14 com App Router
- [ ] Configurar TypeScript + ESLint + Prettier
- [ ] Setup Tailwind CSS
- [ ] Configurar estrutura de pastas
- [ ] Criar README.md com instruções
- [ ] Setup .env.example

**Stack:**
- Next.js 14+
- TypeScript
- Tailwind CSS
- Prisma" \
  --label "infra,P0-critical,feature" \
  --milestone "M1: Setup e Core Mínimo"

# M1.2
gh issue create \
  --title "[M1.2] Setup PostgreSQL + Prisma" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar conta no Neon/Supabase (PostgreSQL)
- [ ] Configurar DATABASE_URL
- [ ] Setup Prisma ORM
- [ ] Criar schema inicial (User, Event, Registration)
- [ ] Rodar primeira migration
- [ ] Setup Prisma Studio para debug
- [ ] Documentar comandos no README" \
  --label "backend,infra,P0-critical" \
  --milestone "M1: Setup e Core Mínimo"

# M1.3
gh issue create \
  --title "[M1.3] Autenticação (JWT)" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Implementar registro de usuário
- [ ] Hash de senha com bcrypt
- [ ] Login com email + senha
- [ ] Geração de JWT
- [ ] Middleware de autenticação
- [ ] Rotas protegidas
- [ ] Página de login/registro (UI básica)

**Rotas:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me" \
  --label "backend,security,P0-critical" \
  --milestone "M1: Setup e Core Mínimo"

# M1.4
gh issue create \
  --title "[M1.4] Design System Básico" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P1

**Checklist:**
- [ ] Definir paleta de cores
- [ ] Escolher tipografia
- [ ] Criar componentes base (Button, Input, Card, Badge, Alert)
- [ ] Configurar shadcn/ui ou Headless UI
- [ ] Criar layout do dashboard" \
  --label "frontend,design,P1-high" \
  --milestone "M1: Setup e Core Mínimo"

# M1.5
gh issue create \
  --title "[M1.5] CRUD de Eventos (Básico)" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar formulário de evento (apenas corrida)
- [ ] Validação de campos (Zod)
- [ ] Upload de 1 imagem (S3 ou Cloudflare R2)
- [ ] Salvar evento no banco
- [ ] Listar eventos do organizador
- [ ] Editar evento
- [ ] Alterar status (rascunho/publicado)

**Rotas API:**
- POST /api/events
- GET /api/events
- GET /api/events/[id]
- PATCH /api/events/[id]
- DELETE /api/events/[id]" \
  --label "backend,frontend,P0-critical" \
  --milestone "M1: Setup e Core Mínimo"

# M1.6
gh issue create \
  --title "[M1.6] Segurança Básica + LGPD" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] HTTPS obrigatório
- [ ] Rate limiting (API routes)
- [ ] Sanitização de inputs
- [ ] CORS configurado
- [ ] Criar página de Termos de Uso
- [ ] Criar página de Política de Privacidade
- [ ] Checkbox de aceite no cadastro" \
  --label "security,legal,P0-critical" \
  --milestone "M1: Setup e Core Mínimo"

# M1.7
gh issue create \
  --title "[M1.7] Deploy Staging" \
  --body "**Estimativa:** 2 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar projeto no Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Deploy automático em cada push
- [ ] Configurar domínio staging
- [ ] Testar deploy" \
  --label "infra,P0-critical" \
  --milestone "M1: Setup e Core Mínimo"

# M2.1
gh issue create \
  --title "[M2.1] OAuth Mercado Pago - Autorização" \
  --body "**Estimativa:** 8 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar aplicação no Mercado Pago Developers
- [ ] Obter CLIENT_ID e CLIENT_SECRET
- [ ] Implementar fluxo OAuth
- [ ] Trocar code por access_token
- [ ] Salvar tokens CRIPTOGRAFADOS no banco
- [ ] Implementar refresh token automático
- [ ] Status de conexão no dashboard
- [ ] Botão \"Conectar Mercado Pago\"
- [ ] Botão \"Desconectar\"
- [ ] Tratamento de erros" \
  --label "backend,payments,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M2.2
gh issue create \
  --title "[M2.2] Criar Pagamento PIX" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] SDK do Mercado Pago instalado
- [ ] Endpoint: POST /api/payments/create
- [ ] Criar pagamento PIX usando access_token do organizador
- [ ] Gerar QR Code PIX
- [ ] Retornar QR Code + código copia-e-cola
- [ ] Configurar split payment (taxa Okê Sports)
- [ ] Salvar payment_id na inscrição
- [ ] Página de pagamento (mostrar QR Code)" \
  --label "backend,payments,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M2.3
gh issue create \
  --title "[M2.3] Criar Pagamento Cartão de Crédito" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Integrar Mercado Pago Checkout Pro/Brick
- [ ] Formulário de cartão (frontend)
- [ ] Tokenização de cartão
- [ ] Criar pagamento com parcelamento (até 6x)
- [ ] Split payment configurado
- [ ] Tratamento de erros (cartão recusado)
- [ ] 3D Secure (se necessário)" \
  --label "backend,frontend,payments,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M2.4
gh issue create \
  --title "[M2.4] Webhook de Confirmação" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Endpoint: POST /api/webhooks/mercadopago
- [ ] Validar assinatura do webhook
- [ ] Processar eventos (payment.approved, etc)
- [ ] Atualizar status da inscrição
- [ ] Disparar email de confirmação
- [ ] Logs detalhados
- [ ] Idempotência" \
  --label "backend,payments,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M2.5
gh issue create \
  --title "[M2.5] Formulário de Inscrição" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Página pública: /events/[slug]/register
- [ ] Campos: nome, email, CPF, telefone, tamanho camisa
- [ ] Validação frontend (Zod)
- [ ] Resumo do pedido
- [ ] Botão \"Finalizar Inscrição\"
- [ ] Redirect para página de pagamento" \
  --label "frontend,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M2.6
gh issue create \
  --title "[M2.6] Dashboard do Organizador" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Página: /dashboard
- [ ] Overview (total eventos, inscrições, arrecadação)
- [ ] Status conexão gateway
- [ ] Lista de eventos (cards)
- [ ] Página detalhes do evento
- [ ] Lista de inscritos
- [ ] Filtro por status de pagamento
- [ ] Exportar CSV
- [ ] Preview de valores líquidos" \
  --label "frontend,backend,P0-critical" \
  --milestone "M2: Marketplace + Pagamentos"

# M3.1
gh issue create \
  --title "[M3.1] Landing Page do Evento" \
  --body "**Estimativa:** 8 SP | **Prioridade:** P0

**Checklist:**
- [ ] Página pública: /events/[slug]
- [ ] Template responsivo (mobile-first)
- [ ] Seções: Hero, Descrição, Informações, Valor, CTA
- [ ] Contador de vagas em tempo real
- [ ] Botão compartilhar (WhatsApp, Facebook)
- [ ] SEO: meta tags básicas" \
  --label "frontend,design,P0-critical" \
  --milestone "M3: Landing Page e Comunicação"

# M3.2
gh issue create \
  --title "[M3.2] Setup Email (Resend)" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] Criar conta no Resend
- [ ] Adicionar domínio e configurar DNS
- [ ] Instalar SDK
- [ ] Criar função helper: sendEmail()
- [ ] Testar envio" \
  --label "backend,P0-critical" \
  --milestone "M3: Landing Page e Comunicação"

# M3.3
gh issue create \
  --title "[M3.3] Templates de Email" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P0

**Checklist:**
- [ ] Email 1: Confirmação de inscrição (aguardando pagamento)
- [ ] Email 2: Pagamento confirmado (PIX)
- [ ] Email 3: Pagamento confirmado (Cartão)
- [ ] Email 4: Notificação ao organizador (nova inscrição)
- [ ] Templates responsivos (React Email ou MJML)" \
  --label "frontend,design,P0-critical" \
  --milestone "M3: Landing Page e Comunicação"

# M3.4
gh issue create \
  --title "[M3.4] Deploy Produção" \
  --body "**Estimativa:** 3 SP | **Prioridade:** P0

**Checklist:**
- [ ] Configurar domínio produção
- [ ] Atualizar DNS
- [ ] Deploy no Vercel (produção)
- [ ] Configurar variáveis de ambiente produção
- [ ] Testar fluxo completo end-to-end
- [ ] Setup monitoramento (Sentry)
- [ ] Setup uptime monitoring" \
  --label "infra,P0-critical" \
  --milestone "M3: Landing Page e Comunicação"

# M3.5
gh issue create \
  --title "[M3.5] Testes End-to-End MVP" \
  --body "**Estimativa:** 5 SP | **Prioridade:** P1

**Checklist:**
- [ ] Teste 1: Cadastro de organizador
- [ ] Teste 2: Conectar Mercado Pago
- [ ] Teste 3: Criar evento
- [ ] Teste 4: Inscrição + pagamento PIX
- [ ] Teste 5: Inscrição + pagamento Cartão
- [ ] Teste 6: Webhook (aprovar pagamento)
- [ ] Teste 7: Email recebido
- [ ] Teste 8: Dashboard atualizado
- [ ] Teste 9: Exportar CSV" \
  --label "test,P1-high" \
  --milestone "M3: Landing Page e Comunicação"

# M3.6
gh issue create \
  --title "[M3.6] Documentação MVP" \
  --body "**Estimativa:** 2 SP | **Prioridade:** P1

**Checklist:**
- [ ] Atualizar README.md
- [ ] Documentar variáveis de ambiente
- [ ] Documentar comandos principais
- [ ] Criar guia de setup local
- [ ] Documentar fluxo OAuth
- [ ] Criar CONTRIBUTING.md" \
  --label "docs,P1-high" \
  --milestone "M3: Landing Page e Comunicação"

echo ""
echo "✅ Issues criadas com sucesso!"
echo ""
echo "📊 Resumo:"
echo "- Labels: criadas"
echo "- Milestones: 16 criados"
echo "- Issues: 21 criadas (M0-M3)"
echo ""
echo "🎯 Próximos passos:"
echo "1. Revisar issues no GitHub"
echo "2. Ajustar estimativas se necessário"
echo "3. Atribuir responsáveis"
echo "4. Começar com M0!"
echo ""
echo "🚀 Boa sorte no desenvolvimento!"
