require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetPassword() {
  try {
    console.log('\n🔐 Resetando senha do usuário...\n');

    const email = 'julio.bisneto@gmail.com';
    const newPassword = 'Chico01';

    // Verificar se usuário existe
    const { rows } = await pgPool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      process.exit(1);
    }

    console.log('✅ Usuário encontrado:');
    console.log(`   ID:    ${rows[0].id}`);
    console.log(`   Email: ${rows[0].email}`);
    console.log(`   Nome:  ${rows[0].name}`);
    console.log('');

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await pgPool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    console.log('✅ Senha atualizada com sucesso!');
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║  🔐 NOVAS CREDENCIAIS:                ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Email: julio.bisneto@gmail.com       ║');
    console.log('║  Senha: Chico01                       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

resetPassword();
