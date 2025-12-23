# 🔗 External Reference - Conciliação Financeira

Este documento explica como o `external_reference` é usado para conciliação financeira com o Mercado Pago.

## 📋 O que é External Reference?

O `external_reference` é um campo **obrigatório** que permite correlacionar o `payment_id` do Mercado Pago com o ID interno do nosso sistema (registrationId).

**Por que é importante:**
- ✅ Permite conciliação financeira automática
- ✅ Facilita rastreamento de pagamentos
- ✅ Necessário para relatórios e auditoria
- ✅ Obrigatório segundo requisitos do Mercado Pago

## 🔧 Como está implementado

### 1. Envio na Criação da Preferência

O `external_reference` é enviado automaticamente quando criamos uma preferência de pagamento:

```typescript
const preferenceData = {
  // ... outros campos
  external_reference: registrationId, // ID único da inscrição (CUID)
  // ... outros campos
};
```

**Valor usado:** `registrationId` (CUID único de cada inscrição)

### 2. Validação

O sistema valida que o `external_reference`:
- ✅ Está presente
- ✅ É uma string válida
- ✅ Não está vazio
- ✅ Corresponde ao `registrationId`

### 3. Verificação na Resposta

Após criar a preferência, verificamos se o Mercado Pago:
- ✅ Aceitou o `external_reference`
- ✅ Retornou o mesmo valor na resposta
- ✅ Loga erros se houver divergência

## 📊 Fluxo Completo

```
1. Usuário cria inscrição
   ↓
2. Sistema gera registrationId (CUID único)
   ↓
3. Cria preferência no MP com external_reference = registrationId
   ↓
4. MP retorna preference_id
   ↓
5. Usuário paga
   ↓
6. MP cria payment_id
   ↓
7. Webhook envia payment_id + external_reference
   ↓
8. Sistema busca inscrição por external_reference
   ↓
9. Atualiza status usando payment_id
```

## 🔍 Como Verificar se está Funcionando

### 1. Verificar nos Logs

Ao criar uma preferência, você deve ver:

```
✅ external_reference confirmado pelo Mercado Pago: {
  external_reference: "cmjimu9go000iy4sgm3xukiqm",
  registrationId: "cmjimu9go000iy4sgm3xukiqm",
  preferenceId: "1234567890-abc-def-ghi",
  status: "OK - Conciliação financeira habilitada"
}
```

### 2. Verificar no Mercado Pago

1. Acesse: Mercado Pago → Atividade → Detalhe da transação
2. Procure pelo campo **"Referência externa"**
3. Deve mostrar o `registrationId` da inscrição

### 3. Verificar no Webhook

Quando o webhook é recebido, o sistema:
1. Busca o pagamento no MP usando `payment_id`
2. Obtém o `external_reference` do pagamento
3. Usa o `external_reference` para encontrar a inscrição

## ⚠️ Problemas Comuns

### Erro: "external_reference inválido"

**Causa:** O campo não está sendo enviado ou está vazio

**Solução:**
- Verificar se `registrationId` está presente
- Verificar logs do servidor
- Verificar se a preferência está sendo criada corretamente

### Erro: "external_reference não corresponde"

**Causa:** O MP retornou um valor diferente do enviado

**Solução:**
- Verificar logs detalhados
- Verificar se há caracteres especiais sendo removidos
- Contatar suporte do Mercado Pago se persistir

### Webhook não encontra inscrição

**Causa:** O `external_reference` não está sendo usado corretamente no webhook

**Solução:**
- Verificar se o webhook está buscando por `external_reference`
- Verificar logs do webhook
- Usar script de sincronização manual se necessário

## 📝 Checklist de Configuração

- [x] `external_reference` sendo enviado na criação da preferência
- [x] Validação antes de enviar ao MP
- [x] Verificação na resposta do MP
- [x] Uso no webhook para encontrar inscrições
- [x] Logs detalhados para debug
- [x] Tratamento de erros

## 🔗 Referências

- [Documentação Mercado Pago - External Reference](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/account)
- [Documentação Mercado Pago - Conciliação](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

## ✅ Status Atual

O sistema está configurado corretamente para enviar o `external_reference` em todas as preferências de pagamento. O campo é:

- ✅ Sempre enviado
- ✅ Validado antes de enviar
- ✅ Verificado na resposta
- ✅ Usado no webhook para encontrar inscrições
- ✅ Logado para auditoria

**Próximos passos:**
1. Verificar no painel do Mercado Pago se a ação pendente foi resolvida
2. Testar uma nova inscrição e verificar se o `external_reference` aparece corretamente
3. Monitorar logs para garantir que está funcionando

