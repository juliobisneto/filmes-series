# 🌐 Como Publicar a Aplicação na Web

**Data:** 26 de Janeiro de 2026  
**Objetivo:** Deploy com menor custo possível (gratuito ou muito barato)

---

## 📋 Índice

1. [Opção 1: Vercel + Railway (RECOMENDADO)](#opção-1-vercel--railway-recomendado)
2. [Opção 2: Netlify + Render](#opção-2-netlify--render)
3. [Opção 3: GitHub Pages + Fly.io](#opção-3-github-pages--flyio)
4. [Opção 4: Hospedagem VPS (DigitalOcean/Vultr)](#opção-4-hospedagem-vps)
5. [Comparação de Custos](#comparação-de-custos)

---

## Opção 1: Vercel + Railway (RECOMENDADO) ⭐

### ✅ Vantagens:
- ✅ **100% GRATUITO** para começar
- ✅ Deploy automático via Git
- ✅ HTTPS incluso
- ✅ Muito fácil de configurar
- ✅ Railway oferece $5/mês de crédito grátis

### 🎯 Como Funciona:
- **Frontend (React)**: Vercel (gratuito)
- **Backend (Node.js)**: Railway (gratuito até $5/mês)
- **Banco de dados (SQLite)**: Arquivo no Railway

---

### 📦 Passo 1: Preparar o Projeto

#### 1.1. Criar repositório no GitHub

```bash
cd /Users/juliobisneto/temp/Filmes_e_Series

# Inicializar Git (se ainda não estiver)
git init
git add .
git commit -m "Preparar para deploy"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/SEU_USUARIO/filmes-series.git
git branch -M main
git push -u origin main
```

#### 1.2. Adicionar arquivo `.env.example`

Criar arquivo `backend/.env.example`:
```env
PORT=3001
OMDB_API_KEY=sua_chave_aqui
JWT_SECRET=seu_secret_aqui
NODE_ENV=production
```

#### 1.3. Atualizar `backend/package.json`

Adicionar scripts de produção:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### 🚀 Passo 2: Deploy do Backend no Railway

1. **Acesse**: https://railway.app/
2. **Cadastre-se** com GitHub (gratuito)
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha seu repositório
6. Selecione a pasta **`backend`**
7. Configure as variáveis de ambiente:
   ```
   PORT=3001
   OMDB_API_KEY=77fbb3c
   JWT_SECRET=filmes_series_secret_key_change_in_production_2026
   NODE_ENV=production
   ```
8. Railway vai detectar Node.js automaticamente e fazer deploy
9. Copie a URL gerada (ex: `https://seu-app.railway.app`)

#### Importante para SQLite no Railway:

Criar arquivo `railway.json` na pasta `backend`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

⚠️ **Atenção**: SQLite no Railway não é persistente por padrão. Para dados persistentes, você tem 2 opções:

**Opção A: Volume Persistente (Railway)**
- Montar volume em `/app/backend/backups`
- Custo: incluído no plano gratuito

**Opção B: Migrar para PostgreSQL (Railway)**
- Railway oferece PostgreSQL gratuito
- Mais robusto para produção
- Requer adaptação do código

---

### 🎨 Passo 3: Deploy do Frontend no Vercel

1. **Acesse**: https://vercel.com/
2. **Cadastre-se** com GitHub (gratuito)
3. Clique em **"Add New Project"**
4. Importe seu repositório do GitHub
5. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Adicione variável de ambiente:
   ```
   REACT_APP_API_URL=https://seu-app.railway.app/api
   ```
7. Clique em **"Deploy"**
8. Vercel vai gerar uma URL (ex: `https://seu-app.vercel.app`)

---

### 🔧 Passo 4: Ajustes Finais

#### 4.1. Atualizar CORS no Backend

Editar `backend/server.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://seu-app.vercel.app',
    'http://localhost:3000',
    'http://192.168.68.119:2112'
  ],
  credentials: true
}));
```

#### 4.2. Commit e Push

```bash
git add .
git commit -m "Configurar para produção"
git push
```

Railway e Vercel vão fazer redeploy automaticamente! 🚀

---

## Opção 2: Netlify + Render

### 💰 Custo: **GRATUITO**

### Frontend no Netlify:
1. Acesse: https://netlify.com/
2. Cadastre-se com GitHub
3. **"Add new site"** → **"Import from Git"**
4. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
5. Variável de ambiente:
   ```
   REACT_APP_API_URL=https://seu-app.onrender.com/api
   ```

### Backend no Render:
1. Acesse: https://render.com/
2. Cadastre-se com GitHub
3. **"New"** → **"Web Service"**
4. Conecte seu repositório
5. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Adicione variáveis de ambiente
7. Plano gratuito: app "hiberna" após 15 min sem uso (volta em ~1 min)

---

## Opção 3: GitHub Pages + Fly.io

### 💰 Custo: **GRATUITO**

### Frontend no GitHub Pages:
- Apenas para sites estáticos
- Requer configuração especial para React Router
- Documentação: https://create-react-app.dev/docs/deployment/#github-pages

### Backend no Fly.io:
1. Instale Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Na pasta `backend`: `flyctl launch`
4. Configure variáveis: `flyctl secrets set JWT_SECRET=...`
5. Deploy: `flyctl deploy`
6. Plano gratuito: 3 VMs compartilhadas

---

## Opção 4: Hospedagem VPS

### 💰 Custo: **~$5-10/mês**

Provedores recomendados:
- **DigitalOcean**: $4/mês (Droplet básico)
- **Vultr**: $2.50/mês (Cloud Compute)
- **Hetzner**: €4.15/mês (~$4.50)
- **Contabo**: €4.99/mês (~$5.50)

### Vantagens:
- ✅ Controle total
- ✅ SQLite funciona perfeitamente
- ✅ Pode hospedar frontend e backend juntos
- ✅ Backups automáticos do seu sistema já funcionam

### Como configurar:

1. **Criar servidor Ubuntu 22.04**
2. **Instalar dependências**:
```bash
# Conectar via SSH
ssh root@seu-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar nginx
apt install -y nginx

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

3. **Fazer upload do código**:
```bash
# No seu computador
scp -r /Users/juliobisneto/temp/Filmes_e_Series root@seu-ip:/var/www/
```

4. **Configurar Backend**:
```bash
# No servidor
cd /var/www/Filmes_e_Series/backend
npm install --production

# Criar .env
nano .env
# Adicionar as variáveis de ambiente

# Iniciar com PM2
pm2 start server.js --name filmes-backend
pm2 save
pm2 startup
```

5. **Configurar Frontend**:
```bash
cd /var/www/Filmes_e_Series/frontend

# Atualizar .env.production
echo "REACT_APP_API_URL=https://seu-dominio.com/api" > .env.production

# Build
npm install
npm run build
```

6. **Configurar Nginx**:
```bash
nano /etc/nginx/sites-available/filmes
```

Adicionar:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/Filmes_e_Series/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/filmes /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

7. **Instalar SSL (HTTPS grátis)**:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

---

## 📊 Comparação de Custos

| Opção | Frontend | Backend | Banco | Custo/Mês | Melhor Para |
|-------|----------|---------|-------|-----------|-------------|
| **Vercel + Railway** | Grátis | Grátis* | SQLite | **$0-5** | Começar rápido |
| **Netlify + Render** | Grátis | Grátis* | SQLite | **$0** | Teste/hobby |
| **GitHub + Fly.io** | Grátis | Grátis* | SQLite | **$0** | Projeto pessoal |
| **VPS (DigitalOcean)** | Incluso | Incluso | SQLite | **$4-10** | Controle total |

\* Planos gratuitos têm limitações (hibernação, créditos mensais, etc.)

---

## 🎯 Recomendação Final

### Para Começar AGORA (0 config):
**Vercel + Railway** → 15 minutos para estar online

### Para Uso Pessoal:
**VPS (Hetzner/Vultr)** → $4/mês, controle total, sem limitações

### Para Produção Séria:
**VPS + PostgreSQL** → $10-15/mês, escalável e robusto

---

## 🔐 Domínio Personalizado

### Domínio Grátis:
- **Freenom**: .tk, .ml, .ga (grátis por 1 ano)
- **DuckDNS**: subdomínio grátis (ex: filme.duckdns.org)

### Domínio Pago:
- **Namecheap**: ~$10/ano (.com)
- **Porkbun**: ~$9/ano (.com)
- **Registro.br**: ~R$40/ano (.com.br)

---

## 📝 Checklist de Deploy

- [ ] Código no GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] CORS atualizado com domínios de produção
- [ ] Frontend com API_URL correto
- [ ] Backend rodando e acessível
- [ ] Banco de dados funcionando
- [ ] HTTPS configurado
- [ ] Backups automáticos configurados
- [ ] Teste completo (login, adicionar filme, buscar IMDB)

---

## 🆘 Precisa de Ajuda?

1. **Railway**: https://docs.railway.app/
2. **Vercel**: https://vercel.com/docs
3. **Render**: https://render.com/docs
4. **DigitalOcean**: https://docs.digitalocean.com/

---

## 🚀 Próximos Passos

Escolha uma opção e eu te ajudo com o processo detalhado!

**Qual opção você prefere?**
1. Vercel + Railway (mais rápido)
2. VPS próprio (mais controle)
3. Outra opção específica
