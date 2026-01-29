# 📧 Sistema de Notificações por Email

## ✅ Implementado com Sucesso!

O sistema agora envia emails automáticos para:

### 👥 **Amizades:**
- ✉️ Quando alguém envia solicitação de amizade
- ✉️ Quando uma solicitação é aceita

### 💡 **Sugestões de Filmes:**
- ✉️ Quando você recebe uma sugestão de filme
- ✉️ Quando sua sugestão é aceita pelo amigo

---

## 🔧 Configuração

### **1. Variáveis de Ambiente**

Adicione estas variáveis ao arquivo `.env` do backend:

```env
# Email Configuration
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app-do-gmail
FRONTEND_URL=https://filmes-series-chi.vercel.app
```

### **2. Como Obter Senha de App do Gmail**

⚠️ **IMPORTANTE:** Use uma "Senha de App", não sua senha normal do Gmail!

**Passos:**

1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas" (se ainda não estiver ativa)
3. Vá em "Senhas de app"
4. Selecione "Aplicativo personalizado"
5. Digite "Filmes & Séries"
6. Clique em "Gerar"
7. Copie a senha gerada (16 caracteres)
8. Cole no `.env` como `EMAIL_PASSWORD`

### **3. Configuração no Railway (Produção)**

No dashboard do Railway:

1. Vá em **Variables**
2. Adicione:
   - `EMAIL_USER` → seu-email@gmail.com
   - `EMAIL_PASSWORD` → senha-de-app-do-gmail
   - `FRONTEND_URL` → https://filmes-series-chi.vercel.app

---

## 📧 Templates de Email

Todos os emails seguem o design do sistema:

- 🎨 Tema escuro (igual ao site)
- 🎬 Logo "Filmes & Séries"
- 🔴 Cores vermelho e roxo
- 📱 Responsivo (mobile-friendly)
- 🔗 Botões de ação diretos

---

## 🧪 Testar Localmente

1. Configure o `.env` com suas credenciais do Gmail
2. Reinicie o servidor backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Envie uma solicitação de amizade ou sugestão
4. Verifique se o email foi recebido

---

## 📊 Limites de Envio

- **Gmail:** 500 emails/dia (gratuito)
- **Desenvolvimento:** Sem limite se não configurado (apenas logs no console)

---

## 🔒 Segurança

- ✅ Senha de app (não expõe senha real do Gmail)
- ✅ `.env` no `.gitignore` (não vai pro GitHub)
- ✅ Emails são enviados de forma assíncrona (não bloqueiam requisições)
- ✅ Erros de email não afetam funcionalidade principal

---

## 🎯 Exemplo de Email Recebido

### **Solicitação de Amizade:**
```
👥 Nova Solicitação de Amizade!

Olá!

Julio Bisneto (julio.bisneto@gmail.com) quer ser seu amigo no Filmes & Séries!

Aceite a solicitação para compartilhar suas experiências cinematográficas.

[Ver Solicitações]
```

### **Sugestão de Filme:**
```
💡 Nova Sugestão de Filme!

Olá!

Francisco Horta sugeriu um filme para você:

[POSTER DO FILME]

Inception (2010)

Mensagem de Francisco:
"Melhor filme de ficção científica! Você vai amar!"

[Ver Sugestões]
```

---

## ⚙️ Arquivos Modificados

### Criados:
- ✅ `backend/services/emailService.js` - Serviço de envio de emails

### Modificados:
- ✅ `backend/routes/friends.js` - Emails de amizade
- ✅ `backend/routes/suggestions.js` - Emails de sugestões
- ✅ `backend/package.json` - Dependência nodemailer

---

## 🚀 Status

✅ **Instalação:** Completa  
✅ **Código:** Implementado  
✅ **Integração:** Funcional  
⚠️ **Configuração:** Pendente (adicionar credenciais no `.env`)  

---

## 📝 Próximos Passos (Opcional)

### **Melhorias Futuras:**
- [ ] Preferências de notificação por usuário
- [ ] Resumo semanal de atividades
- [ ] Notificações de novos filmes adicionados por amigos
- [ ] Sistema de fila com Redis (para alto volume)
- [ ] Templates mais elaborados com React Email

---

## 🆘 Troubleshooting

### **Emails não estão sendo enviados:**
1. Verifique se o `.env` está configurado corretamente
2. Confirme que é uma "Senha de App" do Gmail
3. Verifique os logs do servidor para erros
4. Teste com outro email de destino

### **Erro "Invalid login":**
- Você está usando a senha normal do Gmail
- Use a "Senha de App" conforme instruções acima

### **Email vai para spam:**
- Normal em desenvolvimento
- Configure SPF/DKIM em produção
- Ou use serviços como SendGrid/Resend

---

**Documentação criada em:** 2026-01-29  
**Versão:** 1.0.0  
**Status:** ✅ Funcional
