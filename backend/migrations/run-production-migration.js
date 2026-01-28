#!/usr/bin/env node

/**
 * Script para executar migration em produção (PostgreSQL Railway)
 * 
 * Este script conecta diretamente ao PostgreSQL usando a DATABASE_URL
 * e executa a migration para criar a tabela friendships.
 * 
 * IMPORTANTE: Certifique-se de ter a variável DATABASE_URL configurada
 * no arquivo .env ou como variável de ambiente.
 * 
 * Para executar:
 * node backend/migrations/run-production-migration.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function runProductionMigration() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 EXECUTANDO MIGRATION EM PRODUÇÃO (Railway PostgreSQL)     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não está configurada!');
    console.error('\nPara executar esta migration em produção, você precisa:');
    console.error('1. Copiar a DATABASE_URL do Railway');
    console.error('2. Criar um arquivo .env.production com:');
    console.error('   DATABASE_URL=postgresql://...');
    console.error('3. Executar: node -r dotenv/config backend/migrations/run-production-migration.js dotenv_config_path=.env.production');
    console.error('\nOu simplesmente execute a migration localmente com o script .js existente.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Conectando ao PostgreSQL...');
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida!\n');

    // Verificar se a tabela já existe
    console.log('🔍 Verificando se a tabela friendships já existe...');
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'friendships'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log('⚠️  A tabela friendships já existe! Nada a fazer.\n');
      
      // Mostrar estrutura da tabela
      console.log('📊 Estrutura atual da tabela:');
      const structure = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'friendships'
        ORDER BY ordinal_position;
      `);
      
      console.table(structure.rows);
      
      await pool.end();
      return;
    }

    console.log('✅ Tabela não existe. Criando...\n');

    // Criar tabela
    console.log('📝 Criando tabela friendships...');
    await pool.query(`
      CREATE TABLE friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        
        CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
        CONSTRAINT no_self_friendship CHECK(user_id != friend_id),
        CONSTRAINT valid_status CHECK(status IN ('pending', 'accepted', 'rejected'))
      );
    `);
    console.log('✅ Tabela criada!\n');

    // Criar índices
    console.log('📝 Criando índices para performance...');
    await pool.query('CREATE INDEX idx_friendships_user ON friendships(user_id);');
    await pool.query('CREATE INDEX idx_friendships_friend ON friendships(friend_id);');
    await pool.query('CREATE INDEX idx_friendships_status ON friendships(status);');
    console.log('✅ Índices criados!\n');

    // Verificar estrutura final
    console.log('📊 Estrutura da tabela criada:');
    const structure = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'friendships'
      ORDER BY ordinal_position;
    `);
    
    console.table(structure.rows);

    // Verificar índices
    console.log('\n📊 Índices criados:');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'friendships';
    `);
    
    indexes.rows.forEach(idx => {
      console.log(`  • ${idx.indexname}`);
    });

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRATION CONCLUÍDA COM SUCESSO!                          ║');
    console.log('║                                                                ║');
    console.log('║  A tabela friendships foi criada em produção.                  ║');
    console.log('║  O sistema de amizades está pronto para uso! 🤝                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERRO ao executar migration:');
    console.error(error.message);
    console.error('\nDetalhes do erro:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
runProductionMigration();
