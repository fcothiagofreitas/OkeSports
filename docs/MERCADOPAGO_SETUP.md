# Configuração do Mercado Pago para Desenvolvimento

## 📝 Resumo das Mudanças

✅ **Problema do NaN resolvido**: Os valores agora são convertidos corretamente de `Decimal` para `Number`
✅ **Detalhamento de valores implementado**: A página de status agora mostra breakdown completo
✅ **Suporte a credenciais de teste**: A API agora suporta usar tokens de teste em desenvolvimento

## 🔧 Como Configurar Credenciais de Teste do Mercado Pago

### Passo 1: Acessar o Painel de Desenvolvedores

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta do Mercado Pago
3. Se não tiver conta, crie uma gratuitamente

### Passo 2: Criar uma Aplicação

1. Clique em **"Criar aplicação"** ou **"Suas aplicações"**
2. Nome sugerido: **"OkeSports - Desenvolvimento"**
3. Selecione o tipo: **"Online payments"** ou **"Marketplace"**
4. Clique em **"Criar aplicação"**

### Passo 3: Obter Credenciais de Teste

1. No painel da sua aplicação, procure por **"Credenciais de teste"**
2. Você verá duas credenciais importantes:
   - **Access Token de teste** (começa com `TEST-`)
   - **Public Key de teste** (começa com `TEST-`)

### Passo 4: Adicionar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua os valores das variáveis:

```env
# Mercado Pago Test Credentials
MP_TEST_ACCESS_TOKEN="TEST-1234567890-123456-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-123456789"
MP_TEST_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Passo 5: Reiniciar o Servidor

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

## 🧪 Testando o Fluxo de Pagamento

### 1. Fazer Login como Participante
- URL: http://localhost:3000/login
- Email: `thiago@mail.com`
- Senha: `123456`

### 2. Acessar Formulário de Inscrição
- URL: http://localhost:3000/e/teste/inscricao/cmhr43i1f0008y4vwf93ewoqb
- O formulário virá pré-preenchido em desenvolvimento

### 3. Finalizar Inscrição
- Clique em **"Ir para Pagamento"**
- Se já existir uma inscrição, verá o status e botão **"Realizar Pagamento"**

### 4. Testar Pagamento no Mercado Pago
- Você será redirecionado para o checkout do Mercado Pago
- Use os **cartões de teste** do Mercado Pago:

#### Cartões de Teste Aprovados
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO (Aprovado)
```

#### Cartões de Teste Recusados
```
Número: 5031 7557 3453 0604
CVV: 123
Validade: 11/25
Nome: OTHE (Outro motivo)
```

## 📊 O que foi Implementado

### 1. Verificação de Inscrição Existente
- A página agora verifica se o usuário já tem inscrição
- Se existir, mostra o status em vez do formulário

### 2. Status da Inscrição
- ✅ **Pago**: Verde com ícone de check
- ⏰ **Pendente**: Amarelo com ícone de relógio
- ❌ **Não Pago**: Vermelho com ícone de X

### 3. Detalhamento de Valores
- Valor da inscrição
- Desconto (se houver)
- Subtotal
- Taxa de serviço (10%)
- **Total** em destaque

### 4. Botão "Realizar Pagamento"
- Aparece apenas se o pagamento não foi concluído
- Permite retomar o pagamento de uma inscrição existente

## 🔍 Logs de Desenvolvimento

Quando você clicar em "Realizar Pagamento", verá no terminal:

```
🧪 Usando credenciais de teste do Mercado Pago
```

Isso confirma que está usando as credenciais de teste do `.env`.

## ⚠️ Importante

- **NÃO** comitar o arquivo `.env` com credenciais reais
- As credenciais de **TESTE** são seguras para usar em desenvolvimento
- Em **produção**, o sistema usará OAuth e tokens criptografados

## 🆘 Problemas Comuns

### Erro: "Organizador não tem Mercado Pago configurado"
**Solução**: Certifique-se de que `MP_TEST_ACCESS_TOKEN` está configurado no `.env`

### Erro: "Invalid credentials"
**Solução**: Verifique se o token de teste está correto e começa com `TEST-`

### NaN nos valores
**Solução**: Já resolvido! Recarregue a página.

## 📚 Referências

- [Documentação Oficial do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)
- [Credentials de Teste](https://www.mercadopago.com.br/developers/pt/guides/resources/devpanel/credentials)
