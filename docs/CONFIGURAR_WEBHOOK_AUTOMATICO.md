# Como Configurar Webhook Automático do Mercado Pago

Para que o webhook funcione automaticamente e atualize o status dos pagamentos, você precisa configurar:

## 1. Variáveis de Ambiente

### Obrigatórias:

```env
# URL do webhook (deve ser acessível publicamente)
MP_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/mercadopago

# OU use NEXT_PUBLIC_APP_URL (será usado automaticamente)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Secret do webhook (obtido no painel do Mercado Pago)
MP_WEBHOOK_SECRET=seu_secret_aqui
```

### Como obter o MP_WEBHOOK_SECRET:

1. Acesse o [Painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Webhooks** ou **Notificações IPN**
3. Configure a URL do webhook: `https://seu-dominio.com/api/webhooks/mercadopago`
4. Copie o **Secret** gerado
5. Cole no `.env` como `MP_WEBHOOK_SECRET`

## 2. Configurar Webhook no Painel do Mercado Pago

### Passo a passo:

1. **Acesse o painel:**
   - https://www.mercadopago.com.br/developers/panel
   - Faça login com a conta da aplicação (Integrador)

2. **Vá em Webhooks:**
   - Menu lateral → **Webhooks** ou **Notificações IPN**

3. **Adicione a URL:**
   ```
   https://seu-dominio.com/api/webhooks/mercadopago
   ```
   ⚠️ **IMPORTANTE:** A URL deve ser **HTTPS** e acessível publicamente

4. **Selecione os eventos:**
   - ✅ `payment` (obrigatório)
   - Outros eventos conforme necessário

5. **Salve e copie o Secret:**
   - O Mercado Pago gerará um `secret`
   - Adicione no `.env` como `MP_WEBHOOK_SECRET`

## 3. Verificar se está funcionando

### Logs do servidor:

Quando um pagamento for processado, você verá nos logs:

```
📥 Webhook MP recebido: {
  type: 'payment',
  action: 'payment.updated',
  paymentId: '139040854508',
  timestamp: '2025-12-22T...'
}
✅ Inscrição encontrada pelo external_reference: cmjhel0wo000fy4sgtkvoooho
✅ paymentId salvo na inscrição: cmjhel0wo000fy4sgtkvoooho
✅ Status atualizado para CONFIRMED
```

### Verificar no banco:

```sql
SELECT id, status, "paymentStatus", "paymentId", "confirmedAt"
FROM registrations
WHERE status = 'PENDING';
```

Após o webhook processar, o status deve mudar para `CONFIRMED`.

## 4. Troubleshooting

### Problema: Webhook não está sendo chamado

**Causas possíveis:**
- URL não está acessível publicamente (localhost não funciona)
- URL não está configurada no painel do MP
- Firewall bloqueando requisições do MP

**Solução:**
- Use um serviço como ngrok para testar localmente:
  ```bash
  ngrok http 3000
  # Use a URL do ngrok no MP_WEBHOOK_URL
  ```
- Em produção, certifique-se que a URL está acessível via HTTPS

### Problema: "Assinatura inválida"

**Causas possíveis:**
- `MP_WEBHOOK_SECRET` incorreto
- `MP_WEBHOOK_URL` diferente da configurada no painel
- URL tem trailing slash ou diferença de protocolo (http vs https)

**Solução:**
- Verifique se o `MP_WEBHOOK_SECRET` está correto
- Certifique-se que `MP_WEBHOOK_URL` corresponde exatamente à URL configurada no painel
- Em desenvolvimento, o webhook funciona sem validação se `MP_WEBHOOK_SECRET` não estiver configurado

### Problema: "Inscrição não encontrada"

**Causas possíveis:**
- `external_reference` não foi enviado na preferência
- `external_reference` não corresponde ao `registrationId`
- Inscrição foi deletada

**Solução:**
- Verifique se `external_reference: registrationId` está sendo enviado na preferência
- Verifique os logs do `create-preference` para confirmar
- Use o script de sincronização manual se necessário

### Problema: Webhook recebido mas status não atualiza

**Causas possíveis:**
- Erro ao descriptografar token OAuth
- Erro ao buscar payment no MP
- Erro ao atualizar no banco

**Solução:**
- Verifique os logs do servidor para ver o erro específico
- Certifique-se que `ENCRYPTION_KEY` está correto
- Verifique se o organizador tem token OAuth configurado

## 5. Testar Webhook Manualmente

Você pode testar o webhook usando curl:

```bash
curl -X POST https://seu-dominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=signature_here" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "139040854508"
    }
  }'
```

⚠️ **Nota:** Em produção, você precisa do `x-signature` correto do Mercado Pago.

## 6. Checklist Final

- [ ] `MP_WEBHOOK_URL` configurado no `.env`
- [ ] `MP_WEBHOOK_SECRET` configurado no `.env`
- [ ] URL do webhook configurada no painel do Mercado Pago
- [ ] URL é HTTPS e acessível publicamente
- [ ] `external_reference` está sendo enviado na preferência
- [ ] Logs do servidor mostram webhooks sendo recebidos
- [ ] Status das inscrições está sendo atualizado

## 7. Monitoramento

Para monitorar se os webhooks estão funcionando:

1. **Logs do servidor:** Verifique se aparecem logs de webhooks recebidos
2. **Banco de dados:** Verifique se `paymentId` está sendo salvo
3. **Painel do MP:** Veja o histórico de notificações enviadas
4. **Tabela `processed_webhooks`:** Verifica idempotência

Se tudo estiver configurado corretamente, o webhook funcionará automaticamente! 🎉

