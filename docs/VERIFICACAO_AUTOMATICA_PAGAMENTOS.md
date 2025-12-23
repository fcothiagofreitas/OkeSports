# 🔄 Verificação Automática de Pagamentos Pendentes

Este documento explica como funciona a verificação automática de pagamentos pendentes no sistema.

## 📋 Estratégias Implementadas

### 1. ✅ Verificação Automática ao Carregar (Sob Demanda)

**O que é:** Quando o organizador abre a aba "Inscritos" do evento, o sistema verifica automaticamente pagamentos pendentes das últimas 24 horas.

**Como funciona:**
- Ao carregar a página de inscrições, uma verificação silenciosa é executada
- Verifica apenas inscrições pendentes criadas nas últimas 24h
- Se encontrar pagamentos aprovados no Mercado Pago, atualiza automaticamente
- Recarrega a lista se houver atualizações
- Não mostra loading ou mensagens (silencioso)

**Vantagens:**
- ✅ Sem polling desnecessário
- ✅ Verifica quando o usuário está ativo
- ✅ Silencioso (não mostra loading)
- ✅ Eficiente (apenas últimas 24h)
- ✅ Não sobrecarrega o servidor

**Implementação:**
- Arquivo: `src/components/features/events/RegistrationsManager.tsx`
- Função: `checkPendingPaymentsAuto()`
- Chamada: `useEffect` ao carregar o componente

---

### 2. ✅ Botão Manual

**O que é:** Botão "Verificar Pagamentos Pendentes" disponível na aba "Inscritos" para verificação manual quando necessário.

**Como funciona:**
- Aparece automaticamente quando há inscrições pendentes
- Permite verificação manual de todos os pagamentos pendentes do evento
- Mostra feedback visual durante a verificação
- Exibe resultado após a verificação

**Vantagens:**
- ✅ Controle manual quando necessário
- ✅ Útil para debug e casos específicos
- ✅ Verifica todos os pendentes (sem limite de tempo)

**Implementação:**
- Arquivo: `src/components/features/events/RegistrationsManager.tsx`
- Função: `checkPendingPayments()`
- Visível quando `data.summary.pending > 0`

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Webhook do Mercado Pago (Principal)                  │
│    ✅ Notificação em tempo real quando status muda      │
│    ✅ Cobre 95%+ dos casos                              │
└─────────────────────────────────────────────────────────┘
                    ↓ (se falhar)
┌─────────────────────────────────────────────────────────┐
│ 2. Verificação Automática ao Carregar                   │
│    ✅ Quando usuário acessa aba "Inscritos"            │
│    ✅ Verifica últimas 24h                             │
│    ✅ Atualiza automaticamente se encontrar            │
└─────────────────────────────────────────────────────────┘
                    ↓ (se ainda pendente)
┌─────────────────────────────────────────────────────────┐
│ 3. Botão Manual                                         │
│    ✅ Disponível quando há pendentes                   │
│    ✅ Verifica todos os pendentes do evento            │
│    ✅ Útil para casos específicos e debug              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Resultado

Com essas estratégias, o sistema garante que:

1. **Webhook** cobre a maioria dos casos em tempo real
2. **Verificação automática** cobre quando o usuário está ativo
3. **Botão manual** permite controle quando necessário

**Vantagens:**
- ✅ Não sobrecarrega o servidor (sem polling constante)
- ✅ Verifica quando há interesse (usuário acessa)
- ✅ Flexível (botão manual para casos específicos)

---

## 🐛 Troubleshooting

### Verificação automática não funciona

1. Verifique console do navegador (F12) para erros
2. Verifique se a rota `/api/payments/check-pending` está funcionando
3. Verifique se há inscrições pendentes das últimas 24h

### Pagamentos ainda ficam pendentes

1. Verifique se o organizador tem token OAuth configurado
2. Use o botão manual "Verificar Pagamentos Pendentes" para verificar todos
3. Verifique logs do servidor para erros

### Botão não aparece

1. Verifique se há inscrições com status `PENDING`
2. Verifique se o evento tem inscrições pendentes

---

## 📝 Notas Técnicas

- **Filtro de data:** A verificação automática verifica apenas inscrições das últimas 24h
- **Botão manual:** Verifica todos os pendentes do evento (sem limite de tempo)
- **Idempotência:** Verificações podem ser executadas múltiplas vezes sem problemas
- **Performance:** Queries otimizadas com índices no banco de dados
- **Logs:** Verificações automáticas são silenciosas, botão manual mostra feedback

