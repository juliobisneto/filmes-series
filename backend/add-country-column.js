require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const USE_POSTGRES = !!process.env.DATABASE_URL;

async function addCountryColumn() {
  console.log('\n🔧 Adicionando coluna "country" ao banco de dados...\n');

  try {
    if (USE_POSTGRES) {
      console.log('🐘 Usando PostgreSQL (Produção)');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      const { rows } = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='media' AND column_name='country';
      `);

      if (rows.length > 0) {
        console.log('✅ Coluna "country" já existe no PostgreSQL!');
      } else {
        await pool.query('ALTER TABLE media ADD COLUMN country VARCHAR(255);');
        console.log('✅ Coluna "country" adicionada ao PostgreSQL!');
      }

      await pool.end();
    } else {
      console.log('📁 Usando SQLite (Desenvolvimento)');
      const db = new sqlite3.Database('./filmes_series.db');

      await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(media);", (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          const hasCountry = rows.some(col => col.name === 'country');

          if (hasCountry) {
            console.log('✅ Coluna "country" já existe no SQLite!');
            resolve();
          } else {
            db.run("ALTER TABLE media ADD COLUMN country TEXT;", (err) => {
              if (err) {
                reject(err);
              } else {
                console.log('✅ Coluna "country" adicionada ao SQLite!');
                resolve();
              }
            });
          }
        });
      });

      db.close();
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ MIGRAÇÃO CONCLUÍDA!               ║');
    console.log('║                                        ║');
    console.log('║  Coluna "country" disponível!          ║');
    console.log('║                                        ║');
    console.log('║  Agora filmes podem ter país de origem ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

addCountryColumn();
