# 🔌 Guia de Configuração de MCPs para OkeSports

Este documento lista os MCPs (Model Context Protocol) recomendados para o projeto OkeSports, organizados por prioridade e categoria.

---

## 🎯 MCPs Essenciais (Alta Prioridade)

### 1. **PostgreSQL MCP** ⭐⭐⭐
**Por que usar:** Visualizar e gerenciar o banco de dados diretamente do Cursor.

**Configuração:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/okesports"
      ],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:password@localhost:5432/okesports"
      }
    }
  }
}
```

**Uso:**
- Consultar dados de eventos, inscrições, pagamentos
- Verificar integridade dos dados
- Testar queries complexas
- Debug de problemas de dados

---

### 2. **GitHub MCP** ⭐⭐⭐
**Por que usar:** Gerenciar issues, PRs, e commits diretamente do Cursor.

**Configuração:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_seu_token_aqui"
      }
    }
  }
}
```

**Como obter o token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Criar token com permissões: `repo`, `issues`, `pull_requests`

**Uso:**
- Criar issues para bugs/features
- Revisar PRs
- Ver histórico de commits
- Gerenciar milestones

---

### 3. **Filesystem MCP** ⭐⭐
**Por que usar:** Operações avançadas de arquivo e busca no projeto.

**Configuração:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/thiagofreitas/www/OkeSports"
      ]
    }
  }
}
```

**Uso:**
- Buscar arquivos por padrão
- Ler/escrever múltiplos arquivos
- Operações em lote
- Análise de estrutura do projeto

---

## 🚀 MCPs Recomendados (Média Prioridade)

### 4. **Browser MCP** ⭐⭐
**Por que usar:** Testar a interface e fluxos do usuário automaticamente.

**Configuração:**
```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-browser"
      ]
    }
  }
}
```

**Uso:**
- Testar fluxo de inscrição completo
- Verificar landing pages
- Validar responsividade
- Capturar screenshots de bugs
- Testar integração com Mercado Pago

---

### 5. **Slack MCP** ⭐
**Por que usar:** Notificações e alertas sobre o projeto.

**Configuração:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-slack"
      ],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-seu-token",
        "SLACK_TEAM_ID": "T1234567890"
      }
    }
  }
}
```

**Uso:**
- Notificar sobre deploy
- Alertas de erros críticos
- Relatórios diários de métricas
- Notificações de pagamentos importantes

---

### 6. **Resend MCP** (se disponível) ⭐
**Por que usar:** Gerenciar templates de email e envios.

**Nota:** Pode não existir ainda. Alternativa: usar API diretamente ou criar wrapper.

**Uso:**
- Testar templates de email
- Verificar histórico de envios
- Debug de emails não entregues

---

## 🔧 MCPs Opcionais (Baixa Prioridade)

### 7. **SQLite MCP** (para testes locais)
Se você usar SQLite para testes, pode ser útil.

### 8. **Brave Search MCP**
Para pesquisas rápidas sobre documentação de APIs (Mercado Pago, Next.js, etc).

### 9. **Puppeteer MCP**
Alternativa ao Browser MCP para testes mais avançados.

---

## 📝 Como Configurar

### 1. Localizar arquivo de configuração do Cursor

**macOS:**
```bash
~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json
```

**Ou via Cursor:**
- Cmd+Shift+P → "Preferences: Open User Settings (JSON)"
- Adicionar configuração de MCPs

### 2. Estrutura completa recomendada

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/okesports"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "seu_token_aqui"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/thiagofreitas/www/OkeSports"
      ]
    },
    "browser": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-browser"
      ]
    }
  }
}
```

### 3. Variáveis de ambiente sensíveis

**⚠️ IMPORTANTE:** Não commitar tokens no repositório!

Crie um arquivo `.env.mcp` (adicione ao `.gitignore`):
```bash
# .env.mcp
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_seu_token
POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/okesports
```

---

## 🎯 Casos de Uso Específicos para OkeSports

### 1. **Debug de Pagamentos**
- Usar **PostgreSQL MCP** para verificar status de pagamentos
- Usar **Browser MCP** para testar fluxo completo
- Usar **GitHub MCP** para criar issue com detalhes do bug

### 2. **Análise de Dados**
- **PostgreSQL MCP**: Queries para relatórios de eventos
- **Filesystem MCP**: Gerar scripts de análise

### 3. **Desenvolvimento de Features**
- **GitHub MCP**: Criar branch e PR automaticamente
- **Browser MCP**: Testar feature antes de commitar
- **PostgreSQL MCP**: Verificar migrações

### 4. **Monitoramento**
- **Slack MCP**: Alertas de eventos críticos
- **PostgreSQL MCP**: Verificar métricas em tempo real

---

## 🔗 Links Úteis

- [MCP Servers List](https://github.com/modelcontextprotocol/servers)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Setup](https://docs.cursor.com/context/model-context-protocol)

---

## ✅ Checklist de Setup

- [ ] Configurar PostgreSQL MCP
- [ ] Configurar GitHub MCP (com token)
- [ ] Configurar Filesystem MCP
- [ ] Configurar Browser MCP (opcional)
- [ ] Testar cada MCP individualmente
- [ ] Adicionar `.env.mcp` ao `.gitignore`
- [ ] Documentar tokens em local seguro (1Password, etc)

---

**Última atualização:** Dezembro 2024

