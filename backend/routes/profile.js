const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas de perfil precisam de autenticação
router.use(authMiddleware);

// Obter perfil do usuário logado
router.get('/', async (req, res) => {
  try {
    const profile = await db.get(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );

    if (!profile) {
      // Criar perfil se não existir
      await db.run('INSERT INTO user_profiles (user_id) VALUES (?)', [req.userId]);
      const newProfile = await db.get(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [req.userId]
      );
      return res.json(newProfile);
    }

    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Atualizar perfil do usuário
router.put('/', async (req, res) => {
  try {
    const { favorite_genres, favorite_movies, favorite_directors, favorite_actors, bio } = req.body;

    // Verificar se perfil existe
    const existingProfile = await db.get(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );

    if (!existingProfile) {
      // Criar perfil se não existir
      await db.run('INSERT INTO user_profiles (user_id) VALUES (?)', [req.userId]);
    }

    // Atualizar perfil
    await db.run(
      `UPDATE user_profiles SET 
        favorite_genres = ?,
        favorite_movies = ?,
        favorite_directors = ?,
        favorite_actors = ?,
        bio = ?
      WHERE user_id = ?`,
      [
        favorite_genres || null,
        favorite_movies || null,
        favorite_directors || null,
        favorite_actors || null,
        bio || null,
        req.userId
      ]
    );

    const updatedProfile = await db.get(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.userId]
    );

    res.json({
      message: 'Perfil atualizado com sucesso',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Obter informações do usuário
router.get('/user', async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

module.exports = router;
