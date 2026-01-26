const express = require('express');
const router = express.Router();
const backupManager = require('../utils/backup');
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas de backup requerem autenticação
router.use(authMiddleware);

// POST - Criar backup manual
router.post('/create', async (req, res) => {
  try {
    const { reason } = req.body;
    const backupPath = await backupManager.createBackup(reason || 'manual');
    
    if (!backupPath) {
      return res.status(400).json({ 
        error: 'Banco de dados não existe ainda' 
      });
    }

    res.json({ 
      message: 'Backup criado com sucesso',
      backup: backupPath
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro ao criar backup' });
  }
});

// GET - Listar todos os backups
router.get('/list', (req, res) => {
  try {
    const backups = backupManager.listBackups();
    res.json({ backups });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
});

// POST - Restaurar um backup específico
router.post('/restore', async (req, res) => {
  try {
    const { backupFileName } = req.body;

    if (!backupFileName) {
      return res.status(400).json({ 
        error: 'Nome do arquivo de backup é obrigatório' 
      });
    }

    await backupManager.restoreBackup(backupFileName);
    
    res.json({ 
      message: 'Backup restaurado com sucesso',
      warning: 'O servidor precisa ser reiniciado para aplicar as mudanças'
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao restaurar backup' 
    });
  }
});

module.exports = router;
