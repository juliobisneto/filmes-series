# 🔐 Como Criar Senha de App do Google (2026)

## 📍 **Passo a Passo Atualizado**

### **Método 1: Link Direto (Mais Fácil)**

Acesse diretamente este link:
👉 **https://myaccount.google.com/apppasswords**

Se der erro "Não disponível", vá para o Método 2.

---

### **Método 2: Passo a Passo Completo**

#### **1. Ativar Verificação em Duas Etapas (Obrigatório)**

Se ainda não tiver ativado:

1. Acesse: https://myaccount.google.com/security
2. Role até encontrar **"Como fazer login no Google"**
3. Clique em **"Verificação em duas etapas"**
4. Clique em **"Começar"**
5. Siga os passos (vai precisar do seu telefone)
6. Após ativar, **VOLTE** para https://myaccount.google.com/security

#### **2. Acessar Senhas de App**

Após ativar a verificação em duas etapas:

1. Na página https://myaccount.google.com/security
2. Role até a seção **"Como fazer login no Google"**
3. Procure por **"Senhas de app"** ou **"App passwords"**
   - Pode estar em inglês dependendo do idioma da conta
   - Fica ABAIXO de "Verificação em duas etapas"
4. Clique em **"Senhas de app"**

#### **3. Criar a Senha**

1. Você verá um dropdown "Selecionar app"
2. Escolha **"Outro (nome personalizado)"** ou **"Other (custom name)"**
3. Digite: **Filmes & Séries**
4. Clique em **"Gerar"**
5. **COPIE a senha de 16 caracteres** (sem espaços)
6. Cole no `.env` do backend

---

## ⚠️ **Problemas Comuns**

### **"Não consigo ver Senhas de app"**

**Causas:**
1. Verificação em duas etapas NÃO está ativa
2. Conta do Google Workspace gerenciada pela empresa
3. Navegador em modo anônimo/privado

**Soluções:**
- Verifique se a verificação em duas etapas está ATIVA
- Use conta pessoal do Gmail (não corporativa)
- Use navegador normal (não anônimo)

### **"A página diz que não está disponível"**

Se sua conta é corporativa (Google Workspace), o administrador pode ter bloqueado.

**Alternativa:** Use um Gmail pessoal para os testes.

---

## 🆘 **ALTERNATIVA: Use Outro Serviço**

Se não conseguir criar senha de app do Gmail, você pode usar:

### **Opção 1: Outlook/Hotmail**

Configuração mais simples, não precisa de senha de app:

```env
EMAIL_USER=seu-email@outlook.com
EMAIL_PASSWORD=sua-senha-normal
```

Modifique `emailService.js`:
```javascript
this.transporter = nodemailer.createTransport({
  service: 'hotmail',  // Mude de 'gmail' para 'hotmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### **Opção 2: SendGrid (Profissional - Grátis)**

100 emails/dia grátis, mais confiável:

1. Crie conta: https://sendgrid.com
2. Crie API Key
3. Instale: `npm install @sendgrid/mail`

---

## 🎬 **Vídeo Tutorial (Se Precisar)**

Procure no YouTube: **"Como criar senha de app Google 2024"**

Vídeos em português geralmente explicam melhor visualmente.

---

## ✅ **Verificar se Funcionou**

Depois de configurar:

```bash
cd backend
npm run dev
```

Ao enviar uma solicitação de amizade, você deve ver:
```
✅ Email enviado: 👥 Nova Solicitação de Amizade → email@exemplo.com
```

Se aparecer:
```
📧 Email não enviado (não configurado): ...
```

Significa que o `.env` não está correto.

---

## 💡 **Dica Final**

Se estiver tendo muito problema, **não se preocupe!** O sistema funciona perfeitamente SEM emails por enquanto. Você pode:

1. Testar todas as funcionalidades normalmente
2. Configurar emails depois
3. Ou usar Outlook que é mais simples

Os emails são um **extra** para melhorar a experiência, mas não são obrigatórios! 😊

---

**Precisa de ajuda?** Me chame que te ajudo com alternativas!
