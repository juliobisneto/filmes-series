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
    res.json({ success: true, data: media });
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

    res.json({ success: true, data: media });
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
      AND (
        LOWER(title) LIKE LOWER(?) 
        OR LOWER(actors) LIKE LOWER(?) 
        OR LOWER(director) LIKE LOWER(?)
      )
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
    
    res.json({ success: true, data: media });
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
      runtime,
      country
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Título e tipo são obrigatórios' });
    }

    // Verificação de duplicatas - 3 níveis
    let existingMedia = null;

    // 1. Verificar por IMDB ID (mais confiável)
    if (imdb_id) {
      existingMedia = await db.get(
        'SELECT id, title, year FROM media WHERE user_id = ? AND imdb_id = ?',
        [req.userId, imdb_id]
      );
      
      if (existingMedia) {
        return res.status(409).json({ 
          error: 'Este filme/série já está na sua biblioteca',
          duplicate: {
            id: existingMedia.id,
            title: existingMedia.title,
            year: existingMedia.year,
            matchedBy: 'imdb_id'
          }
        });
      }
    }

    // 2. Verificar por Título + Ano
    if (year) {
      existingMedia = await db.get(
        'SELECT id, title, year FROM media WHERE user_id = ? AND LOWER(title) = LOWER(?) AND year = ?',
        [req.userId, title, year]
      );
      
      if (existingMedia) {
        return res.status(409).json({ 
          error: 'Este filme/série já está na sua biblioteca',
          duplicate: {
            id: existingMedia.id,
            title: existingMedia.title,
            year: existingMedia.year,
            matchedBy: 'title_and_year'
          }
        });
      }
    }

    // 3. Verificar por Título exato (case-insensitive)
    existingMedia = await db.get(
      'SELECT id, title, year FROM media WHERE user_id = ? AND LOWER(title) = LOWER(?)',
      [req.userId, title]
    );
    
    if (existingMedia) {
      return res.status(409).json({ 
        error: 'Um filme/série com este título já está na sua biblioteca',
        duplicate: {
          id: existingMedia.id,
          title: existingMedia.title,
          year: existingMedia.year,
          matchedBy: 'title',
          warning: 'Se for um filme diferente com o mesmo título, considere adicionar o ano para diferenciar'
        }
      });
    }

    // Se não encontrou duplicata, prosseguir com o cadastro
    const sql = `
      INSERT INTO media (
        user_id, title, type, genre, status, rating, notes, date_watched,
        imdb_id, imdb_rating, poster_url, plot, year, director, actors, runtime, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
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
      runtime || null,
      country || null
    ];

    const result = await db.run(sql, params);
    const newMedia = result;
    
    if (!newMedia || !newMedia.id) {
      return res.status(500).json({ error: 'Erro ao criar filme: ID não retornado' });
    }
    
    res.status(201).json({ success: true, data: newMedia });
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
      runtime,
      country
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
        runtime = ?,
        country = ?
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
      country !== undefined ? country : existing.country,
      id,
      req.userId
    ];

    await db.run(sql, params);
    const updatedMedia = await db.get('SELECT * FROM media WHERE id = ?', [id]);
    
    res.json({ success: true, data: updatedMedia });
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
