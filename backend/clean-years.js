require('dotenv').config();
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

// Função para limpar o ano (remover hífens e caracteres extras)
const cleanYear = (yearString) => {
  if (!yearString) return null;
  const match = yearString.match(/\d{4}/); // Extrai apenas os 4 dígitos do ano
  return match ? match[0] : yearString;
};

async function cleanYears() {
  console.log('\n🧹 Limpando anos no banco de dados...\n');

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
    // Buscar todos os filmes/séries que tem ano com hífen ou caracteres extras
    let media;
    if (isPostgres) {
      const res = await pool.query("SELECT id, title, year FROM media WHERE year LIKE '%–%' OR year LIKE '%-%' OR LENGTH(year) > 4");
      media = res.rows;
    } else {
      media = await new Promise((resolve, reject) => {
        db.all("SELECT id, title, year FROM media WHERE year LIKE '%–%' OR year LIKE '%-%' OR LENGTH(year) > 4", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    console.log(`📊 Total de anos para limpar: ${media.length}\n`);

    if (media.length === 0) {
      console.log('✅ Nenhum ano precisa ser limpo!\n');
      return;
    }

    let updated = 0;

    for (const item of media) {
      const cleanedYear = cleanYear(item.year);
      
      if (cleanedYear !== item.year) {
        // Atualizar no banco
        if (isPostgres) {
          await pool.query(
            'UPDATE media SET year = $1 WHERE id = $2',
            [cleanedYear, item.id]
          );
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE media SET year = ? WHERE id = ?',
              [cleanedYear, item.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        console.log(`✅ ${item.title}: "${item.year}" → "${cleanedYear}"`);
        updated++;
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ LIMPEZA CONCLUÍDA!                ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  📊 Atualizados: ${String(updated).padStart(3)}                   ║`);
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (db) db.close();
    if (pool) await pool.end();
  }
}

cleanYears();
