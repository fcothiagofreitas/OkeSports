# 🚨 Erro: "Uma das partes é de teste"

## ❌ Problema

Você está recebendo o erro:
> "Uma das partes com as quais você está tentando efetuar o pagamento é de teste"

Mesmo usando apenas contas de teste.

## 🔍 Causa Raiz

O Mercado Pago valida se **TODAS as partes** envolvidas no split payment são do mesmo ambiente (teste ou produção):

1. **Aplicação (Integrador)** - Identificada por `MP_CLIENT_ID` e `MP_CLIENT_SECRET`
2. **Organizador (Vendedor)** - Identificado pelo token OAuth usado
3. **Comprador** - Identificado quando faz o pagamento

**O erro acontece quando há MISTURA:**
- ❌ Aplicação de PRODUÇÃO + Token de TESTE
- ❌ Aplicação de TESTE + Token de PRODUÇÃO

## ✅ Solução: Tudo em Teste

Para testar split payments, **TUDO** precisa ser de teste:

### 1. Criar Aplicação de TESTE no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. **IMPORTANTE**: Certifique-se de estar no modo **SANDBOX/TESTE**
3. Crie uma nova aplicação do tipo **Marketplace**
4. Obtenha as credenciais de **TESTE**:
   - `MP_CLIENT_ID` (deve ser de teste)
   - `MP_CLIENT_SECRET` (deve ser de teste)

### 2. Verificar Credenciais no `.env`

```env
# ✅ CORRETO - Credenciais de TESTE
MP_CLIENT_ID="123456789-TEST-..."  # Note o "TEST" no ID
MP_CLIENT_SECRET="TEST-..."        # Note o "TEST" no início

# ❌ ERRADO - Credenciais de PRODUÇÃO
MP_CLIENT_ID="123456789-..."       # Sem "TEST"
MP_CLIENT_SECRET="APP_USR-..."    # Sem "TEST"
```

### 3. Verificar Token do Organizador

O token OAuth do organizador também precisa ser de teste:

```bash
# Token de TESTE (correto)
TEST-26428...

# Token de PRODUÇÃO (errado para testes)
APP_USR-...
```

### 4. Verificar Conta do Comprador

Ao fazer o pagamento de teste, use:
- **Conta2 (Comprador de teste)**: `TESTUSER3269...` / `1bZss4gGAD`
- Ou cartões de teste do Mercado Pago

## 🔍 Como Verificar Qual Tipo Está Sendo Usado

### Verificar Logs do Servidor

Ao criar uma preferência, você verá logs como:

```
✅ Usando token do organizador (OAuth) - Split payments habilitado
🔑 Token prefix: TEST-26428...
🧪 Token de teste detectado (conta Vendedor)
```

Se aparecer:
```
⚠️ ATENÇÃO: MP_CLIENT_ID parece ser de PRODUÇÃO
```

Significa que suas credenciais da aplicação são de produção, mas o token do organizador é de teste → **Causa o erro!**

## ✅ Checklist de Configuração Correta

- [ ] Aplicação criada no modo **SANDBOX/TESTE** no Mercado Pago
- [ ] `MP_CLIENT_ID` contém "TEST" ou é de sandbox
- [ ] `MP_CLIENT_SECRET` contém "TEST" ou é de sandbox
- [ ] Organizador conectou via OAuth usando **conta3 de teste** (TESTUSER4742...)
- [ ] Token do organizador começa com `TEST-`
- [ ] Comprador usa **conta2 de teste** ou cartão de teste

## 🎯 Solução Rápida

### Opção 1: Usar Tudo de Teste (Recomendado para Desenvolvimento)

1. **Criar nova aplicação de TESTE**:
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Certifique-se de estar em **SANDBOX**
   - Crie aplicação Marketplace
   - Copie `CLIENT_ID` e `CLIENT_SECRET` de teste

2. **Atualizar `.env`**:
   ```env
   MP_CLIENT_ID="seu-client-id-de-teste"
   MP_CLIENT_SECRET="seu-client-secret-de-teste"
   ```

3. **Reconectar organizador**:
   - Maria precisa desconectar e reconectar via OAuth
   - Usar conta3 de teste (TESTUSER4742...)
   - Isso gerará um novo token de teste

4. **Reiniciar servidor**:
   ```bash
   npm run dev
   ```

### Opção 2: Usar Tudo de Produção (Para Testes Finais)

1. **Criar aplicação de PRODUÇÃO**
2. **Organizador conectar com conta real de produção**
3. **Testar com valores reais** (cuidado!)

## 📝 Notas Importantes

1. **Não misture ambientes**: Tudo deve ser teste OU tudo produção
2. **Sandbox tem limitações**: Alguns recursos podem não funcionar 100% em teste
3. **Tokens expiram**: Tokens de teste também expiram, pode precisar reconectar

## 🔍 Debug

Se ainda estiver dando erro, verifique os logs:

```bash
# Procurar por:
grep "Token prefix" logs
grep "MP_CLIENT_ID" logs
grep "teste detectado" logs
```

Se aparecer "Token de PRODUÇÃO" mas você esperava teste, o problema está no token OAuth do organizador.

Se aparecer "MP_CLIENT_ID parece ser de PRODUÇÃO", o problema está nas credenciais da aplicação.

