const { Pool } = require('pg');
require('dotenv').config();

async function addBioColumn() {
  console.log('\n🔧 Adicionando coluna "bio" à tabela user_profiles...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada no .env');
    console.log('Este script é apenas para PostgreSQL (produção)');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Verificar se a coluna já existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='user_profiles' AND column_name='bio';
    `);

    if (checkColumn.rows.length === 0) {
      // Adicionar coluna bio
      await pool.query('ALTER TABLE user_profiles ADD COLUMN bio TEXT;');
      console.log('✅ Coluna "bio" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "bio" já existe!');
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ MIGRAÇÃO CONCLUÍDA!               ║');
    console.log('║                                        ║');
    console.log('║  A coluna "bio" está disponível!       ║');
    console.log('║  Agora você pode salvar biografias.    ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro ao adicionar coluna:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addBioColumn();
