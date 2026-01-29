// Script para trocar senha de usuário
const bcrypt = require('bcryptjs');
const db = require('./database');

async function changePassword(email, newPassword) {
  try {
    // Verificar se usuário existe
    const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (!user) {
      console.error(`❌ Usuário não encontrado: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    console.log(`✅ Senha alterada com sucesso para: ${user.email}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao trocar senha:', error);
    process.exit(1);
  }
}

// Pegar email e senha dos argumentos
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ Uso: node change-password.js <email> <nova-senha>');
  console.error('   Exemplo: node change-password.js usuario@email.com MinhaNovaSenh@123');
  process.exit(1);
}

// Executar
changePassword(email, newPassword);
