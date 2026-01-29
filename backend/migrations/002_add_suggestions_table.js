const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
require('dotenv').config();

async function addSuggestionsTable() {
  console.log('\n💡 Criando tabela de sugestões (suggestions)...\n');

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
          WHERE table_name = 'suggestions'
        );
      `);

      if (!checkTable.rows[0].exists) {
        await pool.query(`
          CREATE TABLE suggestions (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            media_id INTEGER NOT NULL,
            message TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            responded_at TIMESTAMP,
            
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
            
            CONSTRAINT unique_suggestion UNIQUE(sender_id, receiver_id, media_id),
            CONSTRAINT valid_suggestion_status CHECK(status IN ('pending', 'accepted', 'rejected'))
          );
        `);

        await pool.query(`
          CREATE INDEX idx_suggestions_receiver_status ON suggestions(receiver_id, status);
        `);

        await pool.query(`
          CREATE INDEX idx_suggestions_sender ON suggestions(sender_id);
        `);

        await pool.query(`
          CREATE INDEX idx_suggestions_media ON suggestions(media_id);
        `);

        console.log('✅ Tabela suggestions criada no PostgreSQL!');
      } else {
        console.log('✅ Tabela suggestions já existe no PostgreSQL!');
      }
    } else {
      // SQLite
      await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='suggestions'", (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            db.run(`
              CREATE TABLE suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                media_id INTEGER NOT NULL,
                message TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                responded_at DATETIME,
                
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
                
                UNIQUE(sender_id, receiver_id, media_id)
              )
            `, (err) => {
              if (err) reject(err);
              else {
                // Criar índices
                db.run('CREATE INDEX idx_suggestions_receiver_status ON suggestions(receiver_id, status)');
                db.run('CREATE INDEX idx_suggestions_sender ON suggestions(sender_id)');
                db.run('CREATE INDEX idx_suggestions_media ON suggestions(media_id)');
                console.log('✅ Tabela suggestions criada no SQLite!');
                resolve();
              }
            });
          } else {
            console.log('✅ Tabela suggestions já existe no SQLite!');
            resolve();
          }
        });
      });
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ MIGRAÇÃO CONCLUÍDA!               ║');
    console.log('║                                        ║');
    console.log('║  Tabela "suggestions" disponível!      ║');
    console.log('║                                        ║');
    console.log('║  Campos criados:                       ║');
    console.log('║  • id (chave primária)                 ║');
    console.log('║  • sender_id (quem sugeriu)            ║');
    console.log('║  • receiver_id (quem recebeu)          ║');
    console.log('║  • media_id (filme sugerido)           ║');
    console.log('║  • message (mensagem opcional)         ║');
    console.log('║  • status (pending/accepted/rejected)  ║');
    console.log('║  • created_at                          ║');
    console.log('║  • responded_at                        ║');
    console.log('║                                        ║');
    console.log('║  Constraints:                          ║');
    console.log('║  • UNIQUE(sender, receiver, media)     ║');
    console.log('║  • Foreign keys com CASCADE            ║');
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

addSuggestionsTable();
