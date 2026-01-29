const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Proteger todas as rotas
router.use(authMiddleware);

// POST - Enviar sugestão de filme para um amigo
router.post('/send', async (req, res) => {
  try {
    const { receiverId, mediaId, message } = req.body;
    const senderId = req.userId;

    // Validações básicas
    if (!receiverId || !mediaId) {
      return res.status(400).json({ error: 'receiverId e mediaId são obrigatórios' });
    }

    // Validar que não está enviando para si mesmo
    if (parseInt(receiverId) === senderId) {
      return res.status(400).json({ error: 'Você não pode enviar sugestões para si mesmo' });
    }

    // Verificar se receiver existe
    const receiver = await db.get('SELECT id, name, email FROM users WHERE id = ?', [receiverId]);
    if (!receiver) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado' });
    }

    // Verificar se são amigos
    const friendship = await db.get(`
      SELECT id 
      FROM friendships 
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `, [senderId, receiverId, receiverId, senderId]);

    if (!friendship) {
      return res.status(403).json({ error: 'Você só pode enviar sugestões para amigos' });
    }

    // Verificar se o filme pertence ao sender
    const media = await db.get('SELECT * FROM media WHERE id = ? AND user_id = ?', [mediaId, senderId]);
    if (!media) {
      return res.status(404).json({ error: 'Filme não encontrado na sua coleção' });
    }

    // Verificar duplicatas (já existe sugestão pendente deste filme para este amigo)
    const existingSuggestion = await db.get(`
      SELECT id, status 
      FROM suggestions 
      WHERE sender_id = ? AND receiver_id = ? AND media_id = ?
    `, [senderId, receiverId, mediaId]);

    if (existingSuggestion) {
      if (existingSuggestion.status === 'pending') {
        return res.status(409).json({ error: 'Você já sugeriu este filme para este amigo' });
      }
      // Se já foi aceita ou rejeitada, permitir reenviar
      await db.run('DELETE FROM suggestions WHERE id = ?', [existingSuggestion.id]);
    }

    // Sanitizar mensagem (max 500 chars)
    const sanitizedMessage = message ? message.substring(0, 500) : null;

    // Buscar dados do sender
    const sender = await db.get('SELECT name FROM users WHERE id = ?', [senderId]);

    // Criar sugestão
    const result = await db.run(`
      INSERT INTO suggestions (sender_id, receiver_id, media_id, message, status)
      VALUES (?, ?, ?, ?, 'pending')
      RETURNING id
    `, [senderId, receiverId, mediaId, sanitizedMessage]);

    // Buscar a sugestão criada com dados completos
    const suggestion = await db.get(`
      SELECT 
        s.*,
        u.name as receiver_name,
        u.email as receiver_email,
        m.title as media_title,
        m.poster_url as media_poster
      FROM suggestions s
      JOIN users u ON s.receiver_id = u.id
      JOIN media m ON s.media_id = m.id
      WHERE s.id = ?
    `, [result.id]);

    // Enviar email de notificação (não bloquear a resposta)
    emailService.sendMovieSuggestion(receiver.email, {
      senderName: sender.name,
      movieTitle: media.title,
      moviePoster: media.poster_url,
      movieYear: media.year,
      movieGenre: media.genre,
      message: sanitizedMessage
    }).catch(err => console.error('Erro ao enviar email de sugestão:', err));

    res.json({ 
      success: true, 
      data: suggestion,
      message: `Sugestão enviada para ${suggestion.receiver_name}!`
    });

  } catch (error) {
    console.error('Erro ao enviar sugestão:', error);
    res.status(500).json({ error: 'Erro ao enviar sugestão' });
  }
});

// GET - Listar sugestões recebidas
router.get('/received', async (req, res) => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT 
        s.*,
        u.name as sender_name,
        u.email as sender_email,
        m.title,
        m.type,
        m.genre,
        m.year,
        m.poster_url,
        m.plot,
        m.imdb_rating,
        m.rating as sender_rating,
        m.director,
        m.actors,
        m.runtime,
        m.country,
        m.imdb_id
      FROM suggestions s
      JOIN users u ON s.sender_id = u.id
      JOIN media m ON s.media_id = m.id
      WHERE s.receiver_id = ?
    `;

    const params = [req.userId];

    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY 
      CASE s.status 
        WHEN 'pending' THEN 1 
        WHEN 'accepted' THEN 2 
        WHEN 'rejected' THEN 3 
      END,
      s.created_at DESC
    `;

    const suggestions = await db.all(sql, params);

    res.json({ success: true, data: suggestions });

  } catch (error) {
    console.error('Erro ao buscar sugestões recebidas:', error);
    res.status(500).json({ error: 'Erro ao buscar sugestões recebidas' });
  }
});

// GET - Listar sugestões enviadas
router.get('/sent', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.*,
        u.name as receiver_name,
        u.email as receiver_email,
        m.title,
        m.poster_url,
        m.year,
        m.type
      FROM suggestions s
      JOIN users u ON s.receiver_id = u.id
      JOIN media m ON s.media_id = m.id
      WHERE s.sender_id = ?
      ORDER BY 
        CASE s.status 
          WHEN 'pending' THEN 1 
          WHEN 'accepted' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        s.created_at DESC
    `;

    const suggestions = await db.all(sql, [req.userId]);

    res.json({ success: true, data: suggestions });

  } catch (error) {
    console.error('Erro ao buscar sugestões enviadas:', error);
    res.status(500).json({ error: 'Erro ao buscar sugestões enviadas' });
  }
});

// PUT - Responder sugestão (aceitar ou rejeitar)
router.put('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' ou 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action deve ser "accept" ou "reject"' });
    }

    // Buscar a sugestão
    const suggestion = await db.get(`
      SELECT 
        s.id as suggestion_id,
        s.sender_id,
        s.receiver_id,
        s.media_id,
        s.message,
        s.status as suggestion_status,
        s.created_at,
        s.responded_at,
        m.id as media_id,
        m.title,
        m.type,
        m.genre,
        m.status as media_status,
        m.rating,
        m.notes,
        m.imdb_id,
        m.imdb_rating,
        m.poster_url,
        m.plot,
        m.year,
        m.director,
        m.actors,
        m.runtime,
        m.country,
        u.name as sender_name,
        u.email as sender_email
      FROM suggestions s
      JOIN media m ON s.media_id = m.id
      JOIN users u ON s.sender_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }

    // Verificar se a sugestão pertence ao usuário autenticado (receiver)
    if (suggestion.receiver_id !== req.userId) {
      return res.status(403).json({ error: 'Você não tem permissão para responder esta sugestão' });
    }

    // Verificar se ainda está pendente
    if (suggestion.suggestion_status !== 'pending') {
      return res.status(400).json({ error: 'Esta sugestão já foi respondida' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Se aceitar, criar cópia do filme na coleção do receiver
    if (action === 'accept') {
      // Verificar se o filme já existe na coleção do receiver
      const existingMedia = await db.get(`
        SELECT id FROM media 
        WHERE user_id = ? 
        AND (
          (imdb_id IS NOT NULL AND imdb_id = ?) 
          OR (title = ? AND year = ?)
        )
      `, [req.userId, suggestion.imdb_id, suggestion.title, suggestion.year]);

      if (existingMedia) {
        // Atualizar status da sugestão para rejected
        await db.run(`
          UPDATE suggestions 
          SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [id]);

        return res.status(409).json({ 
          error: 'Este filme já está na sua coleção',
          data: existingMedia
        });
      }

      // Adicionar nota sobre quem sugeriu
      const originalNotes = suggestion.notes || '';
      const suggestionNote = `Sugerido por ${suggestion.sender_name}`;
      const newNotes = originalNotes ? `${originalNotes}\n\n${suggestionNote}` : suggestionNote;

      // Criar cópia do filme
      await db.run(`
        INSERT INTO media (
          user_id, title, type, genre, status, rating, notes,
          imdb_id, imdb_rating, poster_url, plot, year, director, actors, runtime, country, date_added
        ) VALUES (?, ?, ?, ?, 'quero_ver', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        req.userId,
        suggestion.title,
        suggestion.type,
        suggestion.genre,
        newNotes,
        suggestion.imdb_id,
        suggestion.imdb_rating,
        suggestion.poster_url,
        suggestion.plot,
        suggestion.year,
        suggestion.director,
        suggestion.actors,
        suggestion.runtime,
        suggestion.country
      ]);
    }

    // Atualizar status da sugestão
    await db.run(`
      UPDATE suggestions 
      SET status = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, id]);

    // Se aceitar, enviar email para quem sugeriu
    if (action === 'accept') {
      const accepter = await db.get('SELECT name FROM users WHERE id = ?', [req.userId]);
      
      emailService.sendSuggestionAccepted(suggestion.sender_email, {
        accepterName: accepter.name,
        movieTitle: suggestion.title,
        movieYear: suggestion.year
      }).catch(err => console.error('Erro ao enviar email de sugestão aceita:', err));
    }

    const message = action === 'accept' 
      ? `Filme "${suggestion.title}" adicionado à sua coleção!`
      : 'Sugestão rejeitada';

    res.json({ 
      success: true, 
      data: { id, status: newStatus },
      message 
    });

  } catch (error) {
    console.error('Erro ao responder sugestão:', error);
    res.status(500).json({ error: 'Erro ao responder sugestão' });
  }
});

// GET - Contador de sugestões pendentes
router.get('/count', async (req, res) => {
  try {
    const result = await db.get(`
      SELECT COUNT(*) as pending
      FROM suggestions
      WHERE receiver_id = ? AND status = 'pending'
    `, [req.userId]);

    res.json({ pending: result.pending || 0 });

  } catch (error) {
    console.error('Erro ao contar sugestões:', error);
    res.status(500).json({ error: 'Erro ao contar sugestões' });
  }
});

// DELETE - Cancelar sugestão pendente (apenas sender)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar a sugestão
    const suggestion = await db.get('SELECT * FROM suggestions WHERE id = ?', [id]);

    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }

    // Verificar se é o sender
    if (suggestion.sender_id !== req.userId) {
      return res.status(403).json({ error: 'Você não tem permissão para cancelar esta sugestão' });
    }

    // Verificar se ainda está pendente
    if (suggestion.status !== 'pending') {
      return res.status(400).json({ error: 'Só é possível cancelar sugestões pendentes' });
    }

    // Deletar sugestão
    await db.run('DELETE FROM suggestions WHERE id = ?', [id]);

    res.json({ success: true, message: 'Sugestão cancelada' });

  } catch (error) {
    console.error('Erro ao cancelar sugestão:', error);
    res.status(500).json({ error: 'Erro ao cancelar sugestão' });
  }
});

// GET - Testar configuração de email (DEBUG)
router.get('/test-email', async (req, res) => {
  try {
    const user = await db.get('SELECT name, email FROM users WHERE id = ?', [req.userId]);
    
    // Verificar se está configurado
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.json({
        configured: false,
        message: '⚠️ Email não configurado no servidor',
        env_check: {
          EMAIL_USER: !!process.env.EMAIL_USER,
          EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
          FRONTEND_URL: !!process.env.FRONTEND_URL
        }
      });
    }

    // Tentar enviar email de teste
    console.log(`🧪 Testando envio de email para ${user.email}...`);
    
    const success = await emailService.sendMovieSuggestion(user.email, {
      senderName: 'Sistema',
      movieTitle: 'Email de Teste',
      moviePoster: null,
      movieYear: '2026',
      movieGenre: 'Teste',
      message: 'Este é um email de teste do sistema de notificações.'
    });

    if (success) {
      console.log(`✅ Email de teste enviado com sucesso para ${user.email}`);
      res.json({
        configured: true,
        success: true,
        message: `✅ Email enviado com sucesso para ${user.email}. Verifique sua caixa de entrada (e spam)!`,
        config: {
          EMAIL_USER: process.env.EMAIL_USER,
          EMAIL_PASSWORD: '***' + process.env.EMAIL_PASSWORD.slice(-4),
          FRONTEND_URL: process.env.FRONTEND_URL || 'não configurado'
        }
      });
    } else {
      res.json({
        configured: true,
        success: false,
        message: '❌ Erro ao enviar email. Verifique os logs do servidor.',
        config: {
          EMAIL_USER: process.env.EMAIL_USER,
          EMAIL_PASSWORD: '***' + process.env.EMAIL_PASSWORD.slice(-4),
          FRONTEND_URL: process.env.FRONTEND_URL || 'não configurado'
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste de email:', error);
    res.status(500).json({
      configured: true,
      success: false,
      error: error.message,
      message: '❌ Erro ao testar email: ' + error.message
    });
  }
});

module.exports = router;
