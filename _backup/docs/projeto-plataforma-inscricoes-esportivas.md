# 🏃 PROJETO: PLATAFORMA DE INSCRIÇÕES PARA EVENTOS ESPORTIVOS

**Data:** 04 de Novembro de 2025  
**Baseado em:** Análise do Ticket Sports e mercado brasileiro

---

## 📑 ÍNDICE

1. [Análise do Ticket Sports](#análise-ticket-sports)
2. [Modelo de Negócio](#modelo-de-negócio)
3. [Estrutura Organizacional do MVP](#estrutura-mvp)
4. [Funcionalidades Core](#funcionalidades-core)
5. [Fluxo de Inscrição Completo](#fluxo-inscrição)
6. [Modelo de Monetização](#monetização)
7. [Sistema de Repasses](#repasses)
8. [Projeção Financeira](#projeção-financeira)
9. [Roadmap de Desenvolvimento](#roadmap)
10. [Próximos Passos](#próximos-passos)

---

## 🎯 ANÁLISE DO TICKET SPORTS {#análise-ticket-sports}

### **O que o Ticket Sports oferece:**

#### **Para Organizadores:**
- Dashboard gerencial completo
- Gestão de eventos e inscritos
- Sistema de lotes e precificação
- Cupons de desconto
- Painel financeiro com repasses automatizados
- Relatórios e insights em tempo real
- Hotsite customizado com DNS próprio
- Ferramentas de marketing (email, segmentação)
- Sistema de vouchers
- Automação de anuentes (parceiros)
- App de check-in
- Eventos virtuais
- API aberta

#### **Para Atletas:**
- Marketplace com todos os eventos
- Cadastro único (histórico completo)
- Múltiplas formas de pagamento
- App mobile (830k downloads)
- Inscrição rápida e intuitiva
- Área do atleta completa

### **Números do Ticket Sports:**
- 10 anos de mercado
- 14 mil eventos comercializados
- 10 milhões de inscrições vendidas
- 990 mil atletas ativos
- 2+ milhões pageviews/mês
- Receita 2023: ~R$ 22 milhões
- GMV 2023: ~R$ 150 milhões

### **Modelo de Receita Ticket Sports:**
- **Do Organizador:** 8% de comissão
- **Do Atleta:** Taxa fixa ~R$ 8
- **Margem total:** ~14-16% do GMV
- **Todos custos de gateway inclusos**

---

## 💰 MODELO DE NEGÓCIO {#modelo-de-negócio}

### **Proposta de Valor**

**Para Organizadores:**  
Plataforma completa para vender inscrições, gerenciar eventos e receber pagamentos de forma automatizada.

**Para Atletas:**  
Marketplace centralizado para descobrir eventos esportivos e fazer inscrições de forma rápida e segura.

### **Modelo Escolhido:**

**Marketplace Bilateral (Two-Sided)**

**Receita:**
- Taxa do Atleta: 8% do valor da inscrição (máximo R$ 8)
- Comissão do Organizador: 8% sobre valor da inscrição

**Fórmula da taxa do atleta:**
```
Taxa = MIN(valor_inscrição × 0.08, 8.00)
```

**Exemplos:**
- Inscrição R$ 50 → Taxa R$ 4,00
- Inscrição R$ 80 → Taxa R$ 6,40
- Inscrição R$ 100 → Taxa R$ 8,00
- Inscrição R$ 150 → Taxa R$ 8,00 (teto)
- Inscrição R$ 200 → Taxa R$ 8,00 (teto)

---

## 🏗️ ESTRUTURA ORGANIZACIONAL DO MVP {#estrutura-mvp}

### **Core do Produto - Funcionalidades Essenciais**

#### **1. LADO DO ORGANIZADOR**

**A. Gestão de Eventos**
- Criar evento com informações básicas
- Configurar modalidades (5km, 10km, 21km, etc)
- Definir preços por modalidade
- Criar lotes de preços (por data ou volume)
- Gerar página do evento automaticamente
- DNS customizado (organizador aponta domínio)

**B. Gestão de Inscritos**
- Lista completa de inscritos
- Filtros: modalidade, status pagamento, período
- Busca por nome/CPF
- Exportar relatório (Excel/CSV)
- Ver detalhes de cada inscrição
- Cancelar inscrições (com regras)

**C. Sistema de Cupons**
- Criar cupom de desconto
- Tipos: percentual ou valor fixo
- Validade (data início/fim)
- Limite de usos
- Aplicável a modalidades específicas
- Gestão: ver usos, editar, desativar

**D. Painel Financeiro**
- Dashboard com:
  - Receita total do evento
  - Valor disponível para saque
  - Valor já sacado
  - Comissão da plataforma
  - Total de inscrições pagas
  - Ticket médio
- Solicitar repasse via PIX
- Histórico de transações
- Extrato completo

#### **2. LADO DO ATLETA**

**A. Cadastro e Login**
- Nome completo
- Email (login)
- CPF
- Data de nascimento
- Telefone
- Senha
- **Endereço completo:**
  - CEP (primeiro campo - autocomplete)
  - Rua (preenchido auto)
  - Número
  - Complemento
  - Bairro (preenchido auto)
  - Cidade (preenchido auto)
  - Estado (preenchido auto)

**B. Marketplace de Eventos**
- Página inicial com eventos abertos
- Card por evento:
  - Banner
  - Nome do evento
  - Data
  - Local
  - (SEM preço "a partir de")
- Filtros:
  - Cidade/estado
  - Modalidade
  - Data
  - Distância
- Busca por nome

**C. Área do Atleta**
- Minhas inscrições
- Histórico completo
- Baixar comprovantes
- Editar dados pessoais

#### **3. MARKETPLACE**
- Homepage pública (sem login)
- Eventos em destaque
- Eventos por região
- Calendário mensal
- SEO otimizado

---

## 🔄 FLUXO DE INSCRIÇÃO COMPLETO {#fluxo-inscrição}

### **LÓGICA DO FLUXO:**

1. Usuário faz inscrição DELE primeiro
2. Depois pode adicionar terceiros, um por um
3. Cada inscrição tem seu próprio cupom
4. Carrinho lateral mostra todas as inscrições
5. Pagamento único no final

---

### **ETAPA 1: INSCRIÇÃO DO USUÁRIO LOGADO**

#### **Passo 1: Escolher Modalidade**
```
┌──────────────────────────────────────────┐
│ Corrida de São Paulo 2025                │
│ 📅 15 de Dezembro 2025                   │
│                                          │
│ Escolha sua modalidade:                  │
│                                          │
│ ○ 5km - R$ 80                           │
│ ○ 10km - R$ 120                         │
│ ○ 21km - R$ 180                         │
│                                          │
│ [Continuar]                              │
└──────────────────────────────────────────┘
```

#### **Passo 2: Confirmar Dados + Aplicar Cupom**
```
┌──────────────────────────────────────────┐
│ Confirme seus dados:                     │
│                                          │
│ Nome: João Silva ✓                       │
│ CPF: 123.456.789-00 ✓                   │
│ Data de Nascimento: 15/03/1990 ✓        │
│ Email: [email protected] ✓              │
│                                          │
│ Modalidade: 5km - R$ 80,00              │
│                                          │
│ ✓ Dados corretos [Editar dados]          │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 🎟️ Tem um cupom de desconto?            │
│                                          │
│ Código: [CORRIDA10]  [Aplicar]           │
│                                          │
│ ✅ CORRIDA10 - 10% de desconto           │
│ [Remover cupom]                          │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 💰 Resumo:                               │
│ Inscrição: R$ 80,00                     │
│ Desconto: -R$ 8,00                      │
│ Subtotal: R$ 72,00                      │
│ Taxa de serviço: R$ 5,76 (8%)           │
│ ═══════════════════════                  │
│ Total: R$ 77,76                         │
│                                          │
│ [Voltar] [Adicionar ao Carrinho]         │
└──────────────────────────────────────────┘
```

#### **Passo 3: Primeira Inscrição Adicionada**
```
┌──────────────────────────────────────────┐
│ ✅ Sua inscrição foi adicionada!         │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ João Silva - 5km                   │  │
│ │ R$ 72,00 + R$ 5,76 = R$ 77,76     │  │
│ │ [Remover]                          │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 🎯 Deseja inscrever mais alguém?         │
│                                          │
│ [✚ Adicionar Outra Pessoa]               │
│                                          │
│ [Ir para Pagamento]                      │
└──────────────────────────────────────────┘
```

---

### **ETAPA 2: INSCREVER TERCEIROS (LOOP)**

#### **Passo 1: Escolher Modalidade do Terceiro**
```
┌──────────────────────────────────────────┐
│ Adicionar Nova Pessoa                    │
│                                          │
│ Escolha a modalidade:                    │
│                                          │
│ ○ 5km - R$ 80                           │
│ ○ 10km - R$ 120                         │
│ ○ 21km - R$ 180                         │
│                                          │
│ [Voltar] [Continuar]                     │
└──────────────────────────────────────────┘
```

#### **Passo 2: Dados do Terceiro + Cupom**
```
┌──────────────────────────────────────────┐
│ Dados do participante                    │
│                                          │
│ Nome completo *                          │
│ [Maria Santos________________]           │
│                                          │
│ CPF *                                    │
│ [987.654.321-00]                         │
│                                          │
│ Data de Nascimento *                     │
│ [25/08/1995]                             │
│                                          │
│ Email *                                  │
│ [[email protected]]            │
│                                          │
│ Modalidade: 5km                          │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 🎟️ Tem um cupom de desconto?            │
│                                          │
│ Código: [AMIGO20]  [Aplicar]             │
│                                          │
│ ✅ AMIGO20 - R$ 20 de desconto           │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 💰 Resumo:                               │
│ Inscrição: R$ 80,00                     │
│ Desconto: -R$ 20,00                     │
│ Subtotal: R$ 60,00                      │
│ Taxa de serviço: R$ 4,80                │
│ ═══════════════════════                  │
│ Total: R$ 64,80                         │
│                                          │
│ [Voltar] [Adicionar ao Carrinho]         │
└──────────────────────────────────────────┘
```

#### **Passo 3: Resumo Atualizado**
```
┌──────────────────────────────────────────┐
│ ✅ Inscrição adicionada!                 │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 1. João Silva - 5km                │  │
│ │    R$ 77,76  [Remover]             │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 2. Maria Santos - 5km              │  │
│ │    R$ 64,80  [Remover]             │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ─────────────────────────────────────    │
│ Total até agora: R$ 142,56               │
│ ─────────────────────────────────────    │
│                                          │
│ 🎯 Deseja inscrever mais alguém?         │
│                                          │
│ [✚ Adicionar Outra Pessoa]               │
│                                          │
│ [Ir para Pagamento]                      │
└──────────────────────────────────────────┘
```

*O usuário pode repetir esse processo até 10 pessoas*

---

### **ETAPA 3: PAGAMENTO**

```
┌──────────────────────────────────────────┐
│ Resumo do Pedido                         │
│                                          │
│ Corrida de São Paulo 2025                │
│ 📅 15 de Dezembro 2025                   │
│                                          │
│ ─────────────────────────────────────    │
│ 1. João Silva - 5km                      │
│    Inscrição: R$ 72,00 (CORRIDA10)      │
│    Taxa: R$ 5,76                         │
│    Subtotal: R$ 77,76                    │
│                                          │
│ 2. Maria Santos - 5km                    │
│    Inscrição: R$ 60,00 (AMIGO20)        │
│    Taxa: R$ 4,80                         │
│    Subtotal: R$ 64,80                    │
│                                          │
│ 3. Pedro Costa - 10km                    │
│    Inscrição: R$ 120,00                  │
│    Taxa: R$ 8,00                         │
│    Subtotal: R$ 128,00                   │
│                                          │
│ ═════════════════════════════════════    │
│ TOTAL A PAGAR: R$ 270,56                │
│ ═════════════════════════════════════    │
│                                          │
│ Forma de pagamento:                      │
│ ● PIX (Aprovação instantânea)            │
│                                          │
│ [Voltar] [Finalizar Pagamento]           │
└──────────────────────────────────────────┘
```

---

### **CARRINHO LATERAL (sempre visível)**

```
┌─────────────────────────┐
│ 🛒 Seu Pedido           │
├─────────────────────────┤
│                         │
│ 1. João Silva           │
│    5km - R$ 77,76       │
│    [Remover]            │
│                         │
│ 2. Maria Santos         │
│    5km - R$ 64,80       │
│    [Remover]            │
│                         │
│ 3. Pedro Costa          │
│    10km - R$ 128,00     │
│    [Remover]            │
│                         │
│ ─────────────────────   │
│ Total: R$ 270,56        │
│                         │
│ [✚ Adicionar Pessoa]    │
│ [💳 Ir para Pagamento]  │
└─────────────────────────┘
```

---

## 💸 MODELO DE MONETIZAÇÃO {#monetização}

### **Estrutura de Receita**

**Taxa do Atleta:**
- 8% do valor da inscrição
- **Máximo de R$ 8,00**
- Fórmula: `MIN(valor × 0.08, 8.00)`

**Comissão do Organizador:**
- 8% sobre o valor da inscrição
- Descontado antes do repasse

### **Exemplo de Cálculo - Inscrição R$ 100:**

```
Atleta paga: R$ 108,00
├─ Inscrição: R$ 100,00
└─ Taxa de serviço: R$ 8,00 (8%)

Entrada na plataforma: R$ 108,00
├─ Gateway (Asaas): -R$ 0,49
└─ Líquido recebido: R$ 107,51

Distribuição:
├─ Organizador recebe: R$ 92,00 (R$ 100 - 8%)
├─ Comissão organizador: R$ 8,00 (8%)
├─ Taxa atleta: R$ 8,00
├─ Custo gateway: R$ 0,49
└─ Margem da plataforma: R$ 7,51

Receita da plataforma: R$ 16,00
(-) Custo gateway: R$ 0,49
(=) Margem líquida: R$ 15,51 (14,4%)
```

### **Tabela de Margens por Ticket:**

| Inscrição | Taxa Atleta | Comissão Org | Custo Gateway | Receita Total | Margem Líquida |
|-----------|-------------|--------------|---------------|---------------|----------------|
| R$ 50 | R$ 4,00 | R$ 4,00 | R$ 0,49 | R$ 8,00 | R$ 7,51 |
| R$ 80 | R$ 6,40 | R$ 6,40 | R$ 0,49 | R$ 12,80 | R$ 12,31 |
| R$ 100 | R$ 8,00 | R$ 8,00 | R$ 0,49 | R$ 16,00 | R$ 15,51 |
| R$ 120 | R$ 8,00 | R$ 9,60 | R$ 0,49 | R$ 17,60 | R$ 17,11 |
| R$ 150 | R$ 8,00 | R$ 12,00 | R$ 0,49 | R$ 20,00 | R$ 19,51 |
| R$ 200 | R$ 8,00 | R$ 16,00 | R$ 0,49 | R$ 24,00 | R$ 23,51 |

---

## 🔄 SISTEMA DE REPASSES {#repasses}

### **Apenas PIX (MVP)**

**Regras:**
- Repasse disponível 7 dias após o evento
- Mínimo de R$ 100 para saque
- Processamento em até 2 dias úteis
- Sem taxa adicional para PIX
- Sem limite de valor máximo
- Pode solicitar quantas vezes quiser

### **Fluxo de Repasse:**

**1. Configuração Inicial**
- Organizador cadastra chave PIX
- Validação da chave (mesmo CPF/CNPJ)
- Pode editar a qualquer momento

**2. Solicitar Repasse**
```
┌─────────────────────────────────────────┐
│ 💰 Financeiro - Corrida de São Paulo   │
│                                         │
│ Saldo Disponível: R$ 4.680,00          │
│                                         │
│ [Solicitar Repasse via PIX]             │
│                                         │
│ Próximo repasse disponível:             │
│ 📅 22 de Dezembro (7 dias após evento) │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Receita Total: R$ 5.000,00             │
│ (-) Comissão (8%): R$ 400,00           │
│ (-) Custos Gateway: R$ 20,00           │
│ (=) Líquido: R$ 4.680,00               │
└─────────────────────────────────────────┘
```

**3. Confirmação**
```
┌─────────────────────────────────────────┐
│ Solicitar Repasse via PIX               │
│                                         │
│ Valor: R$ 4.680,00                     │
│                                         │
│ Chave PIX: [email protected]       │
│ [Alterar chave]                         │
│                                         │
│ ⚠️ Atenção:                             │
│ • Repasse em até 2 dias úteis          │
│ • Confirmação por email                 │
│ • Chave deve estar no seu nome         │
│                                         │
│ [Cancelar] [Confirmar Repasse]          │
└─────────────────────────────────────────┘
```

**4. Processamento**
```
┌─────────────────────────────────────────┐
│ ✅ Repasse solicitado com sucesso!      │
│                                         │
│ Protocolo: #RP20251228-4532             │
│ Valor: R$ 4.680,00                     │
│ Chave PIX: [email protected]       │
│ Prazo: até 28/12/2025                   │
│                                         │
│ Você receberá email quando processado.  │
│                                         │
│ [Voltar para Financeiro]                │
└─────────────────────────────────────────┘
```

### **Emails Automáticos:**

**Ao solicitar:**
```
Assunto: Repasse solicitado - #RP20251228-4532

Olá, João!

Seu repasse foi solicitado.

Valor: R$ 4.680,00
Chave PIX: [email protected]
Prazo: até 28/12/2025

Acompanhe no painel financeiro.
```

**Quando processado:**
```
Assunto: ✅ Repasse processado - R$ 4.680,00

Olá, João!

Seu repasse foi processado!

Valor: R$ 4.680,00
Chave PIX: [email protected]
Data: 27/12/2025

O valor deve aparecer em minutos.
```

---

## 📊 PROJEÇÃO FINANCEIRA {#projeção-financeira}

### **PREMISSAS:**

- Ticket médio: R$ 100
- Taxa atleta: R$ 8 (8% com teto)
- Comissão organizador: 8% = R$ 8
- Gateway (Asaas): R$ 0,49 por PIX
- Margem por inscrição: R$ 15,51

---

### **CENÁRIO 1: MVP - PRIMEIROS 6 MESES**

**Meta:** Validar produto

| Período | Mês 1-2 | Mês 3-4 | Mês 5-6 | **Total 6m** |
|---------|---------|---------|---------|--------------|
| Eventos ativos | 3 | 8 | 15 | 26 |
| Inscrições/mês | 150 | 400 | 800 | 1.350 |
| GMV/mês | R$ 15k | R$ 40k | R$ 80k | R$ 135k |
| Receita Bruta/mês | R$ 2.400 | R$ 6.400 | R$ 12.800 | R$ 21.600 |
| (-) Gateway/mês | R$ 74 | R$ 196 | R$ 392 | R$ 662 |
| **Receita Líquida/mês** | **R$ 2.326** | **R$ 6.204** | **R$ 12.408** | **R$ 20.938** |

**Custos 6 meses:**
- Equipe (3-4 pessoas): R$ 60.000
- Infraestrutura: R$ 3.000
- Ferramentas: R$ 2.000
- Marketing: R$ 5.000
- **Total:** R$ 70.000

**Resultado:** -R$ 49.062 (prejuízo esperado)

---

### **CENÁRIO 2: ANO 1 - CRESCIMENTO**

**Meta:** 100 eventos ativos

| Trimestre | Q1 | Q2 | Q3 | Q4 | **Ano 1** |
|-----------|----|----|----|----|-----------|
| Eventos | 25 | 50 | 75 | 100 | 100 |
| Inscrições/mês | 1.500 | 3.000 | 4.500 | 6.000 | 15.000 |
| GMV/mês | R$ 150k | R$ 300k | R$ 450k | R$ 600k | R$ 1,5mi |
| Receita Líquida/mês | R$ 23k | R$ 47k | R$ 70k | R$ 93k | **R$ 233k** |

**GMV Anual:** R$ 1.800.000  
**Receita Líquida Anual:** R$ 279.180

**Custos Ano 1:**
- Equipe (6-8 pessoas): R$ 480.000
- Infraestrutura: R$ 24.000
- Marketing: R$ 60.000
- Outros: R$ 36.000
- **Total:** R$ 600.000

**Resultado:** -R$ 320.820 (investindo em crescimento)

---

### **CENÁRIO 3: ANO 2 - ESCALA**

**Meta:** 300 eventos, breakeven

| Trimestre | Q1 | Q2 | Q3 | Q4 | **Ano 2** |
|-----------|----|----|----|----|-----------|
| Eventos | 150 | 200 | 250 | 300 | 300 |
| Inscrições/mês | 9.000 | 12.000 | 15.000 | 18.000 | 54.000 |
| GMV/mês | R$ 900k | R$ 1,2mi | R$ 1,5mi | R$ 1,8mi | R$ 5,4mi |
| Receita Líquida/mês | R$ 140k | R$ 186k | R$ 233k | R$ 279k | **R$ 838k** |

**GMV Anual:** R$ 16.200.000  
**Receita Líquida Anual:** R$ 1.005.048

**Custos Ano 2:**
- Equipe (12-15 pessoas): R$ 720.000
- Infraestrutura: R$ 48.000
- Marketing: R$ 120.000
- Outros: R$ 72.000
- **Total:** R$ 960.000

**Resultado:** +R$ 45.048 (breakeven! 🎉)

---

### **CENÁRIO 4: ANO 3 - MATURIDADE**

**Meta:** 500 eventos, lucro sustentável

| Trimestre | Q1 | Q2 | Q3 | Q4 | **Ano 3** |
|-----------|----|----|----|----|-----------|
| Eventos | 350 | 400 | 450 | 500 | 500 |
| Inscrições/mês | 21k | 24k | 27k | 30k | 102k |
| GMV/mês | R$ 2,1mi | R$ 2,4mi | R$ 2,7mi | R$ 3mi | R$ 10,2mi |
| Receita Líquida/mês | R$ 326k | R$ 372k | R$ 419k | R$ 465k | **R$ 1.582k** |

**GMV Anual:** R$ 30.600.000  
**Receita Líquida Anual:** R$ 1.898.424

**Custos Ano 3:**
- Equipe (20-25 pessoas): R$ 1.200.000
- Infraestrutura: R$ 72.000
- Marketing: R$ 180.000
- Outros: R$ 108.000
- **Total:** R$ 1.560.000

**Resultado:** +R$ 338.424 (lucro 21% margem)

---

### **RESUMO 3 ANOS:**

| Ano | GMV | Receita Líquida | Custos | Resultado | Margem |
|-----|-----|----------------|--------|-----------|--------|
| Ano 1 | R$ 1,8mi | R$ 279k | R$ 600k | -R$ 321k | -115% |
| Ano 2 | R$ 16,2mi | R$ 1.005k | R$ 960k | +R$ 45k | 4,5% |
| Ano 3 | R$ 30,6mi | R$ 1.898k | R$ 1.560k | +R$ 338k | 17,8% |
| **Total** | **R$ 48,6mi** | **R$ 3.183k** | **R$ 3.120k** | **+R$ 63k** | **2%** |

---

### **MARCOS (MILESTONES):**

- **Mês 6:** 15 eventos, 800 inscrições/mês (Validação)
- **Mês 12:** 100 eventos, 6k inscrições/mês (Tração)
- **Mês 18:** 200 eventos, 12k inscrições/mês (Breakeven)
- **Mês 24:** 300 eventos, 18k inscrições/mês (Escala)
- **Mês 36:** 500 eventos, 30k inscrições/mês (Maturidade)

---

### **COMPARAÇÃO COM TICKET SPORTS:**

**Ticket Sports (atual):**
- 10 anos de mercado
- ~1,3 milhão inscrições/ano
- GMV: R$ 150mi/ano
- Receita: ~R$ 22mi/ano

**Sua Plataforma (projeção Ano 3):**
- 3 anos de mercado
- 360 mil inscrições/ano
- GMV: R$ 30mi/ano
- Receita: R$ 1,9mi/ano

**Você seria ~8-10% do tamanho do Ticket Sports.**  
Isso é realista e alcançável!

---

## 🗓️ ROADMAP DE DESENVOLVIMENTO {#roadmap}

### **FASE 1: MVP (Mês 0-4)**

**Mês 1-2: Fundação**
- [ ] Cadastro e login (organizador + atleta)
- [ ] Criar evento (formulário completo)
- [ ] Modalidades e lotes
- [ ] Página do evento (template)
- [ ] Sistema de inscrição básico

**Mês 2-3: Pagamentos**
- [ ] Integração gateway (Asaas)
- [ ] Pagamento via PIX
- [ ] Painel financeiro básico
- [ ] Lista de inscritos
- [ ] Sistema de cupons

**Mês 3-4: Marketplace e Refinamento**
- [ ] Homepage marketplace
- [ ] Busca e filtros
- [ ] DNS customizado
- [ ] Sistema de repasse
- [ ] Área do atleta
- [ ] Emails transacionais
- [ ] Testes e ajustes

---

### **FASE 2: CRESCIMENTO (Mês 5-12)**

**Funcionalidades:**
- [ ] Cartão de crédito (parcelamento)
- [ ] Boleto bancário
- [ ] Relatórios avançados
- [ ] Exportação de dados
- [ ] Produtos extras (camiseta, etc)
- [ ] Comunicados para inscritos
- [ ] Certificados digitais
- [ ] Check-in (QR Code)

**Melhorias:**
- [ ] UX refinado
- [ ] Performance
- [ ] Automações
- [ ] Analytics

---

### **FASE 3: ESCALA (Ano 2+)**

- [ ] App mobile para atletas
- [ ] Eventos virtuais
- [ ] Grupos e assessorias
- [ ] API aberta
- [ ] Programa de afiliados
- [ ] Portal de conteúdo
- [ ] Recursos de CRM
- [ ] Anuentes automatizados
- [ ] Internacionalização

---

## 👥 EQUIPE NECESSÁRIA

### **MVP (Mês 0-6):**

**Mínimo viável:**
- 1 Product Owner / Fundador
- 2 Desenvolvedores (1 Back + 1 Front)
- 1 Designer UX/UI
- 1 Operações/CS (pode acumular)

**Investimento:** ~R$ 70.000 (6 meses)

---

### **Crescimento (Ano 1):**

- Head de Produto
- 4-6 Desenvolvedores
- 2 Designers
- 1 DevOps
- 2 CS (Organizadores)
- 2 Suporte (Atletas)
- 1 Marketing

**Total:** 12-15 pessoas

---

### **Escala (Ano 2+):**

- CTO
- 8-10 Desenvolvedores
- Head de CS
- Head de Marketing
- Head Comercial
- CFO/Controller
- 20-25 pessoas total

---

## 🎯 PRÓXIMOS PASSOS {#próximos-passos}

### **Semana 1-2: VALIDAÇÃO**
- [ ] Conversar com 10-20 organizadores
- [ ] Entender dores reais
- [ ] Validar disposição para migrar
- [ ] Conversar com atletas
- [ ] Definir diferencial vs Ticket Sports

### **Semana 3-4: PLANEJAMENTO**
- [ ] Definir stack tecnológico
- [ ] Estimar custos completos
- [ ] Criar projeção financeira detalhada
- [ ] Decidir modelo de cobrança final
- [ ] Contratar/montar equipe inicial

### **Mês 2-4: DESENVOLVIMENTO**
- [ ] Wireframes e protótipos
- [ ] Desenvolvimento MVP
- [ ] Testes internos
- [ ] Beta com 1-3 organizadores

### **Mês 5: LANÇAMENTO**
- [ ] Soft launch
- [ ] Primeiros eventos reais
- [ ] Coleta de feedback
- [ ] Iteração rápida

---

## 💡 DECISÕES CRÍTICAS

### **1. Diferenciação vs Ticket Sports:**
- [ ] Preço mais baixo?
- [ ] Melhor UX?
- [ ] Foco regional?
- [ ] Nicho específico?
- [ ] Atendimento mais próximo?

### **2. Foco Geográfico:**
- [ ] Nacional desde início?
- [ ] Regional (cidade/estado)?
- [ ] Sul/Sudeste?

### **3. Modalidades:**
- [ ] Só corrida no MVP?
- [ ] Multi-esporte desde início?

### **4. Investimento:**
- [ ] Bootstrapped?
- [ ] Buscar investimento?
- [ ] Quanto de runway precisa?

### **5. Gateway de Pagamento:**
- [ ] Asaas (recomendado)
- [ ] Mercado Pago
- [ ] Outro?

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Ticket Sports domina mercado | Alto | Alta | Nicho regional/modalidades específicas |
| Organizadores não migram | Alto | Média | Oferta irresistível (preço/valor) |
| Fraudes em pagamento | Alto | Média | Antifraude robusto |
| Gateway aumentar taxa | Alto | Baixa | Contrato longo prazo |
| Sazonalidade forte | Médio | Alta | Eventos virtuais, diversificar |
| Churn organizadores | Médio | Média | CS excelente, facilidade |
| Crescimento lento | Médio | Média | Controlar burn rate |

---

## ✅ CONCLUSÕES

### **O modelo é viável?**

**✅ SIM**

**Por quê:**
1. Margem saudável ~15% sobre GMV
2. Breakeven em 18-24 meses
3. Mercado provado (Ticket fatura R$ 22mi/ano)
4. Escalabilidade alta
5. Custos gateway controlados

### **Recomendações:**

**MVP (Mês 0-6):**
- Foco: validar com 10-15 organizadores
- Investir: R$ 70k
- Meta: Provar que funciona

**Crescimento (Mês 7-18):**
- Foco: escalar 100-200 eventos
- Investir: R$ 400-600k (seed)
- Meta: Atingir breakeven

**Escala (Mês 19+):**
- Foco: competir regionalmente
- Investir: Lucro operacional
- Meta: 30k+ inscrições/mês

---

## 📞 CONTATO E PRÓXIMOS PASSOS

Este documento é um guia completo para desenvolvimento do MVP de uma plataforma de inscrições esportivas baseada no modelo de sucesso do Ticket Sports.

**Próximas ações recomendadas:**
1. Validar com organizadores reais
2. Montar equipe técnica
3. Definir stack tecnológico
4. Wireframes detalhados
5. Especificação técnica completa
6. Cronograma sprint por sprint

---

**Documento gerado em:** 04 de Novembro de 2025  
**Versão:** 1.0 - MVP Planning  
**Status:** Ready for Development

---

## 🎯 STACK TECNOLÓGICO SUGERIDO (Para discussão futura)

**Backend:**
- Node.js + Express ou NestJS
- PostgreSQL
- Redis (cache)
- Bull (filas)

**Frontend:**
- React + Next.js
- Tailwind CSS
- TypeScript

**Infraestrutura:**
- Vercel ou AWS
- Cloudflare (CDN)
- SendGrid (emails)

**Pagamentos:**
- Asaas (PIX)
- Stripe ou Mercado Pago (cartão - Fase 2)

**Outros:**
- ViaCEP (autocomplete endereço)
- Google Maps API
- Sentry (monitoramento)
- PostHog (analytics)

---

## 📚 REFERÊNCIAS

- Análise Ticket Sports: https://www.ticketsports.com.br
- Modelo de negócio: Marketplace bilateral
- Benchmark: Eventbrite, Sympla, Ticket Sports
- Gateway: Asaas (https://www.asaas.com)

---

**FIM DO DOCUMENTO**

Este é um documento vivo e deve ser atualizado conforme o projeto evolui.