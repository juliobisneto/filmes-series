const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

async function addFriendshipsTable() {
  console.log('\n🤝 Criando tabela de amizades (friendships)...\n');

  let db;
  let pool;
  let isPostgres = false;

  if (process.env.DATABASE_URL) {
    isPostgres = true;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('🐘 Usando PostgreSQL (Produção)');
  } else {
    db = new sqlite3.Database('./filmes_series.db');
    console.log('📦 Usando SQLite (Local)');
  }

  try {
    if (isPostgres) {
      // PostgreSQL
      const checkTable = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'friendships'
        );
      `);

      if (!checkTable.rows[0].exists) {
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
            
            UNIQUE(user_id, friend_id),
            CHECK(user_id != friend_id)
          );
        `);

        await pool.query(`
          CREATE INDEX idx_friendships_user ON friendships(user_id);
        `);

        await pool.query(`
          CREATE INDEX idx_friendships_friend ON friendships(friend_id);
        `);

        await pool.query(`
          CREATE INDEX idx_friendships_status ON friendships(status);
        `);

        console.log('✅ Tabela friendships criada no PostgreSQL!');
      } else {
        console.log('✅ Tabela friendships já existe no PostgreSQL!');
      }
    } else {
      // SQLite
      await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='friendships'", (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            db.run(`
              CREATE TABLE friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
                
                UNIQUE(user_id, friend_id),
                CHECK(user_id != friend_id)
              )
            `, (err) => {
              if (err) reject(err);
              else {
                // Criar índices
                db.run('CREATE INDEX idx_friendships_user ON friendships(user_id)');
                db.run('CREATE INDEX idx_friendships_friend ON friendships(friend_id)');
                db.run('CREATE INDEX idx_friendships_status ON friendships(status)');
                console.log('✅ Tabela friendships criada no SQLite!');
                resolve();
              }
            });
          } else {
            console.log('✅ Tabela friendships já existe no SQLite!');
            resolve();
          }
        });
      });
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ MIGRAÇÃO CONCLUÍDA!               ║');
    console.log('║                                        ║');
    console.log('║  Tabela "friendships" disponível!      ║');
    console.log('║                                        ║');
    console.log('║  Campos criados:                       ║');
    console.log('║  • id (chave primária)                 ║');
    console.log('║  • user_id (quem enviou)               ║');
    console.log('║  • friend_id (quem recebeu)            ║');
    console.log('║  • status (pending/accepted/rejected)  ║');
    console.log('║  • created_at                          ║');
    console.log('║  • updated_at                          ║');
    console.log('║                                        ║');
    console.log('║  Constraints:                          ║');
    console.log('║  • UNIQUE(user_id, friend_id)          ║');
    console.log('║  • CHECK(user_id != friend_id)         ║');
    console.log('║                                        ║');
    console.log('║  Índices criados para performance!     ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar tabela:', error.message);
    process.exit(1);
  } finally {
    if (db) db.close();
    if (pool) await pool.end();
  }
}

addFriendshipsTable();
