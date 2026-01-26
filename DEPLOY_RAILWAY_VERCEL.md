# 🚀 Passo 1: Deploy Railway + Vercel (GRÁTIS)

**Status:** ✅ Pronto para deploy  
**Tempo estimado:** 15-20 minutos  
**Custo:** $0 (plano gratuito)

---

## 📋 Pré-requisitos

- [ ] Conta no GitHub (gratuita)
- [ ] Conta no Railway (gratuita)
- [ ] Conta no Vercel (gratuita)

**Crie as contas agora:**
- GitHub: https://github.com/signup
- Railway: https://railway.app/
- Vercel: https://vercel.com/signup

---

## 🎯 Etapa 1: Preparar Repositório GitHub (5 minutos)

### 1.1. Inicializar Git (se ainda não estiver)

```bash
cd /Users/juliobisneto/temp/Filmes_e_Series

# Verificar se já tem git
git status

# Se não tiver, inicializar
git init
```

### 1.2. Criar arquivo .gitignore na raiz

Já existe, mas vamos garantir que está correto:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
build/
dist/

# Environment
.env
.env.local
.env.production.local

# Database
*.db
*.sqlite
*.sqlite3

# Backups
backups/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
EOF
```

### 1.3. Criar repositório no GitHub

**Opção A: Via Site (Mais Fácil)**

1. Acesse: https://github.com/new
2. Nome do repositório: `filmes-series`
3. Descrição: `Sistema de gerenciamento de filmes e séries`
4. Público ou Privado: Escolha
5. NÃO marque "Initialize with README"
6. Clique em "Create repository"

**Copie os comandos que aparecem** (algo como):

```bash
git remote add origin https://github.com/SEU_USUARIO/filmes-series.git
git branch -M main
git add .
git commit -m "Primeira versão - preparar para deploy"
git push -u origin main
```

**Execute esses comandos no terminal!**

---

## 🗄️ Etapa 2: Configurar PostgreSQL (necessário para Railway)

⚠️ **IMPORTANTE**: Railway precisa de PostgreSQL ao invés de SQLite por causa do filesystem efêmero.

Já preparei os arquivos de migração para você. Todos os arquivos estão prontos!

---

## 🚂 Etapa 3: Deploy do Backend no Railway (5 minutos)

### 3.1. Criar Projeto no Railway

1. Acesse: https://railway.app/
2. Clique em **"Login"** e escolha **"Login with GitHub"**
3. Autorize o Railway a acessar seus repositórios
4. Clique em **"New Project"**
5. Selecione **"Deploy from GitHub repo"**
6. Escolha o repositório **`filmes-series`**
7. Railway vai detectar o Node.js automaticamente

### 3.2. Configurar Backend

1. Após o projeto ser criado, clique nele
2. Você verá que o deploy falhou (normal, precisa configurar)
3. Clique em **"Settings"** (ícone de engrenagem)
4. Em **"Root Directory"**, digite: `backend`
5. Clique em **"Deploy"**

### 3.3. Adicionar PostgreSQL

1. No dashboard do projeto, clique em **"+ New"**
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**
4. Railway vai provisionar automaticamente
5. Aguarde 30 segundos

### 3.4. Configurar Variáveis de Ambiente

1. Clique no serviço do **backend** (não no banco)
2. Vá em **"Variables"**
3. Clique em **"+ New Variable"** e adicione:

```
PORT=3001
OMDB_API_KEY=77fbb3c
JWT_SECRET=filmes_series_secret_key_change_in_production_2026
NODE_ENV=production
```

4. Railway vai **reconectar automaticamente** o PostgreSQL (variável `DATABASE_URL`)
5. Clique em **"Deploy"** novamente

### 3.5. Copiar URL do Backend

1. Após o deploy completar (1-2 minutos)
2. Clique no seu serviço backend
3. Vá em **"Settings"**
4. Copie a **"Public URL"** (ex: `https://filmes-backend-production.up.railway.app`)
5. **GUARDE ESSA URL!** Você vai precisar para o frontend

---

## 🎨 Etapa 4: Deploy do Frontend no Vercel (5 minutos)

### 4.1. Configurar Vercel

1. Acesse: https://vercel.com/
2. Clique em **"Sign Up"** e escolha **"Continue with GitHub"**
3. Autorize o Vercel
4. Clique em **"Add New Project"**
5. Clique em **"Import"** ao lado do repositório `filmes-series`

### 4.2. Configurar Build

Na tela de configuração:

1. **Project Name**: `filmes-series` (ou escolha outro)
2. **Framework Preset**: `Create React App`
3. **Root Directory**: Clique em **"Edit"** e selecione `frontend`
4. **Build Command**: `npm run build` (já vem por padrão)
5. **Output Directory**: `build` (já vem por padrão)

### 4.3. Adicionar Variável de Ambiente

**IMPORTANTE**: Use a URL do Railway que você copiou antes!

1. Clique em **"Environment Variables"**
2. Adicione:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://SUA-URL-DO-RAILWAY.up.railway.app/api`
   - Exemplo: `https://filmes-backend-production.up.railway.app/api`
3. Selecione todos os ambientes (Production, Preview, Development)

### 4.4. Deploy!

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos (Vercel vai fazer build e deploy)
3. Quando terminar, copie a URL (ex: `https://filmes-series.vercel.app`)

---

## 🔧 Etapa 5: Ajustes Finais

### 5.1. Atualizar CORS no Backend

O código já está preparado, mas vamos garantir:

1. Volte no Railway
2. Clique no serviço backend
3. Vá em **"Variables"**
4. Adicione uma nova variável:
   ```
   FRONTEND_URL=https://seu-app.vercel.app
   ```
5. Railway vai redesployar automaticamente

### 5.2. Criar Primeiro Usuário

1. Acesse seu app no Vercel: `https://seu-app.vercel.app`
2. Clique em **"Criar Conta"**
3. Preencha:
   - Nome: Seu nome
   - Email: julio.bisneto@gmail.com
   - Senha: Chico01
4. Clique em **"Registrar"**
5. Faça login!

---

## ✅ Checklist de Sucesso

- [ ] Backend rodando no Railway
- [ ] PostgreSQL conectado
- [ ] Frontend rodando no Vercel
- [ ] Consegui criar conta
- [ ] Consegui fazer login
- [ ] Consegui buscar filme no IMDB
- [ ] Consegui adicionar filme
- [ ] Filme aparece na lista

---

## 🎉 PARABÉNS!

Seu app está ONLINE e acessível de qualquer lugar! 🌍

### 🔗 URLs:
- **Frontend**: https://seu-app.vercel.app
- **Backend**: https://seu-backend.railway.app

### 📱 Compartilhe:
Pode acessar de qualquer dispositivo, qualquer lugar do mundo!

---

## 🚨 Problemas Comuns

### Backend não conecta no PostgreSQL

**Solução:**
1. Railway → Clique no PostgreSQL
2. Copie a variável `DATABASE_URL`
3. Backend → Variables → Adicione manualmente `DATABASE_URL`

### Frontend retorna erro 404 ou CORS

**Solução:**
1. Verifique se a URL do backend está correta no Vercel
2. Vercel → Settings → Environment Variables
3. Edite `REACT_APP_API_URL` com a URL correta
4. Redeploy: Settings → Deployments → ... → Redeploy

### Login não funciona

**Solução:**
1. Abra o console do navegador (F12)
2. Veja se há erros de CORS
3. Verifique se o backend está respondendo
4. Teste: `https://seu-backend.railway.app/api/health`

---

## 📊 Monitoramento

### Railway
- Dashboard: ver uso de CPU, memória, banco
- Logs: ver requisições e erros
- Metrics: acompanhar tráfego

### Vercel
- Analytics: ver pageviews
- Logs: ver builds e deploys
- Speed Insights: performance

---

## 💰 Custos Esperados

**Com tráfego baixo-médio (<1000 usuários/mês):**
- Railway: **$0/mês** (dentro dos $5 grátis)
- Vercel: **$0/mês** (ilimitado para hobby)
- **TOTAL: $0/mês** 🎉

**Se ultrapassar:**
- Railway: ~$10-20/mês
- Vercel: continua $0/mês

---

## 🔄 Próximo Passo (Futuro)

Quando quiser **economizar e ter controle total**:
- Migrar para VPS (~$4/mês)
- Voltar para SQLite
- Seguir guia: `VPS_DEPLOY_GUIDE.md` (vou criar)

---

## 🆘 Precisa de Ajuda?

Se tiver **qualquer dúvida ou erro**, me avise! Estou aqui para ajudar em cada passo! 🚀

**Documentação oficial:**
- Railway: https://docs.railway.app/
- Vercel: https://vercel.com/docs
- PostgreSQL: https://www.postgresql.org/docs/

---

**🎯 Bora fazer deploy? Qual etapa você está? 🚀**
