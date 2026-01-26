const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// Proteger todas as rotas de media
router.use(authMiddleware);

// GET - Listar todos os filmes/séries do usuário logado
router.get('/', async (req, res) => {
  try {
    const { status, type, genre } = req.query;
    let sql = 'SELECT * FROM media WHERE user_id = ?';
    const params = [req.userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (genre) {
      sql += ' AND genre LIKE ?';
      params.push(`%${genre}%`);
    }

    // Ordenar por: 
    // 1. Status "quero_ver" primeiro
    // 2. Status "assistindo" segundo
    // 3. Status "ja_vi" por último (ordenados por data)
    sql += ` ORDER BY 
      CASE status 
        WHEN 'quero_ver' THEN 1 
        WHEN 'assistindo' THEN 2 
        WHEN 'ja_vi' THEN 3 
      END,
      CASE 
        WHEN status = 'ja_vi' THEN COALESCE(date_watched, date_added)
        ELSE date_added
      END DESC
    `;

    const media = await db.all(sql, params);
    res.json(media);
  } catch (error) {
    console.error('Erro ao buscar media:', error);
    res.status(500).json({ error: 'Erro ao buscar filmes/séries' });
  }
});

// GET - Buscar por ID (apenas do usuário logado)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const media = await db.get(
      'SELECT * FROM media WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!media) {
      return res.status(404).json({ error: 'Filme/Série não encontrado' });
    }

    res.json(media);
  } catch (error) {
    console.error('Erro ao buscar media:', error);
    res.status(500).json({ error: 'Erro ao buscar filme/série' });
  }
});

// GET - Buscar localmente por título (apenas do usuário logado)
router.get('/search/local', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parâmetro de busca (q) é obrigatório' });
    }

    const sql = `
      SELECT * FROM media 
      WHERE user_id = ?
      AND (title LIKE ? OR actors LIKE ? OR director LIKE ?)
      ORDER BY 
        CASE status 
          WHEN 'quero_ver' THEN 1 
          WHEN 'assistindo' THEN 2 
          WHEN 'ja_vi' THEN 3 
        END,
        date_added DESC
    `;
    
    const searchTerm = `%${q}%`;
    const media = await db.all(sql, [req.userId, searchTerm, searchTerm, searchTerm]);
    
    res.json(media);
  } catch (error) {
    console.error('Erro ao buscar media:', error);
    res.status(500).json({ error: 'Erro ao buscar filmes/séries' });
  }
});

// POST - Cadastrar novo filme/série (associado ao usuário logado)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      type,
      genre,
      status,
      rating,
      notes,
      date_watched,
      imdb_id,
      imdb_rating,
      poster_url,
      plot,
      year,
      director,
      actors,
      runtime
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Título e tipo são obrigatórios' });
    }

    const sql = `
      INSERT INTO media (
        user_id, title, type, genre, status, rating, notes, date_watched,
        imdb_id, imdb_rating, poster_url, plot, year, director, actors, runtime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      req.userId, // Associar ao usuário logado
      title,
      type,
      genre || null,
      status || 'quero_ver',
      rating || null,
      notes || null,
      date_watched || null,
      imdb_id || null,
      imdb_rating || null,
      poster_url || null,
      plot || null,
      year || null,
      director || null,
      actors || null,
      runtime || null
    ];

    const result = await db.run(sql, params);
    const newMedia = await db.get('SELECT * FROM media WHERE id = ?', [result.id]);
    
    res.status(201).json(newMedia);
  } catch (error) {
    console.error('Erro ao cadastrar media:', error);
    res.status(500).json({ error: 'Erro ao cadastrar filme/série' });
  }
});

// PUT - Atualizar filme/série (apenas do usuário logado)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      genre,
      status,
      rating,
      notes,
      date_watched,
      imdb_id,
      imdb_rating,
      poster_url,
      plot,
      year,
      director,
      actors,
      runtime
    } = req.body;

    // Verificar se o registro existe e pertence ao usuário
    const existing = await db.get(
      'SELECT * FROM media WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Filme/Série não encontrado' });
    }

    const sql = `
      UPDATE media SET
        title = ?,
        type = ?,
        genre = ?,
        status = ?,
        rating = ?,
        notes = ?,
        date_watched = ?,
        imdb_id = ?,
        imdb_rating = ?,
        poster_url = ?,
        plot = ?,
        year = ?,
        director = ?,
        actors = ?,
        runtime = ?
      WHERE id = ? AND user_id = ?
    `;

    const params = [
      title !== undefined ? title : existing.title,
      type !== undefined ? type : existing.type,
      genre !== undefined ? genre : existing.genre,
      status !== undefined ? status : existing.status,
      rating !== undefined ? rating : existing.rating,
      notes !== undefined ? notes : existing.notes,
      date_watched !== undefined ? date_watched : existing.date_watched,
      imdb_id !== undefined ? imdb_id : existing.imdb_id,
      imdb_rating !== undefined ? imdb_rating : existing.imdb_rating,
      poster_url !== undefined ? poster_url : existing.poster_url,
      plot !== undefined ? plot : existing.plot,
      year !== undefined ? year : existing.year,
      director !== undefined ? director : existing.director,
      actors !== undefined ? actors : existing.actors,
      runtime !== undefined ? runtime : existing.runtime,
      id,
      req.userId
    ];

    await db.run(sql, params);
    const updatedMedia = await db.get('SELECT * FROM media WHERE id = ?', [id]);
    
    res.json(updatedMedia);
  } catch (error) {
    console.error('Erro ao atualizar media:', error);
    res.status(500).json({ error: 'Erro ao atualizar filme/série' });
  }
});

// DELETE - Remover filme/série (apenas do usuário logado)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se existe e pertence ao usuário
    const existing = await db.get(
      'SELECT * FROM media WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Filme/Série não encontrado' });
    }

    await db.run('DELETE FROM media WHERE id = ? AND user_id = ?', [id, req.userId]);
    res.json({ message: 'Filme/Série removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover media:', error);
    res.status(500).json({ error: 'Erro ao remover filme/série' });
  }
});

module.exports = router;
