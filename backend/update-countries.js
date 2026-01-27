require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const axios = require('axios');

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'http://www.omdbapi.com/';
const USE_POSTGRES = !!process.env.DATABASE_URL;

// Verificar se é execução forçada em produção
const FORCE_PRODUCTION = process.argv.includes('--production');

// Delay entre requisições para não sobrecarregar a API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateCountries() {
  console.log('\n🌍 Atualizando países de todos os filmes/séries...\n');

  if (!OMDB_API_KEY || OMDB_API_KEY === 'your_api_key_here') {
    console.error('❌ OMDB_API_KEY não configurada no .env');
    process.exit(1);
  }

  let db, pool;

  try {
    if (USE_POSTGRES) {
      if (!FORCE_PRODUCTION) {
        console.error('\n❌ ATENÇÃO: DATABASE_URL detectada (PostgreSQL)!');
        console.error('Para rodar em PRODUÇÃO, use: node update-countries.js --production');
        console.error('Isso atualizará o banco de dados REAL na nuvem!\n');
        process.exit(1);
      }

      console.log('🐘 Usando PostgreSQL (Produção)');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      console.log('📁 Usando SQLite (Desenvolvimento)');
      db = new sqlite3.Database('./filmes_series.db');
    }

    // Buscar todos os filmes/séries
    let media;
    
    if (USE_POSTGRES) {
      const result = await pool.query('SELECT id, title, imdb_id, country FROM media');
      media = result.rows;
    } else {
      media = await new Promise((resolve, reject) => {
        db.all('SELECT id, title, imdb_id, country FROM media', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    console.log(`📊 Total de filmes/séries: ${media.length}\n`);

    let updated = 0;
    let alreadyHas = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      const progress = `[${i + 1}/${media.length}]`;

      // Se já tem país, pular
      if (item.country && item.country.trim()) {
        console.log(`${progress} ⏭️  ${item.title} - já tem país: ${item.country}`);
        alreadyHas++;
        continue;
      }

      try {
        let country = null;

        // Tentar buscar por IMDB ID primeiro (mais preciso)
        if (item.imdb_id) {
          console.log(`${progress} 🔍 Buscando ${item.title} por IMDB ID...`);
          
          const response = await axios.get(OMDB_BASE_URL, {
            params: {
              apikey: OMDB_API_KEY,
              i: item.imdb_id
            }
          });

          if (response.data.Response === 'True' && response.data.Country !== 'N/A') {
            country = response.data.Country;
          }
        } 
        // Se não tem IMDB ID ou não encontrou, tentar por título
        else {
          console.log(`${progress} 🔍 Buscando ${item.title} por título...`);
          
          const response = await axios.get(OMDB_BASE_URL, {
            params: {
              apikey: OMDB_API_KEY,
              t: item.title
            }
          });

          if (response.data.Response === 'True' && response.data.Country !== 'N/A') {
            country = response.data.Country;
          }
        }

        if (country) {
          // Atualizar no banco
          if (USE_POSTGRES) {
            await pool.query('UPDATE media SET country = $1 WHERE id = $2', [country, item.id]);
          } else {
            await new Promise((resolve, reject) => {
              db.run('UPDATE media SET country = ? WHERE id = ?', [country, item.id], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }

          console.log(`${progress} ✅ ${item.title} → ${country}`);
          updated++;
        } else {
          console.log(`${progress} ⚠️  ${item.title} - país não encontrado`);
          notFound++;
        }

        // Delay de 250ms entre requisições (máximo 4 req/s)
        await delay(250);

      } catch (error) {
        console.log(`${progress} ❌ Erro ao buscar ${item.title}: ${error.message}`);
        errors++;
        
        // Delay maior em caso de erro
        await delay(1000);
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  📊 ATUALIZAÇÃO CONCLUÍDA!            ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  ✅ Atualizados:     ${String(updated).padStart(3)}              ║`);
    console.log(`║  ⏭️  Já tinham país: ${String(alreadyHas).padStart(3)}              ║`);
    console.log(`║  ⚠️  Não encontrado: ${String(notFound).padStart(3)}              ║`);
    console.log(`║  ❌ Erros:           ${String(errors).padStart(3)}              ║`);
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    if (db) db.close();
    if (pool) await pool.end();
  }
}

updateCountries();
