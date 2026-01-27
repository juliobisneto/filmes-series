require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não configurada no .env');
  console.error('📋 Adicione a variável DATABASE_URL do Railway no arquivo .env');
  process.exit(1);
}

// Conexões
const sqliteDb = new sqlite3.Database('./filmes_series.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  console.log('\n🚀 Iniciando migração de SQLite para PostgreSQL...\n');

  try {
    // 1. Criar tabelas no PostgreSQL
    console.log('📋 Criando tabelas no PostgreSQL...');
    
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        favorite_genres TEXT,
        favorite_movies TEXT,
        favorite_directors TEXT,
        favorite_actors TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        genre VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        rating INTEGER,
        notes TEXT,
        date_watched DATE,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        imdb_id VARCHAR(50),
        imdb_rating VARCHAR(10),
        poster_url TEXT,
        plot TEXT,
        year VARCHAR(10),
        director VARCHAR(255),
        actors TEXT,
        runtime VARCHAR(50)
      );
    `);

    console.log('✅ Tabelas criadas com sucesso!\n');

    // 2. Migrar usuários
    console.log('👥 Migrando usuários...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const userIdMap = {}; // Mapear IDs antigos para novos

    for (const user of users) {
      const result = await pgPool.query(
        'INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET name = $3 RETURNING id',
        [user.email, user.password, user.name, user.created_at]
      );
      userIdMap[user.id] = result.rows[0].id;
      console.log(`  ✓ Usuário migrado: ${user.email} (ID: ${user.id} → ${result.rows[0].id})`);
    }

    console.log(`✅ ${users.length} usuário(s) migrado(s)!\n`);

    // 3. Migrar perfis
    console.log('👤 Migrando perfis de usuários...');
    const profiles = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM user_profiles', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const profile of profiles) {
      const newUserId = userIdMap[profile.user_id];
      await pgPool.query(
        'INSERT INTO user_profiles (user_id, favorite_genres, favorite_movies, favorite_directors, favorite_actors, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [newUserId, profile.favorite_genres, profile.favorite_movies, profile.favorite_directors, profile.favorite_actors, profile.updated_at]
      );
      console.log(`  ✓ Perfil migrado para usuário ID: ${newUserId}`);
    }

    console.log(`✅ ${profiles.length} perfil(s) migrado(s)!\n`);

    // 4. Migrar filmes e séries
    console.log('🎬 Migrando filmes e séries...');
    const media = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM media', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of media) {
      const newUserId = userIdMap[item.user_id];
      await pgPool.query(
        `INSERT INTO media (user_id, title, type, genre, status, rating, notes, date_watched, date_added, imdb_id, imdb_rating, poster_url, plot, year, director, actors, runtime) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          newUserId,
          item.title,
          item.type,
          item.genre,
          item.status,
          item.rating,
          item.notes,
          item.date_watched,
          item.date_added,
          item.imdb_id,
          item.imdb_rating,
          item.poster_url,
          item.plot,
          item.year,
          item.director,
          item.actors,
          item.runtime
        ]
      );
      console.log(`  ✓ Filme/Série migrado: ${item.title}`);
    }

    console.log(`✅ ${media.length} filme(s)/série(s) migrado(s)!\n`);

    // 5. Verificar totais
    console.log('🔍 Verificando migração...');
    const { rows: [{ count: usersCount }] } = await pgPool.query('SELECT COUNT(*) as count FROM users');
    const { rows: [{ count: mediaCount }] } = await pgPool.query('SELECT COUNT(*) as count FROM media');
    const { rows: [{ count: profilesCount }] } = await pgPool.query('SELECT COUNT(*) as count FROM user_profiles');

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!   ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║  👥 Usuários:        ${String(usersCount).padStart(3)} migrados    ║`);
    console.log(`║  👤 Perfis:          ${String(profilesCount).padStart(3)} migrados    ║`);
    console.log(`║  🎬 Filmes/Séries:   ${String(mediaCount).padStart(3)} migrados    ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate();
