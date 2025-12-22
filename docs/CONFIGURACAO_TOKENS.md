# 🔑 Configuração de Tokens - Mercado Pago

## 📋 Resumo Rápido

**Sua configuração atual está CORRETA! ✅**

- **Maria (organizador)**: Conectada via OAuth com **conta3 (Vendedor)** ✅
- **Aplicação Okê**: Usa credenciais da **conta1 (Integrador)** ✅
- **Split payments**: Funcionam porque o organizador usa token da conta3 ✅

## 🎯 Como Funciona o Split Payment

### Arquitetura de Contas

```
┌─────────────────────────────────────────────────────────┐
│                    MERCADO PAGO                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  Conta1      │      │  Conta3      │                │
│  │ (Integrador) │      │ (Vendedor)   │                │
│  │              │      │              │                │
│  │ Aplicação    │◄────►│ Organizador  │                │
│  │ Okê Sports   │ OAuth │ (Maria)      │                │
│  │              │      │              │                │
│  └──────────────┘      └──────────────┘                │
│         │                      │                         │
│         │                      │                         │
│         └──────────┬───────────┘                         │
│                    │                                     │
│              Split Payment                                │
│         (marketplace_fee)                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Tokens

1. **Aplicação Okê (conta1 - Integrador)**
   - Usa: `MP_CLIENT_ID` e `MP_CLIENT_SECRET` (credenciais da aplicação)
   - Propósito: Autenticação OAuth, webhooks, operações gerais
   - **NÃO** usado para criar preferências de pagamento

2. **Organizador (conta3 - Vendedor)**
   - Usa: Token OAuth obtido quando o organizador conecta a conta
   - Propósito: Criar preferências de pagamento com split
   - **Este é o token usado para pagamentos** ✅

## ✅ Sua Configuração Atual

### O que está correto:

1. **Maria conectou via OAuth com conta3** ✅
   - Token da conta3 está salvo no banco de dados
   - Sistema usa esse token automaticamente (Prioridade 1)
   - Split payments funcionam corretamente

2. **Aplicação usa credenciais da conta1** ✅
   - Configurado nas variáveis de ambiente padrão
   - Usado para OAuth e outras operações

### Tokens no `.env` (Opcionais)

Os tokens no `.env` são apenas **fallbacks** para desenvolvimento:

```env
# ❌ NÃO NECESSÁRIO se organizador já tem OAuth configurado
# MP_TEST_ACCESS_TOKEN="TEST-..."  # Token da conta1 (Integrador)
#                                 # NÃO suporta split payments

# ✅ Útil apenas se organizador NÃO tem OAuth configurado
# MP_TEST_SELLER_TOKEN="TEST-..."  # Token da conta3 (Vendedor)
#                                  # Suporta split payments
```

## 🎯 Prioridade de Tokens (Código)

O sistema usa tokens nesta ordem:

1. **Prioridade 1: Token OAuth do organizador** (seu caso atual) ✅
   - Vem do banco de dados (salvo quando Maria conectou)
   - Token da conta3 (Vendedor)
   - **Suporta split payments** ✅
   - **Este é o que está sendo usado agora**

2. **Prioridade 2: `MP_TEST_SELLER_TOKEN`** (fallback)
   - Token da conta3 via variável de ambiente
   - Útil para testes rápidos sem OAuth
   - **Suporta split payments** ✅

3. **Prioridade 3: `MP_TEST_ACCESS_TOKEN`** (último recurso)
   - Token da conta1 (Integrador)
   - **NÃO suporta split payments** ❌
   - Usado apenas se nenhum outro token estiver disponível

## ❓ Quando Usar Cada Token?

### Cenário 1: Organizador com OAuth (Seu Caso) ✅

**Configuração:**
- Maria conectou via OAuth com conta3
- Token salvo no banco de dados

**Tokens no `.env`:**
- ❌ **NÃO precisa** de `MP_TEST_ACCESS_TOKEN`
- ❌ **NÃO precisa** de `MP_TEST_SELLER_TOKEN`
- ✅ Sistema usa automaticamente o token OAuth do banco

**Resultado:**
- ✅ Split payments funcionam
- ✅ `marketplace_fee` é adicionado
- ✅ Tudo funciona corretamente

### Cenário 2: Teste Rápido sem OAuth

**Configuração:**
- Organizador ainda não conectou via OAuth
- Quer testar rapidamente

**Tokens no `.env`:**
```env
MP_TEST_SELLER_TOKEN="TEST-token-da-conta3"
```

**Resultado:**
- ✅ Split payments funcionam
- ✅ `marketplace_fee` é adicionado
- ⚠️ Apenas para testes rápidos

### Cenário 3: Teste Básico (sem split)

**Configuração:**
- Apenas quer testar pagamento básico
- Não precisa de split payments

**Tokens no `.env`:**
```env
MP_TEST_ACCESS_TOKEN="TEST-token-da-conta1"
```

**Resultado:**
- ❌ Split payments **NÃO** funcionam
- ❌ `marketplace_fee` **NÃO** é adicionado
- ✅ Pagamento básico funciona

## 🔍 Como Verificar Qual Token Está Sendo Usado

Olhe os logs do servidor ao criar uma preferência:

```
✅ Usando token do organizador (OAuth) - Split payments habilitado
🔑 Token prefix: TEST-26428...
```

Se aparecer isso, está usando o token OAuth da Maria (conta3) ✅

## ⚠️ Erro: "Uma das partes é de teste"

Se você está recebendo esse erro mesmo usando contas de teste, o problema é:

**Mistura de ambientes (teste + produção)**

O Mercado Pago valida se TODAS as partes são do mesmo ambiente:
- ❌ Aplicação de PRODUÇÃO + Token de TESTE = Erro
- ❌ Aplicação de TESTE + Token de PRODUÇÃO = Erro
- ✅ Aplicação de TESTE + Token de TESTE = OK
- ✅ Aplicação de PRODUÇÃO + Token de PRODUÇÃO = OK

### Como verificar:

1. **Verifique `MP_CLIENT_ID` e `MP_CLIENT_SECRET`**:
   - Devem ser de **TESTE** (sandbox) se você está testando
   - Devem conter "TEST" ou ser do ambiente sandbox

2. **Verifique o token do organizador**:
   - Deve começar com `TEST-` se for de teste
   - Logs mostrarão: `🧪 Token de teste detectado` ou `🏭 Token de PRODUÇÃO detectado`

3. **Verifique os logs ao criar preferência**:
   - Se aparecer: `⚠️ MP_CLIENT_ID parece ser de PRODUÇÃO` → Problema nas credenciais da aplicação
   - Se aparecer: `🏭 Token de PRODUÇÃO detectado` → Problema no token OAuth

### Solução:

**Para testes, TUDO precisa ser de teste:**
1. Criar aplicação no modo **SANDBOX** no Mercado Pago
2. Usar `MP_CLIENT_ID` e `MP_CLIENT_SECRET` de teste
3. Organizador conectar com conta de teste (conta3)
4. Token gerado será de teste

Veja mais detalhes em: `docs/ERRO_CONTA_TESTE.md`

## 📝 Resumo Final

### ✅ O que você tem agora (CORRETO):

1. **Maria conectou via OAuth com conta3** → Token salvo no banco
2. **Sistema usa esse token automaticamente** → Split payments funcionam
3. **Não precisa de tokens no `.env`** → Tudo funciona

**MAS**: Se estiver dando erro "Uma das partes é de teste", verifique se:
- `MP_CLIENT_ID` e `MP_CLIENT_SECRET` são de TESTE
- Token do organizador é de TESTE (começa com `TEST-`)

### ❌ O que NÃO precisa fazer:

1. ❌ Adicionar `MP_TEST_ACCESS_TOKEN` (conta1) no `.env`
   - Isso causaria erro "Uma das partes é de teste"
   - Não suporta split payments

2. ❌ Mudar a conta OAuth da Maria
   - Está correto com conta3 (Vendedor)
   - É exatamente o que precisa para split payments

### ✅ O que pode fazer (opcional):

1. ✅ Adicionar `MP_TEST_SELLER_TOKEN` no `.env` apenas como fallback
   - Útil se o token OAuth expirar
   - Mas não é necessário se OAuth está funcionando

## 🎯 Conclusão

**Sua configuração está perfeita!** ✅

- Maria (conta3) conectada via OAuth ✅
- Sistema usando token correto ✅
- Split payments funcionando ✅

**MAS se estiver dando erro**, verifique se as credenciais da aplicação (`MP_CLIENT_ID`/`MP_CLIENT_SECRET`) também são de teste!

