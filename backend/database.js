const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const backupManager = require('./utils/backup');

const USE_POSTGRES = !!process.env.DATABASE_URL;
const DB_PATH = path.join(__dirname, 'filmes_series.db');

class Database {
  constructor() {
    if (USE_POSTGRES) {
      console.log('🐘 Usando PostgreSQL (Produção)');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      this.initPostgres();
    } else {
      console.log('📁 Usando SQLite (Desenvolvimento)');
      this.ensureBackupBeforeInit();
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Erro ao conectar ao banco de dados:', err.message);
        } else {
          console.log('Conectado ao banco de dados SQLite');
          this.initSQLite();
        }
      });
    }
  }

  ensureBackupBeforeInit() {
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      if (stats.size > 0) {
        console.log('📦 Criando backup de segurança antes de inicializar...');
        try {
          backupManager.createBackup('startup');
        } catch (error) {
          console.error('⚠️  Não foi possível criar backup, mas continuando:', error.message);
        }
      }
    }
  }

  async initPostgres() {
    try {
      // Criar tabelas no PostgreSQL
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          favorite_genres TEXT,
          favorite_movies TEXT,
          favorite_directors TEXT,
          favorite_actors TEXT,
          bio TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
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

      console.log('✅ Tabelas PostgreSQL criadas ou já existem');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas PostgreSQL:', error.message);
    }
  }

  initSQLite() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        favorite_genres TEXT,
        favorite_movies TEXT,
        favorite_directors TEXT,
        favorite_actors TEXT,
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const createMediaTable = `
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('movie', 'series')),
        genre TEXT,
        status TEXT NOT NULL CHECK(status IN ('quero_ver', 'assistindo', 'ja_vi')) DEFAULT 'quero_ver',
        rating INTEGER CHECK(rating >= 0 AND rating <= 5),
        notes TEXT,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_watched DATETIME,
        imdb_id TEXT,
        imdb_rating TEXT,
        poster_url TEXT,
        plot TEXT,
        year TEXT,
        director TEXT,
        actors TEXT,
        runtime TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    this.db.run(createUsersTable);
    this.db.run(createProfilesTable);
    this.db.run(createMediaTable);
    console.log('✅ Tabelas SQLite criadas ou já existem');
  }

  // Método genérico para executar queries
  run(sql, params = []) {
    if (USE_POSTGRES) {
      // Converter placeholders ? para $1, $2, etc
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
      
      return this.pool.query(pgSql, params).then(result => ({
        id: result.rows[0]?.id,
        changes: result.rowCount
      }));
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, changes: this.changes });
          }
        });
      });
    }
  }

  // Buscar um registro
  get(sql, params = []) {
    if (USE_POSTGRES) {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
      
      return this.pool.query(pgSql, params).then(result => result.rows[0]);
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    }
  }

  // Buscar múltiplos registros
  all(sql, params = []) {
    if (USE_POSTGRES) {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
      
      return this.pool.query(pgSql, params).then(result => result.rows);
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  // Fechar conexão
  close() {
    if (USE_POSTGRES) {
      return this.pool.end();
    } else {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

module.exports = new Database();
