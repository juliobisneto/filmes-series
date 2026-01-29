# 📧 Configuração do Resend para Envio de Emails

## 🎯 Por que Resend?

O Railway (e muitos outros cloud providers) **bloqueiam portas SMTP** (587 e 465) para evitar spam.

**Resend** usa **API HTTP** (porta 443) que **nunca é bloqueada**! ✅

---

## 🚀 PASSO 1: Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie uma conta (gratuita)
3. Confirme seu email

---

## 🔑 PASSO 2: Gerar API Key

1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Nome: `filmes-series-production`
4. Permission: **"Sending access"**
5. Clique em **"Create"**
6. **COPIE A CHAVE** (começa com `re_...`)

⚠️ **IMPORTANTE:** A chave só aparece uma vez! Guarde-a com cuidado.

---

## 📧 PASSO 3: Verificar Domínio ou Usar Email Compartilhado

### **OPÇÃO A: Usar Email Compartilhado (Mais Rápido)** ✅

Resend oferece um email compartilhado para testes:

```
onboarding@resend.dev
```

**Vantagens:**
- ✅ Funciona imediatamente
- ✅ Sem verificação de domínio
- ✅ Perfeito para testes e pequeno volume

**Limitação:**
- Pode ter deliverability menor (mas ainda boa)
- Marca "via resend.dev" no email

### **OPÇÃO B: Verificar Seu Domínio (Produção)** 🎯

Se você tem um domínio próprio:

1. Acesse: https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `seusite.com`)
4. Adicione os registros DNS fornecidos
5. Aguarde verificação (alguns minutos)

Depois você pode usar emails como:
```
noreply@seusite.com
contato@seusite.com
```

---

## ⚙️ PASSO 4: Configurar no Railway

1. Acesse: https://railway.app
2. Projeto: **filmes-series**
3. Service: **backend**
4. Aba: **Variables**
5. Clique em **"+ New Variable"**

**Adicione:**

```env
RESEND_API_KEY=re_suachaveaqui123456
```

6. Clique em **"Save"**

---

## 🧪 PASSO 5: Testar

Aguarde 1-2 minutos para o Railway fazer redeploy.

Execute:

```bash
curl -X POST https://filmes-series-production.up.railway.app/api/email-test/send \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com"}'
```

Você deve ver:

```json
{
  "configured": true,
  "success": true,
  "message": "✅ Email enviado com sucesso via RESEND!"
}
```

**Verifique seu email** (inbox ou spam)!

---

## 📋 CONFIGURAÇÃO FINAL

### **No Railway Variables:**

```env
# RESEND (Recomendado para produção)
RESEND_API_KEY=re_suachaveaqui

# SMTP Gmail (Opcional - fallback para desenvolvimento local)
EMAIL_USER=julio.bisneto@gmail.com
EMAIL_PASSWORD=awjzxcchxisipzrr

# Frontend URL
FRONTEND_URL=https://filmes-series-chi.vercel.app
```

### **Como funciona:**

1. Se `RESEND_API_KEY` estiver configurada → usa **Resend (API)** ✅
2. Se não, mas `EMAIL_USER` e `EMAIL_PASSWORD` estiverem → usa **SMTP**
3. Se nenhum → não envia emails

---

## 💰 Limites do Plano Gratuito

- ✅ **3.000 emails/mês** grátis
- ✅ **100 emails/dia** grátis
- ✅ Sem cartão de crédito necessário
- ✅ Todos os recursos

Para 99% dos projetos pessoais, isso é **mais que suficiente**!

---

## 🔧 Desenvolvimento Local

No arquivo `.env` local:

```env
# Opção 1: Usar Resend (recomendado)
RESEND_API_KEY=re_suachaveaqui

# Opção 2: Usar SMTP Gmail (funciona local)
EMAIL_USER=seu@gmail.com
EMAIL_PASSWORD=suasenhadeapp
```

Em desenvolvimento local, **SMTP funciona normalmente** (sem bloqueios).

---

## ✅ Pronto!

Agora seu sistema vai enviar emails **perfeitamente** no Railway! 🚀📧
