# Como Sincronizar Status de Pagamento Pendente

Se um pagamento foi aprovado no Mercado Pago mas o status ainda está como `PENDING` no sistema, você pode sincronizar manualmente.

## Método 1: Script Direto (Recomendado)

O script acessa diretamente o banco de dados e a API do Mercado Pago, sem precisar de autenticação.

### Pré-requisitos

1. Ter o `.env` configurado com:
   - `DATABASE_URL`
   - `ENCRYPTION_KEY`
   - `MP_TEST_ACCESS_TOKEN` ou `MP_TEST_SELLER_TOKEN` (para buscar payment)

### Como usar

```bash
node scripts/sync-payment-direct.js <registrationId>
```

### Exemplo

```bash
node scripts/sync-payment-direct.js cmjh9g9nd000cy4sggon4gxa8
```

### O que o script faz

1. ✅ Busca a inscrição no banco de dados
2. ✅ Busca o payment no Mercado Pago (por `paymentId` ou `external_reference`)
3. ✅ Verifica o status do pagamento no MP
4. ✅ Atualiza o status no banco se necessário:
   - `approved` → `CONFIRMED` + `APPROVED`
   - `rejected` → `CANCELLED` + `REJECTED`
   - `cancelled` → `CANCELLED` + `CANCELLED`

## Método 2: Via API (Requer Autenticação)

Se preferir usar a API, você precisa estar autenticado:

```bash
curl -X POST "http://localhost:3000/api/payments/sync-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_ACCESS_TOKEN>" \
  -d '{"registrationId": "cmjh9g9nd000cy4sggon4gxa8"}'
```

## Como encontrar o Registration ID

1. **No banco de dados:**
   ```sql
   SELECT id, "registrationNumber", status, "paymentStatus", "paymentId"
   FROM registrations
   WHERE status = 'PENDING'
   ORDER BY "createdAt" DESC;
   ```

2. **Na interface do organizador:**
   - Vá para o evento
   - Aba "Inscritos"
   - Veja o número da inscrição e o ID

3. **No Mercado Pago:**
   - Acesse a transação
   - Veja o campo "Referência externa" (external_reference)
   - Esse é o `registrationId`

## Troubleshooting

### Erro: "ENCRYPTION_KEY não configurada"
- Verifique se o `.env` tem a variável `ENCRYPTION_KEY`
- A chave deve ter 64 caracteres hexadecimais

### Erro: "Inscrição não encontrada"
- Verifique se o `registrationId` está correto
- Confirme que a inscrição existe no banco

### Erro: "Payment ID não encontrado"
- O pagamento pode não ter sido criado ainda
- Verifique se o `external_reference` está sendo enviado corretamente na preferência

### Erro: "Decryption failed"
- O token pode ter sido encriptado com uma `ENCRYPTION_KEY` diferente
- Reconecte a conta Mercado Pago via OAuth

## Verificar se funcionou

Após executar o script, verifique:

```sql
SELECT id, status, "paymentStatus", "paymentId", "confirmedAt"
FROM registrations
WHERE id = 'cmjh9g9nd000cy4sggon4gxa8';
```

O status deve estar como `CONFIRMED` e `paymentStatus` como `APPROVED`.

