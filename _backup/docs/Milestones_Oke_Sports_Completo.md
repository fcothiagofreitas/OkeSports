# MILESTONES - OKÊ SPORTS
## Plataforma de Gestão de Eventos Esportivos

**Data de Criação:** 29/10/2025
**Última Revisão:** 31/10/2025
**Versão:** 2.0
**Duração Total Estimada:** 20-28 semanas (5-7 meses)

---

## **FASE 0: VALIDAÇÃO DE MERCADO**
**Duração:** 1 semana (antes de começar desenvolvimento)

### **M0: Pesquisa e Validação**
**Duração estimada:** 1 semana

### Entregas:
1. **Pesquisa com Organizadores**
   - Entrevistar 10-15 organizadores de eventos esportivos
   - Identificar principais dores e necessidades
   - Validar modelo de marketplace (gateway próprio)
   - Definir preço que estariam dispostos a pagar

2. **Análise de Concorrência**
   - Mapear plataformas existentes (Ticket Sports, etc)
   - Identificar gaps e oportunidades
   - Definir diferencial competitivo

3. **Decisão Go/No-Go**
   - Validar viabilidade do modelo de negócio
   - Confirmar demanda real
   - Aprovar investimento

---

## **FASE 1: SUPER MVP (VALIDAÇÃO TÉCNICA)**
**Duração:** 3-4 semanas

### **M1: Setup e Core Mínimo**
**Duração estimada:** 1 semana

### Entregas:
1. **Setup do Projeto**
   - Configurar repositório Git + CI/CD básico
   - Setup Next.js + Node.js + PostgreSQL
   - Configurar ambientes (dev, staging)
   - Definir convenções de código
   - HTTPS + certificado SSL

2. **Autenticação e Segurança Base**
   - Sistema de login/cadastro (organizadores)
   - Criptografia de dados sensíveis
   - Política de privacidade e termos de uso (LGPD básico)
   - Rate limiting

3. **CRUD de Eventos (Simplificado)**
   - Cadastro básico de evento (1 modalidade: corrida)
   - Campos: nome, data, local, descrição, valor, vagas
   - Upload de 1 imagem
   - Status: rascunho/publicado

---

## **M2: Marketplace + Pagamentos**
**Duração estimada:** 2 semanas

### Entregas:
1. **OAuth com Gateway (Marketplace)**
   - Integração OAuth com Mercado Pago Marketplace OU Stripe Connect
   - Fluxo de autorização (organizador conecta conta)
   - Armazenamento seguro de tokens (criptografados)
   - Refresh token automático
   - Status de conexão no dashboard

2. **Sistema de Pagamentos**
   - **PIX** (aprovação instantânea)
   - **Cartão de crédito** (parcelamento até 6x)
   - Split payment automático (taxa da plataforma)
   - Webhooks para confirmação de pagamento
   - Tratamento de erros e retentativas

3. **Formulário de Inscrição**
   - Campos essenciais: nome, email, CPF, telefone
   - Informações adicionais: tamanho de camisa
   - Checkbox de termos e condições
   - Validação de dados (CPF, email)

4. **Dashboard do Organizador**
   - Overview: total de inscrições, arrecadação
   - Lista de inscritos (nome, status pagamento)
   - Preview de valores líquidos (após taxas)
   - Status da conexão com gateway
   - Exportação CSV básica

---

## **M3: Landing Page e Comunicação**
**Duração estimada:** 1 semana

### Entregas:
1. **Landing Page do Evento**
   - Template fixo responsivo (mobile-first)
   - Informações do evento
   - Galeria de 1 imagem
   - Botão de inscrição destacado
   - Contador de vagas disponíveis
   - SEO básico (meta tags)

2. **Emails Transacionais**
   - Confirmação de inscrição
   - Confirmação de pagamento PIX
   - Confirmação de pagamento cartão
   - Notificação ao organizador (nova inscrição)
   - Templates responsivos

3. **Deploy em Produção**
   - Deploy frontend (Vercel/Netlify)
   - Deploy backend (Railway/Render)
   - Configuração de domínio
   - Monitoramento básico (uptime)

**🎯 CHECKPOINT 1: Validação com 3-5 organizadores reais | 1 evento ao vivo | 50+ inscrições processadas**

---

## **FASE 2: CRESCIMENTO (após validação)**
**Duração:** 6-8 semanas

### **M4: Dashboard Gerencial Avançado**
**Duração estimada:** 2 semanas

### Entregas:
1. **Métricas e Analytics**
   - Gráficos de vendas em tempo real
   - Cálculo de ticket médio
   - Projeção de vendas baseada em histórico
   - Comparativo entre eventos

2. **Funil de Conversão**
   - Análise de abandono de carrinho
   - Taxa de conversão por etapa
   - Origem das inscrições (Google Analytics)
   - Sistema de recuperação de carrinho abandonado

3. **Relatórios Avançados**
   - Vendas por período (dia, semana, mês)
   - Perfil demográfico dos participantes
   - Meios de pagamento mais utilizados
   - Horários de pico de vendas
   - Exportação em múltiplos formatos (CSV, Excel, PDF)

---

## **M5: Gestão de Eventos Avançada**
**Duração estimada:** 2 semanas

### Entregas:
1. **Sistema de Lotes**
   - Criação de múltiplos lotes por evento
   - Preços progressivos (1º lote mais barato)
   - Datas de abertura/fechamento automáticas
   - Controle de vagas por lote

2. **Cupons de Desconto**
   - Criação de cupons (percentual ou valor fixo)
   - Limite de usos
   - Validade por período
   - Cupons exclusivos por organizador

3. **Múltiplas Modalidades**
   - Suporte a corrida, ciclismo, triatlo, natação
   - Configuração de categorias por evento
   - Preços diferentes por modalidade

4. **Produtos Adicionais**
   - Venda de produtos extras (camisa adicional, medalha, etc)
   - Controle de estoque básico
   - Variações (tamanhos)

---

## **M6: Landing Pages Avançadas**
**Duração estimada:** 1-2 semanas

### Entregas:
1. **Melhorias na Landing Page**
   - Múltiplos templates de evento
   - Galeria de múltiplas imagens
   - Vídeo de apresentação (YouTube/Vimeo embed)
   - Mapa do percurso (Google Maps embed)
   - Countdown para abertura de lotes
   - FAQ do evento

2. **SEO e Conversão**
   - Meta tags otimizadas
   - Open Graph (preview em redes sociais)
   - Schema.org para eventos
   - Pixel Facebook/Google Ads
   - Call-to-action otimizado

3. **Compartilhamento**
   - Botões de share (WhatsApp, Facebook, Instagram)
   - Link curto personalizado
   - QR Code do evento

---

## **M7: Comunicação Avançada**
**Duração estimada:** 1-2 semanas

### Entregas:
1. **Email Marketing**
   - Templates customizáveis
   - Disparo em massa para inscritos
   - Segmentação (status, modalidade, etc)
   - Tracking de abertura e cliques
   - Agendamento de envios

2. **Notificações Automáticas Avançadas**
   - Lembrete X dias antes do evento
   - Alerta de abertura de novo lote
   - Recuperação de carrinho abandonado
   - Pesquisa de satisfação pós-evento

3. **WhatsApp Business API**
   - Confirmações via WhatsApp
   - Notificações críticas
   - Suporte ao participante

**🎯 CHECKPOINT 2: 10+ organizadores ativos | 5 eventos simultâneos | 200+ inscrições | NPS > 40**

---

## **FASE 3: ESCALA**
**Duração:** 5-7 semanas

### **M8: Sistema de Check-in**
**Duração estimada:** 2 semanas

### Entregas:
1. **Web App de Check-in (Responsivo)**
   - Login do organizador
   - Seleção do evento
   - Leitura de QR Code via câmera
   - Busca manual por nome/CPF/número de peito
   - Modo offline (PWA)
   - Funciona em tablet/smartphone

2. **Dashboard de Check-in**
   - Total de check-ins realizados em tempo real
   - Percentual de presença
   - Lista de pendentes
   - Filtros por modalidade/categoria
   - Exportação de relatórios

3. **Integração**
   - QR Code único por inscrição (gerado automaticamente)
   - Email com QR Code para participante
   - Sincronização em tempo real
   - Validação de duplicidade
   - Histórico de check-in

---

## **M9: Painel Administrativo e Permissões**
**Duração estimada:** 2 semanas

### Entregas:
1. **Gestão de Usuários**
   - Múltiplos usuários por organizador
   - Níveis de permissão (admin, editor, visualizador)
   - Logs de atividades
   - Convites por email

2. **Gestão de Inscrições Avançada**
   - Filtros e buscas avançadas
   - Edição manual de inscrições
   - Emissão de cortesias (inscrições gratuitas)
   - Cancelamento e reembolso (manual)
   - Transferência de inscrição
   - Notas internas

3. **Multi-empresa**
   - Organizador pode gerenciar múltiplas empresas/marcas
   - Dados separados por empresa
   - Relatórios consolidados

---

## **M10: Sistema de Grupos e Assessorias**
**Duração estimada:** 1-2 semanas

### Entregas:
1. **Cadastro de Grupos**
   - CRUD de grupos esportivos/assessorias
   - Perfil público do grupo
   - Gestão de alunos
   - Descontos exclusivos para grupos

2. **Inscrição em Grupo**
   - Fluxo de inscrição coletiva
   - Pagamento centralizado ou individual
   - Prazo para fechamento do grupo
   - Notificações aos membros
   - Link de convite exclusivo

3. **Dashboard do Grupo**
   - Eventos futuros
   - Histórico de participações
   - Estatísticas do grupo
   - Comissão para líder do grupo (opcional)

---

## **FASE 4: EXPANSÃO E INTEGRAÇÕES**
**Duração:** 4-6 semanas

### **M11: Portal do Participante**
**Duração estimada:** 2 semanas

### Entregas:
1. **Área do Participante (Web Responsivo)**
   - Login/cadastro de participantes
   - Histórico de inscrições
   - Certificados digitais (download PDF)
   - Resultados de eventos (se aplicável)
   - Dados pessoais editáveis

2. **Busca de Eventos**
   - Listagem pública de eventos
   - Filtros (modalidade, cidade, data, distância)
   - Mapa de eventos próximos
   - Inscrição direta

3. **Notificações no App**
   - Centro de notificações web
   - Lembrete de eventos próximos
   - Novidades dos eventos inscritos

---

## **M12: Integrações Externas**
**Duração estimada:** 2-3 semanas

### Entregas:
1. **Marketing e Analytics**
   - Facebook Pixel
   - Google Tag Manager
   - Google Analytics 4
   - Meta tags dinâmicas

2. **Comunicação**
   - Integração com RD Station/Mailchimp (opcional)
   - Envio de contatos para CRM
   - Sincronização de leads

3. **API Pública (Básica)**
   - Documentação inicial
   - Autenticação por API Key
   - Endpoints básicos (listar eventos, inscrições)
   - Webhooks (nova inscrição, pagamento confirmado)

**🎯 CHECKPOINT 3: 50+ organizadores | 20 eventos/mês | 1.000 inscrições/mês | Churn < 10%**

---

## **FASE 5: QUALIDADE E LANÇAMENTO**
**Duração:** 3-4 semanas

### **M13: Testes e Otimizações**
**Duração estimada:** 2 semanas

### Entregas:
1. **Testes Automatizados**
   - Testes unitários críticos (cobertura >60%)
   - Testes de integração (pagamentos, webhooks)
   - Testes E2E nos fluxos principais (Playwright)
   - Testes de carga (simular 1000 inscrições simultâneas)

2. **Otimizações**
   - Performance do frontend (Lighthouse >90)
   - Otimização de queries do banco
   - Cache de dados frequentes (Redis)
   - CDN para assets estáticos
   - Lazy loading de imagens

3. **Bug Fixing e Polish**
   - Correção de bugs reportados
   - Melhorias de UX baseadas em feedback
   - Refinamento de textos e labels
   - Responsividade em todos dispositivos

---

## **M14: Conformidade e Segurança Avançada**
**Duração estimada:** 1 semana

### Entregas:
1. **LGPD Completo**
   - Revisão e atualização de política de privacidade
   - Termos de uso detalhados
   - Sistema de consentimento granular
   - Portabilidade de dados (exportar tudo em JSON/CSV)
   - Direito ao esquecimento (anonimização)
   - Cookie banner

2. **Hardening de Segurança**
   - Auditoria de segurança
   - Proteção contra XSS, CSRF, SQL Injection
   - Rate limiting agressivo
   - Backup automático diário
   - Logs de auditoria detalhados
   - 2FA para organizadores (opcional)

---

## **M15: Lançamento Oficial**
**Duração estimada:** 1 semana

### Entregas:
1. **Infraestrutura de Produção**
   - Revisão e otimização de servidores
   - Configuração de domínio definitivo
   - Monitoramento robusto (Sentry, Uptime Robot)
   - Alertas automáticos (email, Slack)
   - Plano de contingência

2. **Go-Live**
   - Deploy final em produção
   - Smoke tests completos
   - Monitoramento intensivo 72h
   - Suporte dedicado 24/7 (primeira semana)
   - Hotline para organizadores

3. **Documentação e Treinamento**
   - Manual do organizador (PDF)
   - Base de conhecimento (FAQ)
   - Vídeos tutoriais (5-7 minutos cada)
   - Webinar de onboarding

---

## **FASE 6: OPERAÇÃO E CRESCIMENTO**
**Duração:** Contínuo

### **M16: Pós-Lançamento e Evolução**

### Entregas Contínuas:
1. **Monitoramento e Suporte**
   - Análise diária de métricas
   - Suporte tier 1 e tier 2
   - Coleta estruturada de feedback
   - Correções emergenciais (SLA 24h)

2. **Melhorias Contínuas**
   - Sprint quinzenais de melhorias
   - Implementação de feedbacks priorizados
   - A/B testing de features
   - Otimizações incrementais

3. **Roadmap Futuro (pós M16)**
   - App Mobile Nativo (se volume justificar >5k inscrições/mês)
   - Eventos Virtuais (corrida virtual)
   - Revezamento de Equipes
   - Integração Strava/Garmin
   - Doações e causas sociais
   - Marketplace de fornecedores (fotógrafos, chips, etc)

---

## **CRONOGRAMA GERAL REVISADO**

| Fase | Milestones | Duração | Objetivo |
|------|------------|---------|----------|
| **Fase 0: Validação** | M0 | 1 semana | Validar problema e modelo de negócio |
| **Fase 1: Super MVP** | M1-M3 | 3-4 semanas | Primeiro evento real funcionando |
| **CHECKPOINT 1** | - | - | Validar com 3-5 organizadores |
| **Fase 2: Crescimento** | M4-M7 | 6-8 semanas | Features para escalar vendas |
| **CHECKPOINT 2** | - | - | 10+ organizadores, 200+ inscrições |
| **Fase 3: Escala** | M8-M10 | 5-7 semanas | Operação e gestão avançada |
| **Fase 4: Expansão** | M11-M12 | 4-6 semanas | Portal participante e integrações |
| **CHECKPOINT 3** | - | - | 50+ organizadores, 1k+ inscrições/mês |
| **Fase 5: Launch** | M13-M15 | 3-4 semanas | Qualidade e lançamento oficial |
| **Fase 6: Operação** | M16 | Contínuo | Suporte e evolução |

**Duração total estimada:** 20-28 semanas (5-7 meses)
**Economia vs. plano anterior:** 3-5 semanas (menos 15-20%)

---

## **ESTIMATIVA DE CUSTOS REVISADA**

### **Equipe Fase 1-2 (MVP - primeiros 3 meses):**
- 2 Desenvolvedores Full Stack (ao invés de 2-3)
- 1 Designer UX/UI (part-time 50%)
- 1 Product Owner (pode ser o fundador)

### **Custo Médio Mensal MVP (Brasil):**
- 2 Desenvolvedores: R$ 16.000 - 30.000
- Designer (part-time): R$ 3.000 - 6.000
- **Total equipe MVP: R$ 19.000 - 36.000/mês**

### **Equipe Fase 3+ (Crescimento - após validação):**
- 2-3 Desenvolvedores Full Stack
- 1 Designer UX/UI (full-time)
- 1 QA / Tester
- 1 DevOps (part-time 50%)
- 1 Product Owner
- **Total equipe crescimento: R$ 45.000 - 87.000/mês**

### **Infraestrutura Mensal:**

**MVP (primeiros 3 meses):**
- Vercel/Netlify (frontend): R$ 0 - 200 (free tier)
- Railway/Render (backend): R$ 100 - 500
- PostgreSQL: R$ 100 - 300
- Email (Resend/SendGrid): R$ 0 - 100 (free tier)
- Storage (S3): R$ 50 - 150
- Monitoramento (Sentry free tier): R$ 0 - 200
- **Total MVP: R$ 250 - 1.450/mês**

**Crescimento (após 100+ inscrições/dia):**
- Servidores (AWS/Azure/GCP): R$ 500 - 2.000
- Banco de dados: R$ 300 - 1.000
- CDN: R$ 100 - 500
- Email: R$ 200 - 800
- Monitoramento: R$ 200 - 500
- Backups: R$ 100 - 300
- Redis (cache): R$ 100 - 400
- **Total crescimento: R$ 1.500 - 5.500/mês**

### **Pagamentos (Marketplace Model):**
- **NÃO há custo fixo para a plataforma**
- Gateway cobra diretamente do organizador
- Okê Sports recebe % via split payment
- Zero risco financeiro
- Zero compliance de pagamento

### **Outros:**
- Domínio: R$ 40-80/ano
- SSL: Grátis (Let's Encrypt)
- **App stores: POSTERGAR** (não terá mobile nativo no MVP)

### **Investimento Total Estimado:**

**Até MVP validado (4 meses):**
- Equipe: R$ 76.000 - 144.000
- Infra: R$ 1.000 - 5.800
- **Total: R$ 77.000 - 150.000**

**Até Lançamento Oficial (7 meses):**
- Equipe: R$ 265.000 - 522.000
- Infra: R$ 8.500 - 31.500
- **Total: R$ 273.500 - 553.500**

**🔥 Economia vs. plano anterior: R$ 50.000 - 150.000** (lançamento mais rápido + sem mobile nativo inicial)

---

## **MÉTRICAS DE SUCESSO REVISADAS**

### **CHECKPOINT 1 - Super MVP (Semana 4):**
- [ ] 3-5 organizadores testando ativamente
- [ ] 1 evento real publicado
- [ ] 50+ inscrições processadas
- [ ] PIX + Cartão funcionando 100%
- [ ] 0 bugs críticos de pagamento
- [ ] Taxa de sucesso de pagamento > 95%

**Decisão:** Se atingir, continuar para Fase 2. Se não, pivotar ou ajustar.

### **CHECKPOINT 2 - Crescimento (Mês 3):**
- [ ] 10+ organizadores pagantes
- [ ] 5+ eventos simultâneos
- [ ] 200+ inscrições/mês
- [ ] Taxa de conversão landing → inscrição > 30%
- [ ] NPS > 40
- [ ] Churn < 15%
- [ ] Pelo menos 1 organizador com 2+ eventos

**Decisão:** Se atingir, acelerar desenvolvimento. Se não, focar em retenção.

### **CHECKPOINT 3 - Escala (Mês 5-6):**
- [ ] 50+ organizadores ativos
- [ ] 20+ eventos/mês
- [ ] 1.000+ inscrições/mês
- [ ] GMV: R$ 50.000+/mês
- [ ] Churn < 10%
- [ ] NPS > 50
- [ ] Receita recorrente: R$ 2.500+/mês (5% do GMV)

**Decisão:** Se atingir, preparar lançamento oficial e marketing.

### **Mês 12 (Pós-Lançamento):**
- [ ] 200+ organizadores ativos
- [ ] 80-100 eventos/mês
- [ ] 4.000-5.000 inscrições/mês
- [ ] GMV: R$ 200-250k/mês
- [ ] Receita Okê Sports: R$ 10-12k/mês (5% do GMV)
- [ ] Churn < 5%
- [ ] NPS > 60
- [ ] **Breakeven ou lucratividade**
- [ ] CAC < LTV (payback < 6 meses)

---

## **RISCOS E MITIGAÇÕES REVISADOS**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Validação falha (ninguém usa)** | Média | **CRÍTICO** | ✅ Pesquisa M0, validar com 10+ organizadores ANTES de codar |
| **Problemas OAuth/Gateway** | Média | Crítico | ✅ Suporte a 2 gateways (Stripe + MP), testes extensivos, sandbox completo |
| **Concorrência (Ticket Sports)** | Alta | Alto | ✅ Focar em UX superior, preço competitivo, suporte BR, features exclusivas |
| **Baixa adoção inicial** | Média | Alto | ✅ Early adopters incentivados (3 meses grátis), marketing pré-lançamento |
| **Churn alto de organizadores** | Média | Alto | ✅ Onboarding dedicado, customer success desde dia 1, NPS tracking |
| **Bugs críticos de pagamento** | Baixa | CRÍTICO | ✅ Testes automatizados E2E, monitoramento Sentry, alerta instantâneo |
| **Escalabilidade (picos)** | Baixa | Alto | ✅ Arquitetura moderna, load tests, Cloud auto-scaling |
| **Dependência de gateway** | Baixa | Médio | ✅ Modelo marketplace (dinheiro não passa por nós), sem lock-in |
| **LGPD / Legal** | Baixa | Alto | ✅ Compliance desde M1, termos revisados por jurídico |
| **Equipe pequena/atraso** | Média | Médio | ✅ MVP enxuto, checkpoints claros, buffer 20% cronograma |

---

## **PRÓXIMOS PASSOS REVISADOS**

### **📋 Semana 0 (Antes de codar):**
1. ✅ **Revisar e aprovar este documento revisado**
2. 🎯 **Executar M0: Pesquisa de Validação**
   - Entrevistar 10-15 organizadores de eventos
   - Validar disposição a conectar conta do gateway
   - Definir preço (% ou mensalidade)
   - Mapear concorrência real
3. 📊 **Decisão Go/No-Go baseada em dados**

### **🚀 Semana 1-4 (Se Go):**
4. **Setup do projeto (M1)**
   - Criar repositório Git
   - Setup Next.js + Node.js + PostgreSQL
   - CI/CD básico
   - Ambiente de staging
5. **Desenvolvimento Super MVP (M1-M3)**
   - Sprints de 1 semana
   - Deploy contínuo
   - Testes com organizadores reais desde semana 2
6. **Checkpoint 1: Validação técnica**

### **📈 Mês 2-3 (Se Checkpoint 1 OK):**
7. **Desenvolvimento Fase 2 (M4-M7)**
   - Quebrar milestones em issues
   - Sprints de 2 semanas
   - Weekly review com early adopters
8. **Checkpoint 2: Validação de crescimento**

---

## **OBSERVAÇÕES IMPORTANTES**

### **🎯 Sobre a Plataforma:**
- **Okê Sports** é uma plataforma SaaS **marketplace** para gestão de eventos esportivos
- Organizador conecta sua própria conta do gateway (Mercado Pago/Stripe)
- **Modelo financeiro:** Dinheiro vai DIRETO para o organizador, Okê Sports recebe % via split
- Ticket Sports é referência de UX, mas não há dependência técnica

### **💰 Modelo de Negócio (a decidir em M0):**

**Opção A: Split Payment Puro**
- 5-7% por inscrição (cobrado via split automático)
- Sem mensalidade
- Simples para o organizador entender
- Alinhamento de incentivos (ganhamos quando ele ganha)

**Opção B: Freemium**
- Plano Gratuito: até 100 inscrições/mês (8% de taxa)
- Plano Pro: R$ 99/mês (5% de taxa)
- Plano Enterprise: R$ 299/mês (3% de taxa)

**Opção C: Mensalidade + Taxa Reduzida**
- R$ 49-99/mês + 3% por inscrição
- Melhor para organizadores com alto volume

**Recomendação inicial:** Opção A (split puro) pela simplicidade.

### **🛠 Stack Tecnológico Definido:**
- **Frontend:** Next.js 14+ (App Router, Server Components)
- **Backend:** Next.js API Routes (início) → Node.js/Express (escala)
- **Banco:** PostgreSQL (Neon/Supabase para MVP)
- **ORM:** Prisma
- **Cache:** Redis (Upstash para MVP)
- **Storage:** AWS S3 ou Cloudflare R2
- **Email:** Resend (moderno, barato, bom DX)
- **Payment:** Stripe Connect OU Mercado Pago Marketplace
- **Deploy:** Vercel (frontend) + Railway/Render (backend)
- **Monitoramento:** Sentry + Uptime Robot
- **Analytics:** PostHog ou Mixpanel

**🚫 NÃO usar no MVP:**
- Mobile nativo (React Native/Flutter)
- Microserviços
- GraphQL
- Docker/Kubernetes (overkill para MVP)

### **📊 Comparação com Plano Anterior:**

| Métrica | Plano Anterior | Plano Revisado | Melhoria |
|---------|----------------|----------------|----------|
| Tempo até MVP | 6-8 semanas | 3-4 semanas | ⚡ 50% mais rápido |
| Custo até validação | R$ 270-696k | R$ 77-150k | 💰 65-78% economia |
| Risco financeiro pagamentos | Alto (intermediário) | Zero (marketplace) | 🛡️ Eliminado |
| Time to market | 6-8 meses | 5-7 meses | 📈 15-20% mais rápido |
| Complexidade técnica | Alta | Média | 🎯 Mais focado |

---

**Documento criado em:** 29/10/2025
**Última revisão:** 31/10/2025
**Versão:** 2.0 (Revisão Estratégica)
**Próxima revisão:** Após M0 (validação de mercado) e após cada checkpoint

---

## **🎯 PRINCIPAIS MUDANÇAS DESTA REVISÃO**

1. ✅ **Adicionado M0:** Validação de mercado ANTES de codar
2. ✅ **Super MVP em 3-4 semanas:** PIX + Cartão desde o início
3. ✅ **Modelo Marketplace:** OAuth com gateway, zero risco financeiro
4. ✅ **3 Checkpoints claros:** Go/No-Go baseado em métricas
5. ✅ **Mobile postergar:** Web responsivo primeiro, app nativo só se justificar
6. ✅ **Economia de 15-20%:** Tempo e custo reduzidos
7. ✅ **Segurança desde M1:** LGPD e HTTPS desde o início
8. ✅ **Stack definido:** Next.js + PostgreSQL + Stripe/MP

---

*Este documento apresenta o roadmap revisado do projeto Okê Sports, uma plataforma marketplace completa de gestão de eventos esportivos, com foco em lançamento rápido e validação iterativa.*
