# Setup Manual do GitHub - Okê Sports

Caso prefira criar labels, milestones e issues manualmente, use este guia.

---

## 🏷️ **LABELS**

### **Tipo:**
| Nome | Descrição | Cor |
|------|-----------|-----|
| `feature` | Nova funcionalidade | `#0e8a16` (verde) |
| `bug` | Correção de bug | `#d73a4a` (vermelho) |
| `enhancement` | Melhoria | `#a2eeef` (azul claro) |
| `refactor` | Refatoração | `#fbca04` (amarelo) |
| `docs` | Documentação | `#0075ca` (azul) |
| `test` | Testes | `#d4c5f9` (roxo claro) |

### **Área:**
| Nome | Descrição | Cor |
|------|-----------|-----|
| `frontend` | Frontend | `#1d76db` (azul) |
| `backend` | Backend | `#5319e7` (roxo) |
| `infra` | Infraestrutura | `#c2e0c6` (verde claro) |
| `design` | Design/UX | `#e99695` (rosa) |
| `security` | Segurança | `#b60205` (vermelho escuro) |
| `payments` | Pagamentos | `#006b75` (verde azulado) |
| `analytics` | Analytics | `#bfd4f2` (azul claro) |
| `research` | Pesquisa | `#f9d0c4` (laranja claro) |
| `legal` | Legal/LGPD | `#c5def5` (azul muito claro) |

### **Prioridade:**
| Nome | Descrição | Cor |
|------|-----------|-----|
| `P0-critical` | Crítico/Bloqueador | `#d93f0b` (laranja escuro) |
| `P1-high` | Alta prioridade | `#e99695` (rosa) |
| `P2-medium` | Média prioridade | `#fbca04` (amarelo) |
| `P3-low` | Baixa prioridade | `#d4c5f9` (roxo claro) |

---

## 🎯 **MILESTONES**

| Nome | Descrição | Data Alvo |
|------|-----------|-----------|
| M0: Validação de Mercado | Pesquisa com organizadores e validação do modelo | 2025-11-07 |
| M1: Setup e Core Mínimo | Setup do projeto, autenticação, CRUD básico | 2025-11-14 |
| M2: Marketplace + Pagamentos | OAuth, PIX, cartão, webhooks | 2025-11-28 |
| M3: Landing Page e Comunicação | Landing page, emails, deploy | 2025-12-05 |
| M4: Dashboard Avançado | Gráficos, métricas, relatórios | - |
| M5: Gestão de Eventos Avançada | Lotes, cupons, modalidades | - |
| M6: Landing Pages Avançadas | Templates, galeria, SEO | - |
| M7: Comunicação Avançada | Email marketing, WhatsApp | - |
| M8: Check-in | QR Code, modo offline | - |
| M9: Painel Admin Avançado | Multi-usuários, permissões | - |
| M10: Grupos e Assessorias | Inscrição coletiva | - |
| M11: Portal do Participante | Área do participante, busca | - |
| M12: Integrações Externas | Facebook Pixel, API pública | - |
| M13: Testes e Otimizações | Testes automatizados, performance | - |
| M14: Segurança e LGPD | Auditoria, LGPD completo | - |
| M15: Lançamento Oficial | Deploy final, documentação | - |

---

## 📋 **TEMPLATE DE ISSUE**

Use este template ao criar issues manualmente:

```markdown
**Estimativa:** X SP
**Prioridade:** P0/P1/P2/P3

**Objetivo:**
[Breve descrição do objetivo da task]

**Checklist:**
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

**Critérios de Aceitação:**
- Quando faço X, espero Y
- Deve funcionar em mobile e desktop
- Deve ter testes

**Dependências:**
- Depende de #123 (issue X)

**Recursos:**
- Link para documentação
- Link para design no Figma
```

**Labels:** `tipo`, `área`, `prioridade`
**Milestone:** MX
**Assignee:** @usuario

---

## 📦 **PROJECT BOARD (GitHub Projects)**

Crie um projeto com as seguintes colunas:

1. **📋 Backlog** - Issues não iniciadas
2. **🎯 Ready** - Prontas para começar
3. **🚧 In Progress** - Em desenvolvimento
4. **👀 In Review** - Em code review
5. **✅ Done** - Concluídas

**Automações sugeridas:**
- Quando issue é criada → move para Backlog
- Quando assignee é adicionado → move para Ready
- Quando PR é criado → move para In Review
- Quando PR é merged → move para Done

---

## 🔄 **WORKFLOW SUGERIDO**

### 1. **Planejamento de Sprint (Segunda-feira)**
- Revisar backlog
- Selecionar issues para a sprint
- Estimar em conjunto
- Atribuir responsáveis
- Mover para "Ready"

### 2. **Daily (Todos os dias)**
- O que fiz ontem?
- O que farei hoje?
- Tenho algum bloqueio?
- Atualizar status das issues

### 3. **Code Review**
- Todo PR precisa de pelo menos 1 aprovação
- Verificar testes
- Verificar documentação
- Rodar localmente se necessário

### 4. **Retrospectiva (Sexta-feira)**
- O que foi bem?
- O que pode melhorar?
- Action items para próxima sprint

---

## 🎨 **CONVENÇÕES**

### **Branches:**
```
feature/M1.1-setup-projeto
fix/payment-webhook-error
refactor/auth-middleware
docs/update-readme
```

### **Commits:**
```
feat(auth): implementar login com JWT
fix(payment): corrigir validação de webhook
refactor(db): otimizar query de inscrições
docs(readme): adicionar instruções de setup
test(e2e): adicionar teste de checkout
```

### **Pull Requests:**
```
[M1.1] Setup do Projeto

- Setup Next.js 14 com App Router
- Configurar TypeScript + ESLint + Prettier
- Setup Tailwind CSS
- Estrutura de pastas

Closes #1
```

---

## 📊 **MÉTRICAS A ACOMPANHAR**

- **Velocity:** Story points completados por sprint
- **Cycle Time:** Tempo de "In Progress" até "Done"
- **Lead Time:** Tempo de "Backlog" até "Done"
- **Burndown:** Progresso da sprint
- **Bug Rate:** Bugs abertos vs fechados
- **Code Coverage:** Cobertura de testes (meta: >60%)

---

## 🚀 **QUICK START**

### Opção 1: Script Automático (Recomendado)
```bash
# Instalar GitHub CLI
brew install gh

# Autenticar
gh auth login

# Executar script
chmod +x github-setup.sh
./github-setup.sh
```

### Opção 2: Manual
1. Acessar repositório no GitHub
2. Ir em **Issues → Labels** e criar labels acima
3. Ir em **Issues → Milestones** e criar milestones
4. Começar a criar issues usando o template

### Opção 3: Importar JSON (Avançado)
```bash
# Se tiver arquivo JSON das issues
gh issue import issues.json
```

---

## 📝 **DICAS**

1. **Use templates**: Crie templates de issue para padronizar
2. **Automatize**: Configure GitHub Actions para CI/CD
3. **Proteja branches**: Não permitir push direto na main
4. **Use dependabot**: Para atualizar dependências
5. **Configure pre-commit hooks**: Lint, format, tests
6. **Documente decisões**: Use ADR (Architecture Decision Records)

---

## ❓ **FAQ**

**Q: Posso criar as issues aos poucos?**
A: Sim! Comece com M0-M3 (MVP) e crie as demais conforme necessário.

**Q: Devo criar todas as 100+ tasks agora?**
A: Não. Foque no MVP primeiro. Crie issues detalhadas apenas 1-2 sprints à frente.

**Q: Como lidar com bugs não planejados?**
A: Crie issue com label `bug` e prioridade alta. Adicione à sprint atual se crítico.

**Q: E se a estimativa estiver errada?**
A: Normal! Ajuste e aprenda. Use retrospectiva para calibrar estimativas.

**Q: Preciso seguir exatamente as tasks do documento?**
A: Não. São sugestões. Adapte à sua realidade e aprendizados.

---

**Boa sorte! 🚀**
