const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const backupManager = require('./utils/backup');

const DB_PATH = path.join(__dirname, 'filmes_series.db');

class Database {
  constructor() {
    // Fazer backup antes de conectar (se o banco existir)
    this.ensureBackupBeforeInit();
    
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
      } else {
        console.log('Conectado ao banco de dados SQLite');
        this.initDatabase();
      }
    });
  }

  ensureBackupBeforeInit() {
    // Se o banco já existe, criar backup de segurança
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      // Só faz backup se o arquivo tiver conteúdo (> 0 bytes)
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

  initDatabase() {
    // Tabela de usuários
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tabela de perfis de usuário
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

    // Tabela de filmes/séries
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

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Erro ao criar tabela users:', err.message);
      } else {
        console.log('Tabela users criada ou já existe');
      }
    });

    this.db.run(createProfilesTable, (err) => {
      if (err) {
        console.error('Erro ao criar tabela user_profiles:', err.message);
      } else {
        console.log('Tabela user_profiles criada ou já existe');
      }
    });

    this.db.run(createMediaTable, (err) => {
      if (err) {
        console.error('Erro ao criar tabela media:', err.message);
      } else {
        console.log('Tabela media criada ou já existe');
      }
    });
  }

  // Método genérico para executar queries
  run(sql, params = []) {
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

  // Buscar um registro
  get(sql, params = []) {
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

  // Buscar múltiplos registros
  all(sql, params = []) {
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

  // Fechar conexão
  close() {
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

module.exports = new Database();
