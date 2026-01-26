# 📦 SISTEMA DE BACKUP AUTOMÁTICO

## ✅ Implementado em: 24/01/2026

---

## 🎯 **Objetivo**

Proteger os dados do banco de dados contra perda acidental, garantindo que sempre haja uma cópia de segurança antes de qualquer modificação.

---

## 🔧 **Funcionalidades**

### **1. Backup Automático no Startup**
- ✅ Backup criado **automaticamente** toda vez que o servidor inicia
- ✅ Só cria backup se o banco existir e tiver conteúdo
- ✅ Nome do arquivo: `filmes_series_[timestamp]_startup.db`

### **2. Backup Manual via API**
- ✅ Endpoint: `POST /api/backup/create`
- ✅ Requer autenticação (token JWT)
- ✅ Permite especificar um motivo para o backup

### **3. Listagem de Backups**
- ✅ Endpoint: `GET /api/backup/list`
- ✅ Mostra todos os backups disponíveis
- ✅ Informações: nome, tamanho, data de criação

### **4. Restauração de Backup**
- ✅ Endpoint: `POST /api/backup/restore`
- ✅ Restaura um backup específico
- ✅ Cria backup do estado atual antes de restaurar

### **5. Limpeza Automática**
- ✅ Mantém apenas os **últimos 10 backups**
- ✅ Remove backups antigos automaticamente
- ✅ Economiza espaço em disco

---

## 📁 **Estrutura de Arquivos**

```
backend/
├── backups/                          # Pasta de backups (criada automaticamente)
│   ├── filmes_series_2026-01-24_startup.db
│   ├── filmes_series_2026-01-24_manual.db
│   └── filmes_series_2026-01-24_pre-restore.db
├── utils/
│   └── backup.js                     # Gerenciador de backups
├── routes/
│   └── backup.js                     # Rotas de API para backups
└── database.js                       # Modificado para fazer backup no startup
```

---

## 🚀 **Como Usar**

### **Backup Automático (Já Ativo)**
Não precisa fazer nada! O sistema cria backup automaticamente:
- ✅ Ao iniciar o servidor
- ✅ Antes de restaurar outro backup

### **Criar Backup Manual via API**

```bash
# Com curl
curl -X POST http://localhost:3001/api/backup/create \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"reason": "antes-de-importar-dados"}'

# Resposta
{
  "message": "Backup criado com sucesso",
  "backup": "/caminho/para/backup.db"
}
```

### **Listar Backups Disponíveis**

```bash
curl http://localhost:3001/api/backup/list \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Resposta
{
  "backups": [
    {
      "name": "filmes_series_2026-01-24_startup.db",
      "path": "/caminho/completo/backup.db",
      "size": "28.00 KB",
      "created": "24/01/2026 10:24:41"
    }
  ]
}
```

### **Restaurar um Backup**

```bash
curl -X POST http://localhost:3001/api/backup/restore \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"backupFileName": "filmes_series_2026-01-24_startup.db"}'

# Resposta
{
  "message": "Backup restaurado com sucesso",
  "warning": "O servidor precisa ser reiniciado para aplicar as mudanças"
}
```

---

## 📋 **Convenções de Nomenclatura**

Os backups são nomeados seguindo o padrão:
```
filmes_series_[TIMESTAMP]_[RAZÃO].db
```

**Razões padrão:**
- `startup` - Backup automático ao iniciar o servidor
- `manual` - Backup criado manualmente via API
- `pre-restore` - Backup criado antes de restaurar outro backup
- `custom` - Backup com razão personalizada

---

## 🔐 **Segurança**

- ✅ Todas as rotas de backup requerem **autenticação JWT**
- ✅ Backups armazenados localmente no servidor
- ✅ Pasta `backups/` adicionada ao `.gitignore`
- ✅ Limite de 10 backups para evitar consumo excessivo de disco

---

## ⚙️ **Configuração**

### **Alterar Quantidade de Backups Mantidos**

Edite o arquivo `backend/utils/backup.js`:

```javascript
// Linha ~61
cleanOldBackups(keepLast = 10) {  // Altere 10 para o número desejado
```

### **Alterar Local de Armazenamento**

Edite o arquivo `backend/utils/backup.js`:

```javascript
// Linhas 4-5
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
// Altere para o caminho desejado
```

---

## 🛡️ **Benefícios**

- ✅ **Proteção contra perda de dados**
- ✅ **Restauração rápida** em caso de erro
- ✅ **Histórico de versões** do banco de dados
- ✅ **Automação completa** - sem intervenção manual
- ✅ **Rastreabilidade** - cada backup tem timestamp e razão

---

## 📊 **Exemplo de Log do Servidor**

```
📦 Criando backup de segurança antes de inicializar...
✅ Backup criado: filmes_series_2026-01-24T13-24-41-476Z_startup.db (28.00 KB)
📁 Local: /Users/.../backend/backups/filmes_series_2026-01-24T13-24-41-476Z_startup.db

🚀 Servidor rodando na porta 3001
📦 Sistema de Backup Automático ATIVO
```

---

## 💡 **Recomendações**

1. **Faça backups manuais antes de:**
   - Importar grandes quantidades de dados
   - Fazer alterações críticas no banco
   - Atualizar a estrutura das tabelas
   - Restaurar outro backup

2. **Mantenha backups externos:**
   - Considere copiar a pasta `backups/` para outro local
   - Use serviços de armazenamento em nuvem
   - Configure backup automático via cron/script

3. **Monitore o espaço em disco:**
   - Backups consomem espaço
   - Ajuste o limite de backups mantidos conforme necessário

---

## ✅ **Status Atual**

- ✅ Sistema implementado e testado
- ✅ Backup automático ao iniciar: **ATIVO**
- ✅ API de gerenciamento: **ATIVA**
- ✅ Limpeza automática: **ATIVA**
- ✅ Proteção de dados: **GARANTIDA**

---

**Seus dados agora estão protegidos! 🛡️**
