const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'filmes_series.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

class BackupManager {
  constructor() {
    // Garantir que a pasta de backups existe
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Cria um backup do banco de dados
   * @param {string} reason - Motivo do backup (opcional)
   * @returns {Promise<string>} - Caminho do arquivo de backup criado
   */
  async createBackup(reason = 'manual') {
    try {
      // Verificar se o banco existe
      if (!fs.existsSync(DB_PATH)) {
        console.log('⚠️  Banco de dados não existe ainda. Backup não necessário.');
        return null;
      }

      // Nome do arquivo de backup com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `filmes_series_${timestamp}_${reason}.db`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);

      // Copiar o arquivo
      fs.copyFileSync(DB_PATH, backupPath);

      const stats = fs.statSync(backupPath);
      console.log(`✅ Backup criado: ${backupFileName} (${(stats.size / 1024).toFixed(2)} KB)`);
      console.log(`📁 Local: ${backupPath}`);

      // Limpar backups antigos (manter últimos 10)
      this.cleanOldBackups();

      return backupPath;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      throw error;
    }
  }

  /**
   * Remove backups antigos, mantendo apenas os últimos N
   * @param {number} keepLast - Quantidade de backups a manter (padrão: 10)
   */
  cleanOldBackups(keepLast = 10) {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(BACKUP_DIR, file),
          time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Mais recentes primeiro

      // Se houver mais backups que o limite, remover os mais antigos
      if (files.length > keepLast) {
        const toDelete = files.slice(keepLast);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Backup antigo removido: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('⚠️  Erro ao limpar backups antigos:', error.message);
    }
  }

  /**
   * Lista todos os backups disponíveis
   * @returns {Array} - Lista de backups com informações
   */
  listBackups() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            created: stats.mtime.toLocaleString('pt-BR')
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error.message);
      return [];
    }
  }

  /**
   * Restaura um backup específico
   * @param {string} backupFileName - Nome do arquivo de backup
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async restoreBackup(backupFileName) {
    try {
      const backupPath = path.join(BACKUP_DIR, backupFileName);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup não encontrado');
      }

      // Criar backup do estado atual antes de restaurar
      await this.createBackup('pre-restore');

      // Restaurar o backup
      fs.copyFileSync(backupPath, DB_PATH);

      console.log(`✅ Backup restaurado: ${backupFileName}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      throw error;
    }
  }
}

module.exports = new BackupManager();
