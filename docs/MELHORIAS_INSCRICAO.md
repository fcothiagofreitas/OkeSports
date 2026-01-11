# 🛒 Melhorias da Página de Inscrição - Carrinho de Compras

## 🔴 Erros Comuns e Correções

### 1. Erro de Validação (ZodError)
**Problema:** Quando `result.details` é um array de issues do Zod, o erro não é formatado corretamente.

**Correção aplicada:**
```typescript
// Antes
const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error;

// Depois
if (result.details) {
  if (Array.isArray(result.details)) {
    const detailsMsg = result.details
      .map((issue: any) => `${issue.path?.join('.') || 'campo'}: ${issue.message}`)
      .join(', ');
    errorMsg = `${errorMsg}: ${detailsMsg}`;
  } else if (typeof result.details === 'string') {
    errorMsg = `${errorMsg}: ${result.details}`;
  }
}
```

### 2. Variáveis CSS Antigas
**Problema:** Página usa `--gray-100`, `--accent-pink`, `--dark` que não existem mais.

**Correção necessária:**
- `bg-[hsl(var(--gray-100))]` → `bg-neutral-off-white`
- `text-[hsl(var(--gray-600))]` → `text-neutral-gray`
- `text-[hsl(var(--dark))]` → `text-neutral-charcoal`
- `text-[hsl(var(--accent-pink))]` → `text-primary` ou `text-accent-primary`
- `border-[hsl(var(--gray-200))]` → `border-neutral-light-gray`

## 🎯 Sugestões de Melhorias - Carrinho de Compras

### 1. **Estrutura de Carrinho**
```
┌─────────────────────────────────────┐
│  Resumo do Evento                   │
│  - Nome, Data, Modalidade           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🛒 Carrinho de Inscrições          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 👤 Participante 1 (Você)      │ │
│  │    Nome, CPF, Email           │ │
│  │    [Editar] [Remover]         │ │
│  └───────────────────────────────┘ │
│                                     │
│  [+ Adicionar Outra Pessoa]         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 👤 Participante 2             │ │
│  │    Nome, CPF, Email           │ │
│  │    [Editar] [Remover]         │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💰 Resumo Financeiro               │
│  - Subtotal: R$ X,XX                │
│  - Taxa (10%): R$ X,XX              │
│  - Total: R$ X,XX                   │
│                                     │
│  [Cupom de Desconto]                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📝 Informações Adicionais          │
│  - Tamanho camiseta (se kit)         │
│  - Contato emergência               │
│  - Informações médicas              │
│  - Nome da equipe                   │
└─────────────────────────────────────┘

[✓ Aceitar termos] [✓ Política privacidade]

[Finalizar Inscrição →]
```

### 2. **Funcionalidades do Carrinho**

#### Adicionar Participante
- Botão "+ Adicionar Outra Pessoa"
- Modal/Formulário para cadastrar terceiro:
  - Nome completo
  - CPF
  - Email
  - Telefone
  - Data de nascimento
  - Gênero (opcional)
- Validação em tempo real
- Verificar se CPF já está cadastrado (sugerir login)

#### Editar Participante
- Ícone de editar em cada card
- Abrir modal com dados preenchidos
- Salvar alterações

#### Remover Participante
- Ícone de remover (X)
- Confirmar antes de remover
- Não permitir remover se for o único

#### Limites
- Respeitar `event.allowGroupReg` (se false, só 1 participante)
- Respeitar `event.maxGroupSize` (máximo de participantes)
- Verificar vagas disponíveis na modalidade

### 3. **Melhorias de UX**

#### Visual
- Cards para cada participante no carrinho
- Badge com número de participantes
- Contador de vagas disponíveis
- Indicador visual de limite atingido

#### Feedback
- Loading states ao adicionar/remover
- Validação em tempo real
- Mensagens de erro claras
- Confirmação de ações

#### Responsividade
- Mobile-first
- Cards empilhados no mobile
- Botões de ação sempre visíveis

### 4. **Fluxo de Dados**

#### Estado do Carrinho
```typescript
interface CartItem {
  id: string; // UUID temporário
  participant: {
    fullName: string;
    cpf: string;
    email: string;
    phone: string;
    birthDate: string;
    gender?: string;
  };
  modalityId: string;
  shirtSize?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  teamName?: string;
}

interface CartState {
  items: CartItem[];
  couponCode?: string;
  pricing: {
    basePrice: number;
    subtotal: number;
    platformFee: number;
    total: number;
  };
}
```

#### API
- Usar `/api/checkout` que já suporta múltiplos participantes
- Ou adaptar `/api/registrations/create` para aceitar array

### 5. **Implementação Sugerida**

#### Componentes
1. `CartItem.tsx` - Card de participante no carrinho
2. `AddParticipantModal.tsx` - Modal para adicionar/editar
3. `CartSummary.tsx` - Resumo financeiro
4. `CouponInput.tsx` - Input de cupom com validação
5. `ParticipantForm.tsx` - Formulário reutilizável

#### Hooks
1. `useCart.ts` - Gerenciar estado do carrinho
2. `usePricing.ts` - Calcular preços dinamicamente
3. `useParticipantValidation.ts` - Validar CPF, email, etc.

### 6. **Prioridades**

**Fase 1 - Correções (URGENTE)**
- [x] Corrigir tratamento de erro ZodError
- [ ] Corrigir classes CSS antigas
- [ ] Testar fluxo completo de inscrição

**Fase 2 - Carrinho Básico**
- [ ] Adicionar estado de carrinho
- [ ] Componente CartItem
- [ ] Adicionar/remover participantes
- [ ] Calcular total dinamicamente

**Fase 3 - Funcionalidades Avançadas**
- [ ] Modal para adicionar terceiros
- [ ] Validação de CPF/Email
- [ ] Verificar limites (maxGroupSize, vagas)
- [ ] Integração com API de checkout

**Fase 4 - Polimento**
- [ ] Animações suaves
- [ ] Loading states
- [ ] Mensagens de feedback
- [ ] Testes de usabilidade

## 📋 Checklist de Implementação

- [ ] Criar hook `useCart` para gerenciar estado
- [ ] Criar componente `CartItem`
- [ ] Criar modal `AddParticipantModal`
- [ ] Atualizar página para usar carrinho
- [ ] Integrar com `/api/checkout`
- [ ] Adicionar validações
- [ ] Testar fluxo completo
- [ ] Corrigir CSS para novo design system
