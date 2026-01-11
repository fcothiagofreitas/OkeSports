# 🎯 Plano de Melhorias - Experiência do Participante

**Data:** 09 de Janeiro de 2026
**Foco:** Melhorar funcionalidades existentes e experiência do usuário participante

---

## 📋 Índice

1. [Análise do Estado Atual](#1-análise-do-estado-atual)
2. [Melhorias de UX/Interface](#2-melhorias-de-uxinterface)
3. [Funcionalidades Faltantes](#3-funcionalidades-faltantes)
4. [Melhorias de Experiência](#4-melhorias-de-experiência)
5. [Plano de Implementação](#5-plano-de-implementação)
6. [Prioridades](#6-prioridades)

---

## 1. Análise do Estado Atual

### ✅ O que está funcionando bem:

1. **Cadastro e Login**
   - Formulário funcional
   - Validações básicas
   - Redirecionamento pós-login funciona

2. **Página do Evento (`/e/[slug]`)**
   - Design moderno e profissional
   - Informações bem organizadas
   - Responsivo

3. **Fluxo de Inscrição (`/e/[slug]/inscricao/[modalityId]`)**
   - Carrinho para múltiplos participantes ✅
   - Seleção de tamanho de camisa ✅
   - Validações de formulário ✅
   - Integração com pagamento ✅

4. **Área do Participante (`/minha-conta`)**
   - Lista de inscrições funciona
   - Status bem visualizado
   - Edição de tamanho de camisa funciona
   - Cancelamento funciona

5. **Páginas de Status**
   - Sucesso (`/inscricao/sucesso`)
   - Pendente (`/inscricao/pendente`)
   - Falha (`/inscricao/falha`)

### ⚠️ O que precisa melhorar:

1. **Feedback ao Usuário**
   - ❌ Usa `alert()` para mensagens (ruim UX)
   - ❌ Sem sistema de toast/notificações
   - ❌ Mensagens de erro poderiam ser mais claras
   - ❌ Loading states básicos

2. **Área do Participante - Gaps**
   - ❌ Edição de dados pessoais (botão desabilitado)
   - ❌ Baixar comprovante (botão desabilitado)
   - ❌ Falta filtros/busca nas inscrições
   - ❌ Falta ordenação (data, status)
   - ❌ Falta histórico de pagamentos detalhado
   - ⚠️ Layout pode ser melhorado (mais informações visíveis)

3. **Fluxo de Inscrição - Melhorias**
   - ⚠️ Cupons: Campo existe mas feedback poderia ser melhor
   - ⚠️ Validações: Algumas mensagens são técnicas demais
   - ⚠️ Progresso: Não mostra passo atual no fluxo
   - ⚠️ Confirmação: Não tem resumo visual claro antes de finalizar

4. **Autenticação**
   - ❌ Recuperação de senha não implementada
   - ❌ Link "Esqueci minha senha" não existe

5. **Detalhes de Inscrição**
   - ⚠️ Falta página de detalhes completa da inscrição
   - ⚠️ Informações poderiam ser mais detalhadas

---

## 2. Melhorias de UX/Interface

### 2.1 Sistema de Notificações (Toast) 🔴 **ALTA PRIORIDADE**

**Problema:** Atualmente usa `alert()` que bloqueia a tela e tem UX ruim.

**Solução:** Implementar sistema de toast/notificações.

**Impacto:** ✅ Melhora significativa na experiência

**O que implementar:**
- [ ] Instalar/react-toastify ou shadcn/ui toast
- [ ] Substituir todos os `alert()` por toasts
- [ ] Substituir mensagens inline por toasts onde fizer sentido
- [ ] Adicionar toasts para:
  - Sucesso (criação de conta, atualização, etc)
  - Erro (validações, falhas de API)
  - Info (avisos importantes)
  - Warning (confirmações)

**Componente sugerido:** `shadcn/ui toast` (já tem dialog, button, etc)

**Exemplo:**
```tsx
// Antes
alert('Inscrição cancelada com sucesso!');

// Depois
toast.success('Inscrição cancelada com sucesso!');
```

---

### 2.2 Melhorar Mensagens de Erro 🟡 **MÉDIA PRIORIDADE**

**Problema:** Mensagens de erro às vezes são técnicas ou genéricas.

**Solução:** Mensagens mais amigáveis e específicas.

**O que fazer:**
- [ ] Criar mapeamento de erros técnicos → mensagens amigáveis
- [ ] Adicionar sugestões de correção nas mensagens
- [ ] Melhorar validações de formulário (mensagens mais claras)
- [ ] Adicionar ícones visuais (✓ erro, ⚠️ aviso, ℹ️ info)

**Exemplo:**
```tsx
// Antes
"Error: CPF already registered"

// Depois
"Este CPF já está cadastrado. Você já tem uma conta? <Link>Fazer login</Link>"
```

---

### 2.3 Indicador de Progresso no Fluxo de Inscrição 🟡 **MÉDIA PRIORIDADE**

**Problema:** Participante não sabe em qual passo está durante a inscrição.

**Solução:** Adicionar stepper/progresso visual.

**O que implementar:**
- [ ] Stepper visual mostrando:
  - Passo 1: Selecionar Modalidade ✅
  - Passo 2: Dados dos Participantes (atual)
  - Passo 3: Confirmação
  - Passo 4: Pagamento

---

### 2.4 Melhorar Loading States 🟢 **BAIXA PRIORIDADE**

**Problema:** Loading states são básicos (só spinner).

**Solução:** Loading states mais informativos.

**O que fazer:**
- [ ] Adicionar skeleton loaders em listas
- [ ] Mostrar mensagem contextual durante loading
- [ ] Loading states em botões (já tem, mas pode melhorar)

---

### 2.5 Melhorar Visualização de Inscrições 🟡 **MÉDIA PRIORIDADE**

**Problema:** Cards de inscrição são básicos, falta informação.

**Solução:** Cards mais informativos e organizados.

**O que melhorar:**
- [ ] Adicionar imagem/banner do evento no card
- [ ] Mostrar mais informações: local, horário, status de pagamento
- [ ] Badges visuais mais informativos
- [ ] Agrupar por status (Confirmadas, Pendentes, Canceladas)
- [ ] Filtros e busca rápida

---

## 3. Funcionalidades Faltantes

### 3.1 Edição de Dados Pessoais 🔴 **ALTA PRIORIDADE**

**Status Atual:** Botão existe mas está desabilitado com texto "Em breve"

**O que implementar:**
- [ ] Modal/página de edição de dados pessoais
- [ ] API endpoint: `PATCH /api/auth/participant/profile`
- [ ] Campos editáveis:
  - ✅ Nome completo
  - ✅ Email
  - ✅ Telefone
  - ✅ Endereço (se tiver)
  - ⚠️ CPF: Não editável (regra de negócio)
  - ⚠️ Data de nascimento: Não editável (regra de negócio)
- [ ] Validações (email único, telefone válido)
- [ ] Confirmação de email se alterar email

**Arquivos a criar/editar:**
- `src/app/api/auth/participant/profile/route.ts` (novo)
- `src/app/minha-conta/page.tsx` (editar - habilitar botão)
- Componente modal de edição (novo)

---

### 3.2 Baixar Comprovante de Inscrição 🔴 **ALTA PRIORIDADE**

**Status Atual:** Botão existe mas está desabilitado

**O que implementar:**
- [ ] Template de comprovante (PDF ou HTML)
- [ ] API endpoint: `GET /api/registrations/[id]/comprovante`
- [ ] Geração de PDF usando `react-pdf` ou `puppeteer` ou `jspdf`
- [ ] Template inclui:
  - Logo da plataforma
  - Dados do evento
  - Dados do participante
  - Modalidade
  - Número da inscrição
  - Valor pago
  - Data da inscrição
  - Código QR para validação (opcional)

**Arquivos a criar/editar:**
- `src/app/api/registrations/[id]/comprovante/route.ts` (novo)
- `src/app/minha-conta/page.tsx` (editar - habilitar botão)
- Template de comprovante (novo)

---

### 3.3 Recuperação de Senha 🟡 **MÉDIA PRIORIDADE**

**Status Atual:** Não existe

**O que implementar:**
- [ ] Página "Esqueci minha senha" (`/login/recuperar`)
- [ ] Link no formulário de login
- [ ] Fluxo:
  1. Usuário insere email
  2. Sistema envia email com token
  3. Usuário acessa link no email
  4. Usuário define nova senha
- [ ] API endpoints:
  - `POST /api/auth/participant/forgot-password` (solicitar reset)
  - `POST /api/auth/participant/reset-password` (resetar com token)
- [ ] Validação de token (expira em 1 hora)
- [ ] Email com template bonito

**Arquivos a criar:**
- `src/app/login/recuperar/page.tsx` (novo)
- `src/app/login/recuperar/confirmar/page.tsx` (novo)
- `src/app/api/auth/participant/forgot-password/route.ts` (novo)
- `src/app/api/auth/participant/reset-password/route.ts` (novo)

---

### 3.4 Página de Detalhes da Inscrição 🟡 **MÉDIA PRIORIDADE**

**Status Atual:** Detalhes mostrados apenas em `/minha-conta`, mas limitados

**O que implementar:**
- [ ] Nova página: `/minha-conta/inscricao/[id]`
- [ ] Detalhes completos:
  - Informações do evento
  - Informações do participante
  - Status de pagamento
  - Histórico de pagamento (se houver múltiplas tentativas)
  - QR Code (se necessário para check-in)
  - Local de retirada de kit (se informado)
  - Ações disponíveis (baixar comprovante, cancelar, etc)

**Arquivos a criar:**
- `src/app/minha-conta/inscricao/[id]/page.tsx` (novo)
- Link nos cards de inscrição para ver detalhes

---

### 3.5 Filtros e Busca nas Inscrições 🟢 **BAIXA PRIORIDADE**

**Status Atual:** Lista todas as inscrições sem filtros

**O que implementar:**
- [ ] Filtros:
  - Por status (Confirmadas, Pendentes, Canceladas)
  - Por período (últimos 30 dias, 3 meses, 6 meses, todos)
  - Por evento (busca por nome)
- [ ] Ordenação:
  - Por data (mais recente primeiro / mais antiga primeiro)
  - Por status
  - Por nome do evento
- [ ] Busca rápida (por nome do evento)

---

## 4. Melhorias de Experiência

### 4.1 Melhorar Feedback de Cupons 🟡 **MÉDIA PRIORIDADE**

**Status Atual:** Campo existe, validação funciona, mas feedback poderia ser melhor

**O que melhorar:**
- [ ] Toast de sucesso quando cupom aplicado
- [ ] Mostrar desconto visualmente (destaque)
- [ ] Mensagem clara quando cupom inválido
- [ ] Mostrar valor economizado

---

### 4.2 Resumo Visual Antes de Finalizar Inscrição 🟡 **MÉDIA PRIORIDADE**

**Status Atual:** Resumo existe mas pode ser mais visual

**O que melhorar:**
- [ ] Card de resumo destacado
- [ ] Mostrar todos os participantes incluídos
- [ ] Mostrar cupom aplicado (se houver)
- [ ] Cálculo detalhado (subtotal, desconto, taxa, total)
- [ ] Botão "Finalizar" grande e destacado

---

### 4.3 Validações Melhores no Formulário de Inscrição 🟡 **MÉDIA PRIORIDADE**

**Status Atual:** Validações funcionam mas mensagens podem melhorar

**O que melhorar:**
- [ ] Validação em tempo real (onBlur)
- [ ] Mensagens mais específicas
- [ ] Sugestões de correção
- [ ] Validação de CPF (já existe no backend, melhorar no frontend)
- [ ] Validação de telefone com máscara

---

### 4.4 Melhorar Visualização de Status 🟢 **BAIXA PRIORIDADE**

**Status Atual:** Status mostrado com badges, mas pode ser mais visual

**O que melhorar:**
- [ ] Ícones por status
- [ ] Cores mais claras
- [ ] Timeline visual do status (se aplicável)
- [ ] Explicação do que significa cada status

---

### 4.5 Adicionar Endereço do Participante 🟢 **BAIXA PRIORIDADE**

**Status Atual:** Schema tem `ParticipantAddress` mas não é usado no cadastro

**O que implementar:**
- [ ] Adicionar campos de endereço no cadastro (opcional)
- [ ] Integração com API de CEP (ViaCEP)
- [ ] Busca automática de endereço por CEP
- [ ] Endereço visível em "Meus Dados"
- [ ] Endereço editável

---

## 5. Plano de Implementação

### Sprint 1: Fundação UX (1 semana) 🔴 **URGENTE**

**Objetivo:** Melhorar feedback geral ao usuário

1. **Sistema de Toast** 🔴
   - [ ] Instalar `react-hot-toast` ou configurar `shadcn/ui toast`
   - [ ] Substituir todos os `alert()` por toast
   - [ ] Substituir mensagens inline críticas por toast
   - [ ] Testar em todas as páginas

2. **Melhorar Mensagens de Erro** 🔴
   - [ ] Criar helper de mensagens amigáveis
   - [ ] Mapear erros técnicos → mensagens amigáveis
   - [ ] Adicionar ícones nas mensagens

**Entregas:**
- Sistema de toast funcionando
- Mensagens de erro melhoradas

---

### Sprint 2: Funcionalidades Críticas (1 semana) 🔴 **URGENTE**

**Objetivo:** Ativar funcionalidades desabilitadas

1. **Edição de Dados Pessoais** 🔴
   - [ ] Criar API endpoint
   - [ ] Criar modal/página de edição
   - [ ] Habilitar botão em "Meus Dados"
   - [ ] Testar validações
   - [ ] Toast de sucesso

2. **Baixar Comprovante** 🔴
   - [ ] Escolher biblioteca de PDF (jspdf ou react-pdf)
   - [ ] Criar template de comprovante
   - [ ] Criar API endpoint
   - [ ] Habilitar botão em inscrições confirmadas
   - [ ] Testar geração

**Entregas:**
- Edição de dados funcionando
- Download de comprovante funcionando

---

### Sprint 3: Melhorias de Experiência (1 semana) 🟡 **IMPORTANTE**

**Objetivo:** Melhorar fluxo de inscrição e visualização

1. **Melhorar Fluxo de Inscrição** 🟡
   - [ ] Adicionar stepper/progresso visual
   - [ ] Melhorar resumo antes de finalizar
   - [ ] Melhorar feedback de cupons

2. **Melhorar Visualização de Inscrições** 🟡
   - [ ] Adicionar imagem do evento nos cards
   - [ ] Reorganizar informações
   - [ ] Agrupar por status (tabs ou sections)

3. **Página de Detalhes da Inscrição** 🟡
   - [ ] Criar página de detalhes
   - [ ] Adicionar link nos cards
   - [ ] Mostrar todas as informações

**Entregas:**
- Fluxo de inscrição melhorado
- Visualização de inscrições melhorada
- Página de detalhes funcionando

---

### Sprint 4: Recuperação de Senha (3-4 dias) 🟡 **IMPORTANTE**

**Objetivo:** Permitir recuperação de senha

1. **Implementar Recuperação** 🟡
   - [ ] Página "Esqueci minha senha"
   - [ ] API de solicitação de reset
   - [ ] API de reset com token
   - [ ] Email de recuperação (template)
   - [ ] Página de nova senha
   - [ ] Validações

**Entregas:**
- Recuperação de senha funcionando

---

### Sprint 5: Melhorias Finais (3-4 dias) 🟢 **DESEJÁVEL**

**Objetivo:** Funcionalidades complementares

1. **Filtros e Busca** 🟢
   - [ ] Filtros por status e período
   - [ ] Busca por nome do evento
   - [ ] Ordenação

2. **Melhorias de Validação** 🟢
   - [ ] Validação em tempo real
   - [ ] Máscaras de input (CPF, telefone)
   - [ ] Validação de CPF no frontend

3. **Loading States Melhorados** 🟢
   - [ ] Skeleton loaders
   - [ ] Mensagens contextuais

**Entregas:**
- Filtros e busca funcionando
- Validações melhoradas

---

## 6. Prioridades

### 🔴 Crítico (Fazer primeiro - 2 semanas)

1. ✅ Sistema de Toast
2. ✅ Edição de Dados Pessoais
3. ✅ Baixar Comprovante
4. ✅ Melhorar Mensagens de Erro

**Impacto:** Resolve problemas básicos de UX e ativa funcionalidades desabilitadas

---

### 🟡 Importante (Fazer depois - 1-2 semanas)

5. ✅ Melhorar Fluxo de Inscrição (stepper, resumo)
6. ✅ Página de Detalhes da Inscrição
7. ✅ Recuperação de Senha
8. ✅ Melhorar Visualização de Inscrições

**Impacto:** Melhora significativa na experiência do usuário

---

### 🟢 Desejável (Fazer quando possível - 1 semana)

9. ⚪ Filtros e Busca nas Inscrições
10. ⚪ Melhorias de Validação (tempo real, máscaras)
11. ⚪ Loading States Melhorados
12. ⚪ Adicionar Endereço (se necessário)

**Impacto:** Funcionalidades complementares que melhoram a experiência

---

## 7. Detalhamento Técnico

### 7.1 Sistema de Toast

**Biblioteca sugerida:** `react-hot-toast` (leve e simples) ou `shadcn/ui toast`

**Instalação:**
```bash
npm install react-hot-toast
# ou
npx shadcn-ui@latest add toast
```

**Implementação:**
```tsx
// Em layout.tsx ou app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

// Uso
import toast from 'react-hot-toast';

toast.success('Inscrição confirmada!');
toast.error('Erro ao processar pagamento');
toast.loading('Processando...');
```

---

### 7.2 Edição de Dados Pessoais

**Estrutura sugerida:**

**API:** `PATCH /api/auth/participant/profile`
```typescript
// Request body
{
  fullName?: string;
  email?: string;
  phone?: string;
  address?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  }
}

// Validações:
// - Email único (se alterar)
// - Telefone válido
// - Se alterar email, enviar confirmação
```

**UI:** Modal usando `shadcn/ui dialog`

---

### 7.3 Baixar Comprovante

**Biblioteca sugerida:** `jspdf` (simples) ou `react-pdf` (mais controle)

**Template sugerido:**
```
┌─────────────────────────────────────┐
│         LOGO OKÊ SPORTS             │
│                                     │
│     COMPROVANTE DE INSCRIÇÃO        │
│                                     │
│  Número: #123456                    │
│  Data: 09/01/2026                   │
│                                     │
│  EVENTO                             │
│  Corrida do Morumbi 2026            │
│  Data: 15/02/2026                   │
│                                     │
│  PARTICIPANTE                       │
│  João da Silva                      │
│  CPF: 123.456.789-00                │
│                                     │
│  MODALIDADE                         │
│  10km                               │
│                                     │
│  VALOR                              │
│  R$ 100,00                          │
│                                     │
│  STATUS: Confirmado                 │
│                                     │
│  [QR CODE]                          │
└─────────────────────────────────────┘
```

---

### 7.4 Recuperação de Senha

**Fluxo:**

1. Usuário acessa `/login/recuperar`
2. Insere email
3. Sistema valida email existe
4. Gera token único (expira em 1h)
5. Envia email com link: `/login/recuperar/confirmar?token=xxx`
6. Usuário acessa link
7. Define nova senha
8. Sistema valida token e atualiza senha

**Schema necessário no banco:**
```prisma
model Participant {
  // ...
  resetPasswordToken String?
  resetPasswordExpires DateTime?
}
```

---

## 8. Checklist de Implementação

### Sprint 1: Fundação UX
- [ ] Instalar sistema de toast
- [ ] Substituir todos os `alert()` por toast
- [ ] Criar helper de mensagens amigáveis
- [ ] Mapear erros técnicos → mensagens amigáveis
- [ ] Testar em todas as páginas

### Sprint 2: Funcionalidades Críticas
- [ ] API de edição de perfil
- [ ] Modal/página de edição
- [ ] Habilitar botão "Editar Dados"
- [ ] Biblioteca de PDF instalada
- [ ] Template de comprovante
- [ ] API de download de comprovante
- [ ] Habilitar botão "Baixar Comprovante"

### Sprint 3: Melhorias de Experiência
- [ ] Stepper no fluxo de inscrição
- [ ] Resumo melhorado antes de finalizar
- [ ] Feedback de cupons melhorado
- [ ] Cards de inscrição melhorados
- [ ] Página de detalhes da inscrição

### Sprint 4: Recuperação
- [ ] Página "Esqueci minha senha"
- [ ] API de solicitação de reset
- [ ] API de reset com token
- [ ] Email de recuperação
- [ ] Página de nova senha

### Sprint 5: Melhorias Finais
- [ ] Filtros nas inscrições
- [ ] Busca nas inscrições
- [ ] Validações em tempo real
- [ ] Máscaras de input
- [ ] Skeleton loaders

---

**Última Atualização:** 09 de Janeiro de 2026
**Versão:** 1.0
