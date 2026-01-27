const { authMiddleware } = require('./auth');

// Middleware para verificar se o usuário é administrador
const adminMiddleware = async (req, res, next) => {
  try {
    // Primeiro verificar autenticação
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verificar se o email é do admin
    const ADMIN_EMAIL = 'julio.bisneto@gmail.com';
    
    if (req.userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        error: 'Acesso negado. Esta área é restrita ao administrador.' 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
};

module.exports = { adminMiddleware };
