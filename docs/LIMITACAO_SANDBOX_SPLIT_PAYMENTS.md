# Limitação do Sandbox do Mercado Pago com Split Payments

## Problema

Ao tentar fazer pagamentos com `marketplace_fee` (split payments) no ambiente **sandbox/teste** do Mercado Pago, o checkout está falhando com erro fatal durante o "Challenge" (verificação de segurança).

## Sintomas

1. ✅ Preferência criada com sucesso
2. ✅ `marketplace_fee` está presente na preferência
3. ✅ Marketplace configurado corretamente
4. ✅ URL do sandbox sendo usada (`sandbox_init_point`)
5. ❌ Erro fatal ao tentar pagar: `/fatal/` na URL
6. ❌ "Challenge" (verificação de segurança) falha

## Causa

Esta é uma **limitação conhecida do sandbox do Mercado Pago**. O sistema de verificação de segurança ("Challenge") não funciona corretamente com split payments (`marketplace_fee`) em ambiente de teste.

## Solução Temporária para Testes

Para testar o checkout sem split payments no sandbox, adicione no `.env`:

```env
DISABLE_SPLIT_PAYMENTS_TEST=true
```

Isso fará com que:
- ✅ O checkout funcione normalmente no sandbox
- ⚠️ O `marketplace_fee` não será adicionado em ambiente de teste
- ✅ Em produção, o split payments será habilitado automaticamente

## Como Funciona

1. **Em ambiente de TESTE com `DISABLE_SPLIT_PAYMENTS_TEST=true`:**
   - Preferência criada **sem** `marketplace_fee`
   - Checkout funciona normalmente
   - Pagamento é processado, mas sem split

2. **Em ambiente de PRODUÇÃO:**
   - `DISABLE_SPLIT_PAYMENTS_TEST` é ignorado
   - Split payments funciona normalmente
   - `marketplace_fee` é adicionado automaticamente

## Testando Split Payments

Para testar split payments completamente, você tem duas opções:

### Opção 1: Testar em Produção (Recomendado)

1. Configure credenciais de produção no `.env`
2. Conecte uma conta Mercado Pago real via OAuth
3. Crie uma preferência com valor baixo (ex: R$ 1,00)
4. Teste o pagamento

### Opção 2: Aguardar Correção do Mercado Pago

O Mercado Pago pode corrigir essa limitação no futuro. Monitore a documentação oficial.

## Referências

- [Documentação do Mercado Pago - Marketplace](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/marketplace)
- [Documentação do Mercado Pago - Split Payments](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/marketplace/split-payments)
- [Suporte do Mercado Pago](https://www.mercadopago.com.br/developers/pt/support)

## Status Atual

- ✅ Sistema configurado corretamente
- ✅ Split payments funcionando na API (preferência criada com sucesso)
- ❌ Checkout falhando no sandbox devido a limitação do Mercado Pago
- ✅ Solução temporária disponível (`DISABLE_SPLIT_PAYMENTS_TEST=true`)

