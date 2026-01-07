# 🗄️ Solução Definitiva: Banco de Dados Local

## ✅ Solução Automática (Recomendado)

Execute **uma vez só** para configurar tudo:

```bash
# 1. Configurar banco local com Docker
npm run db:setup

# 2. Atualizar .env com URL correta
npm run db:setup-env

# 3. Verificar se está funcionando
npm run db:check
```

**Pronto!** Agora o banco vai funcionar sempre, mesmo após reiniciar a máquina.

## 🔄 Após Reiniciar a Máquina

O Docker Desktop geralmente inicia automaticamente, mas se o banco não estiver rodando:

```bash
# Iniciar banco automaticamente
npm run db:ensure

# Ou manualmente
docker start okesports-postgres
```

## 📋 O que foi configurado?

1. **Docker Compose** (`docker-compose.yml`) - PostgreSQL em container
2. **Scripts automáticos** - Verificam e iniciam o banco quando necessário
3. **URL padrão** - `postgresql://postgres:postgres@localhost:5432/okesports`

## 🎯 Por que essa solução?

- ✅ **Funciona sempre** - Não depende de serviços externos
- ✅ **Automático** - Docker inicia o banco quando necessário
- ✅ **Simples** - Uma configuração, funciona para sempre
- ✅ **Local** - Dados ficam na sua máquina

## 🆘 Problemas?

### Docker não está instalado
```bash
# Instale Docker Desktop: https://www.docker.com/products/docker-desktop
```

### Container não inicia
```bash
# Ver logs
docker logs okesports-postgres

# Recriar container
docker-compose down
npm run db:setup
```

### Porta 5432 já está em uso
Edite `docker-compose.yml` e mude a porta:
```yaml
ports:
  - "5433:5432"  # Use 5433 ao invés de 5432
```

E atualize o `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/okesports"
```
