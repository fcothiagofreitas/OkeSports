# Por que o PIX não aparece no checkout?

## Causas Comuns

### 1. **Chave PIX não cadastrada na conta do organizador** ⚠️ (Mais comum)

O PIX só aparece se a conta do organizador (conectada via OAuth) tiver uma **chave PIX cadastrada**.

**Como verificar:**
1. Acesse a conta do organizador no Mercado Pago/Mercado Livre
2. Vá em **Configurações** → **Chaves Pix**
3. Verifique se há uma chave cadastrada

**Como cadastrar:**
1. Acesse: https://www.mercadopago.com.br/settings/account/pix
2. Cadastre uma chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
3. Após cadastrar, o PIX aparecerá automaticamente no checkout

### 2. **Conta em modo de teste (Sandbox)**

Em ambiente de teste, o PIX pode ter limitações ou não estar disponível.

**Solução:**
- Use a conta de produção (conectada via OAuth com token de produção)
- O PIX funciona normalmente em produção

### 3. **Valor muito baixo**

Embora raro, valores muito baixos (menos de R$ 1,00) podem não mostrar PIX em alguns casos.

**Solução:**
- Teste com um valor maior (ex: R$ 10,00)

### 4. **Configuração da aplicação**

A aplicação precisa estar configurada corretamente como Marketplace.

**Verificar:**
- No painel do Mercado Pago, confirme que a aplicação está como "Marketplace"
- Modelo de integração: "Marketplace"

## O que já está configurado no código ✅

- ✅ `payment_methods` configurado sem exclusões
- ✅ Nenhum método de pagamento está sendo bloqueado
- ✅ PIX deve aparecer se a conta tiver chave cadastrada

## Solução Rápida

1. **Cadastre uma chave PIX na conta do organizador:**
   - Acesse: https://www.mercadopago.com.br/settings/account/pix
   - Ou: https://www.mercadolivre.com.br/perfil/chaves-pix

2. **Verifique se está usando conta de produção:**
   - Token OAuth deve começar com `APP_USR-` (não `TEST-`)
   - Conta conectada deve ser de produção

3. **Teste novamente:**
   - Crie uma nova preferência
   - O PIX deve aparecer no checkout

## Verificação

Após cadastrar a chave PIX, você pode verificar se está funcionando:

1. Crie uma nova inscrição
2. Vá para o checkout
3. O PIX deve aparecer como opção de pagamento

Se ainda não aparecer após cadastrar a chave PIX, entre em contato com o suporte do Mercado Pago.

