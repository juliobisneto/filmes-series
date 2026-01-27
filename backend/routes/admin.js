const express = require('express');
const router = express.Router();
const db = require('../database');
const { adminMiddleware } = require('../middleware/admin');

// Todas as rotas de admin precisam do middleware de admin
router.use(adminMiddleware);

// GET - Estatísticas gerais de usuários
router.get('/stats', async (req, res) => {
  try {
    // Total de usuários
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    
    // Estatísticas por usuário (nome + quantidade de filmes)
    const userStats = await db.all(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(m.id) as total_movies
      FROM users u
      LEFT JOIN media m ON u.id = m.user_id
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY total_movies DESC, u.created_at DESC
    `);

    // Processar dados para mostrar apenas primeiro nome
    const processedStats = userStats.map(user => ({
      id: user.id,
      firstName: user.name.split(' ')[0], // Apenas primeiro nome
      totalMovies: user.total_movies,
      memberSince: user.created_at,
      isAdmin: user.email === 'julio.bisneto@gmail.com'
    }));

    // Estatísticas gerais
    const totalMovies = await db.get('SELECT COUNT(*) as count FROM media');
    const moviesPerUser = userStats.length > 0 
      ? (totalMovies.count / userStats.length).toFixed(1)
      : 0;

    // Usuário com mais filmes
    const topUser = userStats.length > 0 ? userStats[0] : null;

    res.json({
      success: true,
      data: {
        general: {
          totalUsers: totalUsers.count,
          totalMovies: totalMovies.count,
          averageMoviesPerUser: parseFloat(moviesPerUser),
          topUser: topUser ? {
            firstName: topUser.name.split(' ')[0],
            totalMovies: topUser.total_movies
          } : null
        },
        users: processedStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de usuários' });
  }
});

// GET - Verificar se usuário atual é admin
router.get('/check', async (req, res) => {
  try {
    // Se chegou aqui, passou pelo adminMiddleware, então é admin
    res.json({
      success: true,
      isAdmin: true,
      email: req.userEmail
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
});

module.exports = router;
