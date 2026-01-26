# 🚀 Início Rápido

## Passo 1: Configurar a chave do OMDb API

1. Acesse: http://www.omdbapi.com/apikey.aspx
2. Escolha a opção "FREE" (1.000 requisições/dia)
3. Preencha seu email e confirme
4. Você receberá a chave por email
5. Edite o arquivo `backend/.env` e adicione sua chave:
   ```
   OMDB_API_KEY=sua_chave_aqui
   ```

## Passo 2: Instalar dependências (se ainda não instalou)

### Backend:
```bash
cd backend
npm install
```

### Frontend:
```bash
cd frontend
npm install
```

## Passo 3: Iniciar o sistema

### Terminal 1 - Backend:
```bash
cd backend
npm start
```

Aguarde a mensagem: "🚀 Servidor rodando na porta 3001"

### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

O navegador abrirá automaticamente em http://localhost:3000

## 🎯 Pronto!

Agora você pode:
- ✅ Adicionar filmes e séries manualmente
- 🔍 Buscar no IMDB e importar dados automaticamente
- ⭐ Avaliar e fazer anotações pessoais
- 📊 Filtrar por status, tipo e gênero
- 📱 Acessar de qualquer dispositivo (responsive)

## 📝 Dicas

1. **Primeira vez usando?** Clique em "Adicionar" e teste a busca no IMDB com "Matrix" ou "Breaking Bad"
2. **Sem chave da API?** Você pode adicionar filmes manualmente sem problemas
3. **Problemas?** Veja a seção "Solução de Problemas" no README.md

---

**Importante:** Mantenha os dois terminais abertos enquanto usar o sistema!
