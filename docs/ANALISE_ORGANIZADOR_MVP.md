# 📊 Análise: Painel do Organizador - Melhorias para MVP

**Data:** Dezembro 2024  
**Status Atual:** Funcionalidades básicas implementadas  
**Foco:** Melhorias essenciais para MVP

---

## ✅ O que já está implementado

### 1. **Autenticação e Perfil**
- ✅ Login/Registro de organizador
- ✅ Integração OAuth Mercado Pago
- ✅ Status de conexão MP visível
- ✅ Desconectar MP

### 2. **Gestão de Eventos**
- ✅ Lista de eventos com filtros (status, busca)
- ✅ Criar novo evento
- ✅ Editar evento completo
- ✅ Deletar evento
- ✅ Status: DRAFT, PUBLISHED, CANCELLED
- ✅ Cards com informações resumidas

### 3. **Edição de Eventos (Aba Geral)**
- ✅ Cards de estatísticas (Inscrições, Modalidades)
- ✅ Ações rápidas (Copiar link, Abrir página pública)

### 4. **Edição de Eventos (Aba Informações)**
- ✅ Dados básicos do evento
- ✅ Localização
- ✅ Datas (evento, inscrições)

### 5. **Edição de Eventos (Aba Landing)**
- ✅ Destaques (Selling Points) com ícones
- ✅ Sobre o evento (descrição, inclui, dicas)
- ✅ FAQ customizável
- ✅ Contato (email, WhatsApp)

### 6. **Edição de Eventos (Aba Modalidades)**
- ✅ CRUD completo de modalidades
- ✅ Preços por modalidade
- ✅ Limite de vagas
- ✅ Ordem de exibição

### 7. **Edição de Eventos (Aba Lotes)**
- ✅ CRUD completo de lotes
- ✅ Tipos: DATA e VOLUME
- ✅ Descontos: PERCENTAGE e FIXED
- ✅ Validações de datas e volumes

### 8. **Edição de Eventos (Aba Cupons)**
- ✅ CRUD completo de cupons
- ✅ Descontos: PERCENTAGE e FIXED
- ✅ Limite de uso
- ✅ Validação em tempo real

### 9. **Edição de Eventos (Aba Kit)**
- ✅ Configuração de itens do kit
- ✅ Gestão de tamanhos de camisa
- ✅ Controle de estoque (disponível, reservado, vendido)

### 10. **Edição de Eventos (Aba Inscritos)**
- ✅ Lista completa de inscrições
- ✅ Filtros (status, pagamento, busca)
- ✅ Informações do participante
- ✅ Status de pagamento
- ✅ Resumo financeiro

---

## 🚨 O que está faltando para MVP

### **PRIORIDADE ALTA (P0) - Essencial para MVP**

#### 1. **Dashboard com Estatísticas Reais** ⭐⭐⭐
**Status:** Estatísticas estão hardcoded (0, R$ 0,00)

**O que falta:**
- API `/api/dashboard/stats` para buscar dados reais
- Total de eventos (ativos, publicados, rascunhos)
- Total de inscrições (todas, confirmadas, pendentes)
- Receita total (bruta e líquida após taxas)
- Taxa da plataforma acumulada
- Gráfico simples de inscrições por dia (últimos 30 dias)

**Impacto:** Organizador não consegue ver o desempenho geral

**Estimativa:** 3-5 SP

---

#### 2. **Exportar Inscrições para CSV** ⭐⭐⭐
**Status:** Botão existe mas não funciona

**O que falta:**
- Função para gerar CSV com dados das inscrições
- Colunas: Nome, Email, CPF, Telefone, Modalidade, Valor, Status Pagamento, Data
- Download direto do arquivo

**Impacto:** Organizador precisa exportar dados para planilhas

**Estimativa:** 2 SP

---

#### 3. **Valores Líquidos (Após Taxas)** ⭐⭐⭐
**Status:** Mostra valores brutos apenas

**O que falta:**
- Calcular valor líquido (total - taxa plataforma 10%)
- Mostrar breakdown: Bruto, Taxa, Líquido
- Na lista de inscrições e no resumo

**Impacto:** Organizador precisa saber quanto vai receber

**Estimativa:** 2 SP

---

#### 4. **Notificações/Alertas Importantes** ⭐⭐
**Status:** Não existe

**O que falta:**
- Alertas quando inscrições estão acabando (últimas 10 vagas)
- Alertas quando evento está próximo (7 dias)
- Alertas de pagamentos pendentes há mais de 24h
- Banner no dashboard com avisos

**Impacto:** Organizador pode perder oportunidades

**Estimativa:** 3 SP

---

#### 5. **Preview de Valores no Dashboard** ⭐⭐
**Status:** Valores estão zerados

**O que falta:**
- Buscar dados reais do banco
- Mostrar receita por evento
- Mostrar receita total
- Mostrar taxa acumulada

**Impacto:** Organizador não vê performance financeira

**Estimativa:** 2 SP

---

### **PRIORIDADE MÉDIA (P1) - Importante mas não bloqueante**

#### 6. **Filtros Avançados na Lista de Inscrições** ⭐⭐
**Status:** Filtros básicos existem

**O que falta:**
- Filtro por modalidade
- Filtro por data de inscrição
- Filtro por valor (faixas)
- Filtro por tamanho de camisa
- Salvar filtros favoritos

**Impacto:** Facilita análise de dados

**Estimativa:** 3 SP

---

#### 7. **Ações em Lote na Lista de Inscrições** ⭐⭐
**Status:** Não existe

**O que falta:**
- Selecionar múltiplas inscrições
- Ações: Exportar selecionados, Enviar email, Marcar como confirmado
- Checkbox "Selecionar todos"

**Impacto:** Facilita gestão de múltiplas inscrições

**Estimativa:** 4 SP

---

#### 8. **Histórico de Alterações do Evento** ⭐
**Status:** Não existe

**O que falta:**
- Log de mudanças (quem, quando, o que)
- Histórico de preços
- Histórico de status
- Timeline de eventos importantes

**Impacto:** Auditoria e rastreabilidade

**Estimativa:** 5 SP

---

#### 9. **Duplicar Evento** ⭐
**Status:** Não existe

**O que falta:**
- Botão "Duplicar" na lista de eventos
- Copiar todas as configurações
- Ajustar datas automaticamente
- Criar como rascunho

**Impacto:** Facilita criação de eventos similares

**Estimativa:** 3 SP

---

#### 10. **Preview da Landing Page no Editor** ⭐
**Status:** Precisa abrir em nova aba

**O que falta:**
- Preview inline na aba Landing
- Atualização em tempo real
- Toggle desktop/mobile

**Impacto:** Facilita edição visual

**Estimativa:** 4 SP

---

### **PRIORIDADE BAIXA (P2) - Nice to have**

#### 11. **Gráficos e Visualizações**
- Gráfico de inscrições ao longo do tempo
- Gráfico de receita por modalidade
- Gráfico de conversão (visualizações → inscrições)

**Estimativa:** 5 SP

---

#### 12. **Relatórios Avançados**
- Relatório por período
- Relatório demográfico (cidades, idades)
- Relatório de meios de pagamento
- Exportação em PDF

**Estimativa:** 8 SP

---

#### 13. **Comunicação com Participantes**
- Enviar email em massa
- Templates de email
- Segmentação (por modalidade, status, etc)

**Estimativa:** 8 SP

---

## 📋 Checklist de Melhorias MVP

### **Fase 1: Essencial (1-2 semanas)**
- [ ] Dashboard com estatísticas reais
- [ ] Exportar CSV de inscrições
- [ ] Valores líquidos (após taxas)
- [ ] Preview de valores no dashboard
- [ ] Notificações/alertas básicos

### **Fase 2: Melhorias (2-3 semanas)**
- [ ] Filtros avançados na lista de inscrições
- [ ] Ações em lote
- [ ] Duplicar evento
- [ ] Preview da landing no editor

### **Fase 3: Avançado (pós-MVP)**
- [ ] Gráficos e visualizações
- [ ] Relatórios avançados
- [ ] Comunicação com participantes
- [ ] Histórico de alterações

---

## 🎯 Recomendações Prioritárias

### **Para MVP (Próximas 2 semanas):**

1. **Dashboard com dados reais** (P0)
   - Criar API `/api/dashboard/stats`
   - Buscar dados agregados do banco
   - Atualizar cards do dashboard

2. **Exportar CSV** (P0)
   - Implementar função de exportação
   - Testar com dados reais

3. **Valores líquidos** (P0)
   - Calcular taxa de 10% automaticamente
   - Mostrar breakdown em todos os lugares relevantes

4. **Alertas básicos** (P0)
   - Alertas de vagas acabando
   - Alertas de eventos próximos
   - Banner no dashboard

---

## 💡 Melhorias de UX Sugeridas

### **Dashboard:**
- Adicionar gráfico simples de inscrições (últimos 7 dias)
- Mostrar "última inscrição" com timestamp
- Mostrar "próximo evento" com countdown
- Adicionar atalhos rápidos (Criar evento, Ver todos)

### **Lista de Eventos:**
- Adicionar ordenação (data, nome, inscrições)
- Adicionar visualização em lista (além de cards)
- Mostrar receita por evento no card
- Badge de "novo" para eventos criados nas últimas 24h

### **Lista de Inscrições:**
- Adicionar paginação (se muitos registros)
- Adicionar ordenação por colunas
- Mostrar total selecionado quando houver seleção
- Adicionar busca avançada (múltiplos campos)

### **Edição de Evento:**
- Adicionar validação visual de campos obrigatórios
- Mostrar preview do slug em tempo real
- Adicionar atalho para publicar (sem abrir aba)
- Adicionar confirmação antes de deletar

---

## 🔧 Melhorias Técnicas

### **Performance:**
- Implementar paginação na lista de inscrições
- Adicionar cache para estatísticas do dashboard
- Otimizar queries do banco (agregações)

### **Segurança:**
- Validar permissões em todas as rotas
- Adicionar rate limiting nas APIs
- Logs de ações importantes

### **Monitoramento:**
- Adicionar tracking de erros (Sentry)
- Métricas de uso (quais abas mais acessadas)
- Analytics básico

---

## 📊 Métricas de Sucesso

### **Após implementar melhorias MVP:**
- ✅ Organizador consegue ver performance geral
- ✅ Organizador consegue exportar dados
- ✅ Organizador sabe quanto vai receber
- ✅ Organizador é alertado sobre eventos importantes
- ✅ Tempo médio para criar evento < 10 minutos
- ✅ Taxa de uso do dashboard > 80%

---

## 🚀 Próximos Passos

1. **Implementar Fase 1** (essencial)
2. **Testar com organizadores reais**
3. **Coletar feedback**
4. **Iterar baseado em feedback**
5. **Implementar Fase 2** (melhorias)

---

**Última atualização:** Dezembro 2024

