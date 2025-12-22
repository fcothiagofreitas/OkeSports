# 🧪 Guia de Teste - Split de Pagamento Mercado Pago

## ✅ Configuração Inicial

**IMPORTANTE**: Agora que você adicionou a tag **"Marketplace"** no modelo de integração, o split payment deve funcionar!

## 🚀 Início Rápido (3 Passos)

1. **Obter token da conta3 (Vendedor)**:
   - Login: https://www.mercadopago.com.br/developers/panel/app
   - Use: `TESTUSER4742...` / `ZXFXWVtu8s`
   - Copie o Access Token de teste

2. **Adicionar no `.env`**:
   ```env
   MP_TEST_SELLER_TOKEN="TEST-seu-token-aqui"
   ```

3. **Testar**:
   - Criar inscrição → Gerar checkout → Pagar
   - Verificar logs: deve aparecer `✅ Adicionando marketplace_fee`

## 🧪 Usando Contas de Teste do Mercado Pago

O Mercado Pago fornece **contas de teste** específicas para testar split payments:

### Contas Disponíveis

1. **conta1 (Integrador)**: Aplicação Okê Sports
   - User ID: `3035330827`
   - Usuário: `TESTUSER3221...`
   - Senha: `W4WKklYkqa`

2. **conta2 (Comprador)**: Participante que faz o pagamento
   - User ID: `3036425390`
   - Usuário: `TESTUSER3269...`
   - Senha: `1bZss4gGAD`

3. **conta3 (Vendedor)**: Organizador que recebe o pagamento
   - User ID: `3035330929`
   - Usuário: `TESTUSER4742...`
   - Senha: `ZXFXWVtu8s`

### ⚠️ Limitações do Sandbox

O **sandbox do Mercado Pago** pode ter algumas limitações, mas com a tag Marketplace configurada:

1. ✅ **Split payments devem funcionar** com as contas de teste
2. ✅ **marketplace_fee deve ser aceito** pela API
3. ⚠️ **Use o token da conta3 (Vendedor)** como token do organizador

## ✅ Como Testar Split Payments com Contas de Teste

### Passo 1: Configurar Token do Organizador (conta3 - Vendedor)

Para que o split funcione, você precisa usar o **token da conta3 (Vendedor)** como token do organizador:

1. Acesse o painel do Mercado Pago: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com a **conta3 (Vendedor)**:
   - Usuário: `TESTUSER4742...`
   - Senha: `ZXFXWVtu8s`
3. Vá em **"Suas integrações"** → **"Credenciais de teste"**
4. Copie o **Access Token de teste** (começa com `TEST-`)

**Opção A: Via Variável de Ambiente (Mais Rápido para Testes)**

Adicione no seu `.env`:

```env
# Token da conta3 (Vendedor) - para testar split payments
MP_TEST_SELLER_TOKEN="TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx"
```

O sistema usará automaticamente este token em desenvolvimento.

**Opção B: Via Script (Salva no Banco)**

Execute o script fornecido:

```bash
node scripts/setup-mp-test-seller-token.js
```

Siga as instruções e informe o token da conta3 quando solicitado.

**Opção C: Via OAuth (Mais Realista)**

- O organizador faz login no sistema
- Conecta conta Mercado Pago usando as credenciais da conta3
- O sistema salvará o token automaticamente

### Passo 2: Verificar Configuração da Aplicação

1. Certifique-se de que a aplicação está configurada como **"Marketplace"**
2. Verifique se o **"Modelo de integração"** tem a tag **"Marketplace"** (já feito ✅)
3. A aplicação deve estar usando as credenciais da **conta1 (Integrador)**

### Passo 3: Criar Inscrição de Teste

1. Criar um evento de teste
2. Criar uma inscrição
3. Ao gerar o checkout, o sistema deve:
   - Usar o token da conta3 (organizador/vendedor)
   - Adicionar `marketplace_fee` na preferência
   - Criar o checkout com split payment

### Passo 4: Realizar Pagamento de Teste

1. Acessar o checkout gerado
2. Fazer login como **conta2 (Comprador)** no checkout do MP
3. Ou usar cartão de teste diretamente:
   - **Número**: 5031 4332 1540 6351
   - **CVV**: 123
   - **Validade**: 11/25
   - **Nome**: APRO
   - **CPF**: 12345678909

4. O pagamento será aprovado automaticamente
5. O webhook processará e calculará a taxa do Mercado Pago

## ✅ Como Testar Split Payments em Produção (Alternativa)

Para testar split payments corretamente, você precisa usar **credenciais de produção**:

#### Passo 1: Configurar Aplicação como Marketplace

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Certifique-se de que sua aplicação está configurada como **"Marketplace"**
3. Se não estiver, você precisará criar uma nova aplicação do tipo Marketplace

#### Passo 2: Organizador Conecta Conta MP

1. O organizador precisa fazer login no sistema
2. Ir em configurações e conectar conta Mercado Pago
3. Autorizar a aplicação Okê Sports a receber pagamentos em nome dele
4. O sistema salvará o `access_token` do organizador (via OAuth)

#### Passo 3: Criar Inscrição de Teste

1. Criar um evento de teste
2. Criar uma inscrição
3. Ao gerar o checkout, o sistema usará o token do organizador
4. O `marketplace_fee` será aplicado automaticamente

#### Passo 4: Realizar Pagamento de Teste

**Importante**: Use valores pequenos (ex: R$ 1,00) para testes!

1. Acessar o checkout gerado
2. Usar cartão de teste do Mercado Pago:
   - **Número**: 5031 4332 1540 6351
   - **CVV**: 123
   - **Validade**: 11/25
   - **Nome**: APRO
   - **CPF**: 12345678909

3. O pagamento será aprovado automaticamente
4. O webhook processará e calculará a taxa do Mercado Pago

### Opção 2: Teste com Dados Reais (Valores Pequenos)

Se você quiser testar com valores reais:

1. ✅ Use valores **muito pequenos** (R$ 1,00 - R$ 5,00)
2. ✅ Certifique-se de que a aplicação está como **Marketplace**
3. ✅ Organizador deve ter conta MP **verificada**
4. ✅ Use **PIX** para recebimento imediato (taxa menor)

## 🔍 Verificando se Split Está Funcionando

### 1. Logs do Servidor

Ao criar uma preferência, você verá logs como:

```
✅ Usando token do organizador (OAuth) - Split payments habilitado
💰 Criando preferência de pagamento: { ... }
✅ Adicionando marketplace_fee: 10.99
✅ Preferência criada com sucesso: { marketplaceFee: 10.99 }
```

### 2. Resposta da API

A resposta incluirá `marketplaceFee`:

```json
{
  "checkoutUrl": "https://...",
  "preferenceId": "...",
  "marketplaceFee": 10.99,
  "testMode": false
}
```

### 3. Webhook após Pagamento

Após o pagamento ser aprovado, o webhook calculará a taxa:

```
📦 Resposta completa do Mercado Pago: { ... }
✅ Taxa calculada via fee_details: 1.10
🔍 Resultado final cálculo taxa: {
  mercadoPagoFee: 1.10,
  transactionAmount: 120.89,
  marketplaceFee: 10.99
}
```

### 4. Verificar no Banco de Dados

A inscrição terá:
- `platformFee`: 10.99 (taxa Okê - paga pelo competidor)
- `mercadoPagoFee`: 1.10 (taxa MP - paga pelo organizador)
- `subtotal`: 109.90 (valor da inscrição)
- `total`: 120.89 (subtotal + platformFee)

## 🐛 Troubleshooting

### Erro: "marketplace_fee_invalid"

**Causa**: Aplicação não está configurada como Marketplace OU token errado

**Solução**:
1. ✅ Verificar se a tag "Marketplace" está no modelo de integração (já feito)
2. Verificar se está usando o token da **conta3 (Vendedor)**, não da aplicação
3. Verificar no painel do MP se a aplicação é do tipo Marketplace
4. Se não for, criar nova aplicação como Marketplace

### Erro: "marketplace_not_authorized"

**Causa**: Token não é da conta3 (Vendedor) OU aplicação não autorizada

**Solução**:
1. Certifique-se de usar o **Access Token da conta3 (Vendedor)**
2. Verificar se o token começa com `TEST-` (modo sandbox)
3. Verificar se a aplicação (conta1) está autorizada a receber em nome da conta3
4. Reconfigurar OAuth se necessário

### Erro: "marketplace_not_authorized"

**Causa**: Organizador não autorizou a aplicação corretamente

**Solução**:
1. Organizador desconectar conta MP
2. Reconectar e autorizar novamente
3. Verificar se o `access_token` foi salvo corretamente

### Erro: "Split payments não funcionam no sandbox"

**Causa**: Limitação conhecida do Mercado Pago

**Solução**:
1. Usar credenciais de produção (live mode)
2. Testar com valores pequenos
3. Ou aguardar suporte do MP para sandbox

### Taxa MP não calculada

**Causa**: Webhook não recebeu `transaction_details` completo

**Solução**:
1. Verificar logs do webhook
2. Usar botão "Recalcular" na lista de inscrições
3. Verificar se o pagamento foi aprovado

## 📊 Exemplo de Cálculo

Para uma inscrição de **R$ 109,90**:

```
Subtotal:           R$ 109,90
Platform Fee (10%): R$  10,99  (paga pelo competidor)
Total pago:         R$ 120,89  (competidor paga isso)

Após pagamento:
- Organizador recebe: R$ 109,90 - taxa MP (ex: R$ 1,10) = R$ 108,80
- Okê recebe: R$ 10,99 (marketplace_fee)
- MP recebe: R$ 1,10 (taxa do gateway)
```

## 🔐 Segurança

⚠️ **NUNCA** teste com valores altos em produção!

⚠️ **SEMPRE** use valores pequenos (R$ 1,00 - R$ 5,00) para testes

⚠️ **VERIFIQUE** se está usando ambiente correto (dev vs prod)

## 📝 Checklist de Teste

- [x] Tag "Marketplace" adicionada no modelo de integração ✅
- [ ] Token da conta3 (Vendedor) configurado (via `.env` ou script)
- [ ] Aplicação configurada como Marketplace no MP
- [ ] Preferência criada com `marketplace_fee` (verificar logs)
- [ ] Pagamento aprovado (usar conta2 ou cartão de teste)
- [ ] Webhook processado (verificar logs)
- [ ] `mercadoPagoFee` calculado e salvo
- [ ] Valores corretos na lista de inscrições (subtotal - mercadoPagoFee)

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs do servidor
2. Verificar logs do webhook
3. Consultar documentação do MP: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/marketplace
4. Contatar suporte do Mercado Pago se necessário

