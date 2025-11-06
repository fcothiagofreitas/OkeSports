# DECISÕES ESTRATÉGICAS - OKÊ SPORTS
## Documento de Definições do Projeto

**Data de Criação:** 31/10/2025  
**Versão:** 1.0  
**Status:** Aprovado

---

## 📋 SUMÁRIO EXECUTIVO

Este documento consolida todas as decisões estratégicas, comerciais e técnicas tomadas durante o planejamento do projeto **Okê Sports** - uma plataforma SaaS completa para gestão de inscrições e eventos esportivos.

---

## 🎯 VISÃO E POSICIONAMENTO

### **Nome da Plataforma**
**Okê Sports**

**Origem:** Tupi-Guarani  
**Significado:** "Porta" ou "Entrada" - perfeito para uma plataforma de ingressos/tickets

**Rationale da Escolha:**
- ✅ Significado literal e direto relacionado a acesso/ingressos
- ✅ Curto e memorável (2 sílabas)
- ✅ Fácil pronunciação em português
- ✅ Sonoridade positiva (lembra "OK" = aprovação)
- ✅ Raízes brasileiras autênticas
- ✅ Versátil para qualquer modalidade esportiva
- ✅ Alto potencial de branding

### **Posicionamento de Mercado**
**Categoria:** Plataforma SaaS de gestão de eventos esportivos  
**Modelo:** Marketplace bilateral (two-sided marketplace)  
**Público-Alvo Primário:** Organizadores de eventos esportivos participativos  
**Público-Alvo Secundário:** Atletas e participantes

**Diferenciação:**
- Foco exclusivo em esportes participativos
- Modelo de precificação mais transparente e competitivo
- Repasses mais rápidos que a concorrência
- Sem retenção de valores até o evento
- Plataforma 100% brasileira com raízes culturais

---

## 💰 MODELO DE MONETIZAÇÃO

### **Estrutura de Cobrança - Marketplace Bilateral**

O Okê Sports adota um modelo de **cobrança dupla**, inspirado em marketplaces como Uber, iFood e Airbnb, onde ambos os lados (organizador e participante) contribuem para a operação da plataforma.

#### **1. Taxa do Participante (Atleta)**
**Valor:** 10% sobre o valor da inscrição  
**Quem Paga:** Participante  
**Quando:** No ato da inscrição  
**Transparência:** Visível no checkout antes do pagamento

**Exemplo:**
```
Inscrição: R$ 80,00
Taxa de Serviço Okê Sports: R$ 8,00 (10%)
────────────────────────────────────
TOTAL A PAGAR: R$ 88,00
```

**Justificativa:**
- Padrão de mercado para marketplaces
- Mais competitivo que Ticket Sports (12%)
- Financia custos de infraestrutura e suporte
- Participante percebe valor (plataforma confiável, variedade de eventos)

#### **2. Taxa do Organizador**
**Modelo:** Taxa do gateway de pagamento  
**Quem Paga:** Organizador  
**O que inclui:** Custos de processamento de pagamento (PIX, cartão, boleto)

**Valores por Forma de Pagamento:**

| Forma de Pagamento | Taxa | Prazo Repasse | Quem Arca |
|-------------------|------|---------------|-----------|
| **PIX** | 0,99% | Imediato (D+0) | Organizador |
| **Cartão 30 dias** | 3,98% | 30 dias | Organizador |
| **Cartão 14 dias** | 4,49% | 14 dias | Organizador |
| **Cartão na hora** | 4,98% | Imediato | Organizador |
| **Boleto** | R$ 3,49 fixo | 2-3 dias úteis | Organizador |

**Exemplo Completo (Inscrição R$ 80,00 via PIX):**
```
┌─────────────────────────────────────────────┐
│ FLUXO FINANCEIRO                            │
├─────────────────────────────────────────────┤
│                                             │
│ PARTICIPANTE PAGA:                          │
│ • Inscrição: R$ 80,00                       │
│ • Taxa Okê Sports: R$ 8,00                  │
│ • TOTAL: R$ 88,00                           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ MERCADO PAGO PROCESSA:                      │
│ • Valor total: R$ 88,00                     │
│ • Taxa gateway (0,99%): -R$ 0,87            │
│ • Split automático:                         │
│   ├─ Organizador: R$ 79,13                  │
│   └─ Okê Sports: R$ 8,00                    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ ORGANIZADOR RECEBE:                         │
│ • R$ 79,13 (na hora!)                       │
│                                             │
│ OKÊ SPORTS RECEBE:                          │
│ • R$ 8,00 (taxa de serviço)                 │
│                                             │
│ ORGANIZADOR PAGA:                           │
│ • R$ 0,87 (taxa Mercado Pago)               │
│                                             │
└─────────────────────────────────────────────┘
```

**Diferencial Competitivo:**
- ✅ Sem taxa de setup por evento
- ✅ Sem mensalidade
- ✅ Sem retenção de 15% até o evento
- ✅ Repasse mais rápido (D+0 para PIX)
- ✅ Total transparência nos custos

### **Comparativo com Ticket Sports**

| Item | Ticket Sports | Okê Sports | Vantagem |
|------|--------------|------------|----------|
| **Taxa Participante** | 12% (mín. R$ 3,50) | 10% | Okê -17% 💚 |
| **Taxa Organizador** | ~8% | Taxa gateway (0,99% a 4,98%) | Okê -50% a -80% 💚 |
| **Taxa Setup** | R$ 149,90 | R$ 0,00 | Okê -100% 💚 |
| **Retenção pré-evento** | 15% | 0% | Okê 💚 |
| **Repasse PIX** | D+1 (R$ 5,00) | D+0 (grátis) | Okê 💚 |
| **Repasse Cartão** | D+30 (R$ 5,00) | D+14 ou D+30 | Okê 💚 |
| **Total Part. paga (R$ 80)** | R$ 89,60 | R$ 88,00 | Okê -R$ 1,60 💚 |
| **Org. recebe (PIX)** | R$ 72,00 (D+1) | R$ 79,13 (D+0) | Okê +R$ 7,13 💚 |

**Resumo:** Okê Sports é **significativamente mais vantajoso** tanto para organizadores quanto para participantes.

---

## 💳 INFRAESTRUTURA DE PAGAMENTOS

### **Gateway Escolhido: Mercado Pago**

**Rationale da Escolha:**
1. ✅ **Split Payment nativo** - divide pagamento automaticamente
2. ✅ **PIX com taxa de 0,99%** - mais barato que concorrentes
3. ✅ **Repasse imediato disponível** - organizador escolhe prazo
4. ✅ **Reconhecimento de marca** - confiança do consumidor
5. ✅ **Documentação completa** - facilita desenvolvimento
6. ✅ **Suporte em português** - facilita operação
7. ✅ **Compliance completo** - PCI-DSS, LGPD, etc.

### **Modelo de Integração**

**Tipo:** Marketplace com Split Payment  
**Controle:** Okê Sports (via código)  
**OAuth:** Sim (organizador autoriza Okê Sports a receber por ele)

**Fluxo Técnico:**
1. Organizador conecta conta Mercado Pago via OAuth
2. Okê Sports salva access_token do organizador
3. Nas vendas, Okê Sports cria pagamentos em nome do organizador
4. Split automático divide valores (organizador + Okê Sports)
5. Webhooks notificam aprovação de pagamento
6. Sistema atualiza status da inscrição

### **Formas de Pagamento Oferecidas**

| Forma | Ativo | Taxa | Aprovação | Repasse |
|-------|-------|------|-----------|---------|
| **PIX** | ✅ Sim | 0,99% | Imediato | D+0 |
| **Cartão Crédito** | ✅ Sim | 3,98% a 4,98% | 1-2 min | D+14 ou D+30 |
| **Cartão Débito** | ✅ Sim | 3,98% | Imediato | D+14 |
| **Boleto** | ✅ Sim | R$ 3,49 | 1-3 dias | D+2 |
| **Parcelamento** | ✅ Sim (2x-12x) | Variável | 1-2 min | Por parcela |

**Observações:**
- Juros do parcelamento são **sempre do participante**
- Organizador pode desabilitar formas de pagamento específicas
- Valores mínimos por forma de pagamento podem ser configurados

---

## 📊 PLANOS E PRECIFICAÇÃO

### **Modelo Freemium**

O Okê Sports adota um modelo **freemium** para reduzir barreiras de entrada e acelerar adoção.

#### **Plano FREE (Para Sempre)**
**Custo:** R$ 0,00/mês  
**Ideal para:** Organizadores iniciantes, eventos pequenos, testes

**Limites:**
- ✅ 1 evento ativo por vez
- ✅ Até 100 inscrições/mês
- ✅ Todas as formas de pagamento
- ✅ Dashboard básico
- ✅ Suporte por email (48h)

**Taxas:**
- Participante: 12% (2 p.p. a mais)
- Organizador: Taxa gateway padrão

**Branding:**
- "Powered by Okê Sports" visível
- Sem personalização de cores/logo

---

#### **Plano STARTER (R$ 49/mês)**
**Ideal para:** Organizadores regulares, assessorias pequenas

**Limites:**
- ✅ 3 eventos ativos simultaneamente
- ✅ Até 500 inscrições/mês
- ✅ Todas as formas de pagamento
- ✅ Dashboard completo
- ✅ Relatórios exportáveis
- ✅ Suporte prioritário (24h)

**Taxas:**
- Participante: 10% (taxa padrão)
- Organizador: Taxa gateway padrão

**Branding:**
- Logo e cores personalizadas
- "Powered by Okê Sports" removível

---

#### **Plano PRO (R$ 149/mês)**
**Ideal para:** Organizadores profissionais, eventos médios/grandes

**Limites:**
- ✅ Eventos ilimitados
- ✅ Inscrições ilimitadas
- ✅ Todas as formas de pagamento
- ✅ Dashboard avançado + Analytics
- ✅ Relatórios personalizados
- ✅ API de integração
- ✅ Suporte prioritário (12h)
- ✅ Gerente de conta

**Taxas:**
- Participante: 9% (1 p.p. menos)
- Organizador: Taxa gateway -0,5%

**Branding:**
- Personalização completa
- Subdomínio personalizado (ex: evento.okesports.com.br)
- White-label opcional (+R$ 50/mês)

**Extras inclusos:**
- Check-in ilimitado
- Email marketing (até 10k/mês)
- SMS (até 1k/mês)
- Cupons de desconto ilimitados
- Split de pagamento para anuentes

---

#### **Plano ENTERPRISE (Sob Consulta)**
**Ideal para:** Grandes organizadores, franchises, séries de eventos

**Benefícios:**
- ✅ Tudo do Pro
- ✅ Taxa negociada individualmente
- ✅ SLA de uptime 99,9%
- ✅ Gerente dedicado
- ✅ Integrações customizadas
- ✅ Treinamento presencial
- ✅ Suporte 24/7
- ✅ White-label completo
- ✅ Infraestrutura dedicada (opcional)

**Taxas:**
- Negociadas caso a caso
- Geralmente: 7-8% total (participante + organizador somados)

---

### **Calculadora de Economia**

**Exemplo: Corrida com 500 inscritos a R$ 100**

| Item | Ticket Sports | Okê Sports (Pro) | Economia |
|------|--------------|------------------|----------|
| **Receita Bruta** | R$ 50.000 | R$ 50.000 | - |
| **Taxa participante** | R$ 6.000 (12%) | R$ 4.500 (9%) | -R$ 1.500 💚 |
| **Taxa organizador** | R$ 4.000 (8%) | ~R$ 500 (taxa gateway) | -R$ 3.500 💚 |
| **Taxa setup** | R$ 149,90 | R$ 0 | -R$ 149,90 💚 |
| **Mensalidade** | R$ 0 | R$ 149 | +R$ 149 ❌ |
| **Retenção 15%** | R$ 7.500 (bloqueado) | R$ 0 | R$ 7.500 livre 💚 |
| **TOTAL CUSTOS** | R$ 10.149,90 | R$ 5.149 | **-R$ 5.000,90 💚** |
| **Org. recebe líquido** | R$ 39.850,10 | R$ 44.851 | **+R$ 5.000,90 💚** |
| **% Economia** | - | - | **+12,5%** |

**Conclusão:** Mesmo com mensalidade, Okê Sports **economiza mais de R$ 5 mil** em um único evento de porte médio.

---

## 🏗️ DECISÕES TÉCNICAS

### **Stack Tecnológico (Recomendado)**

#### **Backend**
- **Linguagem:** Node.js (TypeScript) ou Python
- **Framework:** NestJS (Node) ou FastAPI (Python)
- **Banco Principal:** PostgreSQL 14+
- **Cache:** Redis
- **Queue:** Bull (Node) ou Celery (Python)
- **Storage:** AWS S3 ou Azure Blob
- **Search:** Elasticsearch (opcional, para eventos)

#### **Frontend Web**
- **Framework:** Next.js 14+ (React)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Estado:** Zustand ou React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts ou Chart.js

#### **Mobile**
- **Framework:** React Native ou Flutter
- **Estado:** Redux Toolkit (RN) ou Riverpod (Flutter)
- **Navegação:** React Navigation (RN) ou Go Router (Flutter)

#### **Infraestrutura**
- **Cloud:** AWS (recomendado) ou Google Cloud
- **Compute:** 
  - Lambda/Cloud Functions (serverless)
  - ECS/Cloud Run (containers)
  - EC2/Compute Engine (VMs - se necessário)
- **CDN:** CloudFront ou Cloudflare
- **DNS:** Route 53 ou Cloudflare DNS
- **Monitoramento:** Sentry + Datadog ou New Relic
- **Logs:** CloudWatch ou Stackdriver

#### **DevOps**
- **CI/CD:** GitHub Actions ou GitLab CI
- **IaC:** Terraform
- **Containers:** Docker
- **Orquestração:** Kubernetes (se escala exigir)

### **Arquitetura de Dados**

**Modelo:** Multi-tenant (tenant_id em todas as tabelas)

**Principais Entidades:**
- Organizations (Organizadores)
- Events (Eventos)
- Event_Categories (Categorias/Modalidades)
- Event_Lots (Lotes de inscrição)
- Registrations (Inscrições)
- Payments (Pagamentos)
- Products (Produtos adicionais)
- Coupons (Cupons de desconto)
- Users (Usuários - participantes)
- Teams (Equipes/grupos)
- Check_ins (Check-ins realizados)

**Isolamento:**
- Todas as queries filtradas por organization_id
- RLS (Row Level Security) no PostgreSQL
- Testes automatizados de segurança

### **Segurança**

**Autenticação:**
- JWT (Access Token curto + Refresh Token longo)
- OAuth 2.0 para integrações (Google, Facebook, Strava)
- 2FA opcional para organizadores

**Autorização:**
- RBAC (Role-Based Access Control)
- Roles: Super Admin, Org Admin, Org Manager, Org Viewer

**Dados Sensíveis:**
- Criptografia em trânsito (TLS 1.3)
- Criptografia em repouso (AES-256)
- Tokenização de cartões (via gateway)
- PII (Personally Identifiable Information) segregado

**Compliance:**
- LGPD completo
- PCI-DSS Level 1 (via gateway certificado)
- OWASP Top 10 mitigado
- Pentest anual

---

## 📈 MÉTRICAS DE SUCESSO

### **KPIs Principais**

#### **Produto**
- **NPS (Net Promoter Score):** Meta > 50
- **Taxa de Conversão (Browse → Inscrito):** Meta > 15%
- **Taxa de Abandono de Carrinho:** Meta < 30%
- **Time to First Event:** Meta < 24h (do cadastro ao primeiro evento publicado)

#### **Negócio**
- **GMV (Gross Merchandise Value):** Valor total transacionado
  - Mês 6: R$ 50.000
  - Mês 12: R$ 250.000
  - Mês 24: R$ 1.000.000
- **MRR (Monthly Recurring Revenue):** Mensalidades
  - Mês 6: R$ 2.000
  - Mês 12: R$ 15.000
  - Mês 24: R$ 50.000
- **Take Rate:** Receita / GMV
  - Meta: 10-12%
- **Churn Rate:** Organizadores que cancelam
  - Meta Mês 6: < 15%
  - Meta Mês 12: < 10%
  - Meta Mês 24: < 5%

#### **Operacional**
- **Uptime:** Meta > 99,5%
- **Tempo de Resposta (p95):** Meta < 500ms
- **Taxa de Erro:** Meta < 0,5%
- **Tempo de Suporte (Resposta):** Meta < 24h

---

## 🎯 ESTRATÉGIA DE GO-TO-MARKET

### **Fase 1: MVP e Validação (Mês 1-6)**

**Objetivo:** Validar fit produto-mercado com early adopters

**Táticas:**
1. **Outreach Direto**
   - Contato pessoal com 50 organizadores
   - Oferta: 3 meses grátis no plano Pro
   - Meta: 10-15 organizadores ativos

2. **Parcerias Locais**
   - Assessorias esportivas de Fortaleza/CE
   - Eventos regionais conhecidos
   - Co-marketing

3. **Conteúdo Educativo**
   - Blog: "Como organizar eventos esportivos"
   - YouTube: Tutoriais da plataforma
   - Webinars mensais

**Budget:** R$ 5.000-10.000
**Meta GMV:** R$ 50.000/mês ao final

---

### **Fase 2: Crescimento Regional (Mês 7-18)**

**Objetivo:** Dominar Nordeste, expandir para Sudeste

**Táticas:**
1. **Performance Marketing**
   - Google Ads (busca: "plataforma inscrição corrida")
   - Facebook/Instagram Ads (lookalike de clientes)
   - Budget: R$ 10.000-20.000/mês

2. **Programa de Indicação**
   - Organizador indica outro: 2 meses grátis para ambos
   - Participante indica organizador: desconto na próxima inscrição

3. **Eventos Presenciais**
   - Estande em grandes corridas (São Silvestre, etc.)
   - Palestras em eventos do setor

4. **Parcerias Estratégicas**
   - Fabricantes de kits (medalhas, camisetas)
   - Cronometragem
   - Associações de corrida

**Budget:** R$ 30.000-50.000/mês
**Meta GMV:** R$ 250.000/mês ao final

---

### **Fase 3: Escala Nacional (Mês 19+)**

**Objetivo:** Líder regional, player nacional relevante

**Táticas:**
1. **Marca e Posicionamento**
   - Rebranding (se necessário)
   - Campanhas de branding
   - Patrocínios de eventos grandes

2. **Expansão de Produto**
   - Novos esportes (ciclismo, triatlo, natação)
   - Features corporativas (corridas de empresa)
   - Integração com wearables

3. **Sales Team**
   - SDRs para prospecção ativa
   - Account Executives para enterprise
   - Customer Success dedicado

**Budget:** R$ 100.000-200.000/mês
**Meta GMV:** R$ 1.000.000/mês

---

## 🚧 RISCOS E MITIGAÇÕES

### **Riscos de Negócio**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Ticket Sports rebaixa preços** | Alta | Alto | Diferenciar por velocidade de repasse e atendimento |
| **Sazonalidade forte** | Alta | Médio | Diversificar esportes, eventos virtuais |
| **Churn alto nos primeiros meses** | Média | Alto | Customer Success proativo, onboarding excelente |
| **Gateway aumentar taxas** | Baixa | Médio | Contrato longo prazo, ter gateway backup |
| **Crescimento mais lento que esperado** | Média | Alto | Controlar burn rate, ser lean, pivotar se necessário |

### **Riscos Técnicos**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Bugs críticos em produção** | Média | Crítico | Testes rigorosos, QA dedicado, monitoramento robusto |
| **Escalabilidade (picos de vendas)** | Média | Alto | Arquitetura escalável, load tests, auto-scaling |
| **Breach de segurança** | Baixa | Crítico | Pentest, código auditado, seguro cyber |
| **Downtime do gateway** | Baixa | Alto | Gateway backup, comunicação rápida com clientes |
| **Perda de dados** | Baixa | Crítico | Backups automáticos diários, disaster recovery plan |

---

## 📅 ROADMAP DE PRODUTO

### **Q1 2026: MVP Launch**
- ✅ Cadastro e gestão de eventos
- ✅ Sistema de inscrições web
- ✅ Integração Mercado Pago (PIX + Cartão)
- ✅ Dashboard básico do organizador
- ✅ Emails transacionais
- ✅ App de check-in (PWA)

### **Q2 2026: Consolidação**
- 🔄 Relatórios avançados
- 🔄 Cupons de desconto
- 🔄 Venda de produtos adicionais
- 🔄 Sistema de grupos/equipes
- 🔄 Email marketing
- 🔄 App mobile (participantes) - MVP

### **Q3 2026: Expansão**
- 📅 Landing pages personalizadas
- 📅 Split de pagamento (anuentes)
- 📅 Eventos virtuais
- 📅 Integração Strava
- 📅 Parcelamento no cartão
- 📅 Boleto bancário

### **Q4 2026: Escala**
- 📅 API pública
- 📅 White-label
- 📅 Subdomínios personalizados
- 📅 Analytics avançado
- 📅 Multi-idioma
- 📅 Novos esportes (ciclismo, natação)

**Legenda:**
- ✅ Concluído
- 🔄 Em desenvolvimento
- 📅 Planejado

---

## 🤝 EQUIPE E ESTRUTURA

### **Fase MVP (Mês 0-6)**
**Tamanho:** 4-5 pessoas  
**Budget:** R$ 50-70k/mês

**Composição:**
- 1 Product Owner / Fundador
- 2 Desenvolvedores Full Stack
- 1 Designer UX/UI (part-time ou freelancer)
- 1 QA / Tester (part-time)

### **Fase Crescimento (Mês 7-18)**
**Tamanho:** 10-15 pessoas  
**Budget:** R$ 120-180k/mês

**Composição:**
- Produto: Product Manager + 1 Designer
- Tech: CTO + 4 Devs + 1 DevOps + 1 QA
- Operações: 2 Customer Success + 1 Suporte
- Marketing: 1 Growth + 1 Conteúdo
- Comercial: 1 SDR

### **Fase Escala (Mês 19+)**
**Tamanho:** 25-40 pessoas  
**Budget:** R$ 250-400k/mês

**Composição:**
- Produto: Head + 3 PMs + 3 Designers
- Tech: CTO + 10 Devs + 2 DevOps + 3 QA
- Operações: Head CS + 5 CS + 3 Suporte
- Marketing: CMO + 4 Growth/Conteúdo
- Comercial: Head Sales + 3 AEs + 2 SDRs
- Financeiro: CFO + 1 Analista

---

## 📞 CONTATOS E RESPONSÁVEIS

### **Decisões Estratégicas**
**Responsável:** [Nome do Fundador/CEO]  
**Email:** [email]  
**Aprovação Final:** CEO

### **Decisões Técnicas**
**Responsável:** [Nome do CTO/Tech Lead]  
**Email:** [email]  
**Aprovação Final:** CTO + CEO

### **Decisões Comerciais**
**Responsável:** [Nome do Comercial/CFO]  
**Email:** [email]  
**Aprovação Final:** CFO + CEO

---

## 📝 HISTÓRICO DE REVISÕES

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 31/10/2025 | Claude | Documento inicial consolidando todas as decisões |

---

## ✅ APROVAÇÕES

**Este documento foi revisado e aprovado por:**

- [ ] CEO / Fundador
- [ ] CTO / Tech Lead
- [ ] CFO / Financeiro
- [ ] Head de Produto

**Data de Aprovação:** ____ / ____ / ________

**Assinaturas:**

___________________________  
CEO / Fundador

___________________________  
CTO / Tech Lead

---

**Fim do Documento**

*Este documento é confidencial e de propriedade exclusiva de Okê Sports. Não deve ser compartilhado sem autorização expressa.*
