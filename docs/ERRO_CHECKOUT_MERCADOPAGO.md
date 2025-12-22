# Erro no Checkout do Mercado Pago

## Problema

A preferência é criada com sucesso, mas ao tentar fazer o pagamento no checkout do Mercado Pago, aparece um erro genérico: "Ops, ocorreu um erro."

## Possíveis Causas

### 1. **Problema com Split Payments em Ambiente de Teste**

O Mercado Pago pode ter limitações com split payments (`marketplace_fee`) em ambiente de teste/sandbox.

**Sintomas:**
- Preferência criada com sucesso
- `marketplace_fee` está presente na preferência
- Erro genérico ao tentar pagar

**Solução:**
- Verificar se a aplicação está configurada como **Marketplace** no painel do Mercado Pago
- Verificar se o token do organizador (OAuth) tem permissões de marketplace
- Tentar criar uma preferência **sem** `marketplace_fee` para testar se o problema é específico do split

### 2. **Conta de Teste sem Saldo ou Configuração**

O erro pode ocorrer se:
- A conta de teste não tem saldo suficiente
- A conta não está completamente configurada
- Falta alguma informação obrigatória na conta

**Solução:**
- Verificar se a conta de teste (conta3 - Vendedor) está completamente configurada
- Adicionar saldo de teste na conta (se necessário)
- Verificar se todos os dados da conta estão preenchidos

### 3. **Método de Pagamento Não Suportado**

O erro pode ocorrer se o método de pagamento selecionado (`account_money`, cartão, etc.) não está disponível ou não suporta split payments.

**Sintomas nos logs:**
```
payment_method_id: "account_money_black"
payment_method_type: "account_money"
```

**Solução:**
- Tentar usar outro método de pagamento (cartão de crédito de teste)
- Verificar se `account_money` suporta split payments em ambiente de teste

### 4. **Configuração da Preferência**

A preferência pode estar faltando alguma configuração necessária para split payments.

**Verificar:**
- Se `marketplace_fee` está sendo enviado corretamente
- Se o `unit_price` está correto (deve ser o valor total que o comprador paga)
- Se as URLs de callback estão corretas

## Como Diagnosticar

### 1. Verificar Logs do Servidor

Após criar uma nova preferência, verificar os logs:

```bash
# Procurar por:
✅ Preferência criada com sucesso!
📋 Detalhes da preferência:
⚠️ Avisos do Mercado Pago:
```

### 2. Verificar Resposta do Mercado Pago

Os logs agora mostram:
- `marketplace`: Se o marketplace está configurado
- `operation_type`: Tipo de operação
- `warnings`: Avisos do Mercado Pago
- Resposta completa (em desenvolvimento)

### 3. Testar sem Split Payments

Para isolar o problema, criar uma preferência **sem** `marketplace_fee`:

1. Comentar a linha que adiciona `marketplace_fee` temporariamente
2. Criar uma nova inscrição
3. Tentar pagar
4. Se funcionar, o problema é específico do split payments

### 4. Verificar no Painel do Mercado Pago

1. Acessar: https://www.mercadopago.com.br/developers/panel/app
2. Verificar se a aplicação está configurada como **Marketplace**
3. Verificar se o organizador (conta3) está conectado corretamente
4. Verificar se há avisos ou pendências na conta

## Soluções Recomendadas

### Solução 1: Verificar Configuração do Marketplace

1. Acessar o painel do Mercado Pago
2. Ir em "Aplicações" > Sua aplicação
3. Verificar se está marcado como "Marketplace"
4. Se não estiver, ativar a opção de Marketplace

### Solução 2: Testar com Cartão de Crédito de Teste

Em vez de usar `account_money`, tentar com cartão de crédito de teste:

**Cartões de teste do Mercado Pago:**
- **Aprovado:** 5031 4332 1540 6351 (CVV: 123)
- **Recusado:** 5031 4332 1540 6351 (CVV: 123)

### Solução 3: Verificar Token do Organizador

Verificar se o token OAuth do organizador tem as permissões corretas:

1. Desconectar a conta Mercado Pago da Maria
2. Reconectar usando a conta3 de teste
3. Verificar se o token foi descriptografado corretamente nos logs
4. Tentar criar uma nova preferência

### Solução 4: Contatar Suporte do Mercado Pago

Se nenhuma das soluções acima funcionar:

1. Coletar os logs completos do servidor
2. Coletar o `preference_id` que falhou
3. Coletar o `checkout_flow_id` do erro
4. Entrar em contato com o suporte do Mercado Pago

## Logs Úteis para Diagnóstico

Quando reportar o problema, incluir:

1. **Logs do servidor ao criar a preferência:**
   - `✅ Preferência criada com sucesso!`
   - `📋 Detalhes da preferência:`
   - `📄 Resposta completa do MP:`

2. **URL do erro:**
   - URL completa com `preference-id` e `checkout_flow_id`

3. **Logs do console do navegador:**
   - Mensagens de erro do Mercado Pago
   - `payment_method_id` e `payment_method_type`

4. **Informações da conta:**
   - Qual conta está sendo usada (conta3 - Vendedor)
   - Se está em modo sandbox/teste
   - Se a aplicação está configurada como Marketplace

## Referências

- [Documentação do Mercado Pago - Marketplace](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/marketplace)
- [Documentação do Mercado Pago - Split Payments](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/marketplace/split-payments)
- [Suporte do Mercado Pago](https://www.mercadopago.com.br/developers/pt/support)

