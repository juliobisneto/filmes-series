const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Proteger todas as rotas de friends
router.use(authMiddleware);

// GET - Buscar usuários por email ou nome
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Digite pelo menos 2 caracteres para buscar' });
    }

    // Buscar usuários (exceto o próprio usuário)
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email
      FROM users u
      WHERE (LOWER(u.email) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?))
      AND u.id != ?
      LIMIT 10
    `;
    
    const searchTerm = `%${q}%`;
    const users = await db.all(sql, [searchTerm, searchTerm, req.userId]);

    // Para cada usuário, verificar status de conexão
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      // Verificar se já são amigos ou há solicitação pendente
      const friendship = await db.get(`
        SELECT status, user_id, friend_id
        FROM friendships
        WHERE (user_id = ? AND friend_id = ?)
           OR (user_id = ? AND friend_id = ?)
      `, [req.userId, user.id, user.id, req.userId]);

      let connectionStatus = 'none';
      
      if (friendship) {
        if (friendship.status === 'accepted') {
          connectionStatus = 'friends';
        } else if (friendship.status === 'pending') {
          // Verificar se foi enviada por mim ou recebida
          if (friendship.user_id === req.userId) {
            connectionStatus = 'pending_sent';
          } else {
            connectionStatus = 'pending_received';
          }
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Ocultar parte do email
        connectionStatus
      };
    }));

    res.json({ success: true, data: usersWithStatus });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// POST - Enviar solicitação de amizade
router.post('/request', async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'ID do amigo é obrigatório' });
    }

    // Não pode adicionar a si mesmo
    if (friendId === req.userId) {
      return res.status(400).json({ error: 'Você não pode adicionar a si mesmo' });
    }

    // Verificar se o usuário amigo existe
    const friend = await db.get('SELECT id, name, email FROM users WHERE id = ?', [friendId]);
    if (!friend) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já existe uma relação
    const existing = await db.get(`
      SELECT id, status
      FROM friendships
      WHERE (user_id = ? AND friend_id = ?)
         OR (user_id = ? AND friend_id = ?)
    `, [req.userId, friendId, friendId, req.userId]);

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Vocês já são amigos' });
      } else if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Solicitação já foi enviada' });
      }
    }

    // Buscar dados do usuário que está enviando
    const sender = await db.get('SELECT name, email FROM users WHERE id = ?', [req.userId]);

    // Criar solicitação
    await db.run(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES (?, ?, 'pending')
    `, [req.userId, friendId]);

    // Enviar email de notificação (não bloquear a resposta)
    emailService.sendFriendRequest(friend.email, {
      senderName: sender.name,
      senderEmail: sender.email
    }).catch(err => console.error('Erro ao enviar email de solicitação:', err));

    res.json({
      success: true,
      message: `Solicitação enviada para ${friend.name}`
    });
  } catch (error) {
    console.error('Erro ao enviar solicitação:', error);
    res.status(500).json({ error: 'Erro ao enviar solicitação de amizade' });
  }
});

// GET - Listar solicitações (enviadas e recebidas)
router.get('/requests', async (req, res) => {
  try {
    // Solicitações recebidas (aguardando minha aprovação)
    const received = await db.all(`
      SELECT 
        f.id,
        f.user_id,
        f.created_at,
        u.name,
        u.email
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [req.userId]);

    // Solicitações enviadas (aguardando aprovação do outro)
    const sent = await db.all(`
      SELECT 
        f.id,
        f.friend_id,
        f.created_at,
        u.name,
        u.email
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [req.userId]);

    // Ocultar emails parcialmente
    const processedReceived = received.map(r => ({
      ...r,
      email: r.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    }));

    const processedSent = sent.map(s => ({
      ...s,
      email: s.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    }));

    res.json({
      success: true,
      data: {
        received: processedReceived,
        sent: processedSent
      }
    });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

// POST - Responder solicitação (aceitar ou recusar)
router.post('/respond', async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ error: 'ID da solicitação e ação são obrigatórios' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida. Use "accept" ou "reject"' });
    }

    // Verificar se a solicitação existe e é para o usuário atual
    const request = await db.get(`
      SELECT f.*, u.name as sender_name, u.email as sender_email
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ? AND f.friend_id = ? AND f.status = 'pending'
    `, [requestId, req.userId]);

    if (!request) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    await db.run(`
      UPDATE friendships
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, requestId]);

    // Se aceitar, enviar email para quem enviou a solicitação
    if (action === 'accept') {
      const accepter = await db.get('SELECT name FROM users WHERE id = ?', [req.userId]);
      
      emailService.sendFriendAccepted(request.sender_email, {
        accepterName: accepter.name
      }).catch(err => console.error('Erro ao enviar email de aceitação:', err));
    }

    const message = action === 'accept'
      ? `Você e ${request.sender_name} agora são amigos!`
      : 'Solicitação recusada';

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Erro ao responder solicitação:', error);
    res.status(500).json({ error: 'Erro ao responder solicitação' });
  }
});

// GET - Listar amigos
router.get('/', async (req, res) => {
  try {
    // Buscar amizades aceitas (em ambas as direções)
    const friends = await db.all(`
      SELECT 
        CASE 
          WHEN f.user_id = ? THEN f.friend_id
          ELSE f.user_id
        END as friend_id,
        u.name,
        u.email,
        f.updated_at as friends_since
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = ? THEN f.friend_id
          ELSE f.user_id
        END = u.id
      )
      WHERE (f.user_id = ? OR f.friend_id = ?)
      AND f.status = 'accepted'
      ORDER BY u.name
    `, [req.userId, req.userId, req.userId, req.userId]);

    // Ocultar emails parcialmente
    const processedFriends = friends.map(f => ({
      ...f,
      email: f.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    }));

    res.json({
      success: true,
      data: processedFriends
    });
  } catch (error) {
    console.error('Erro ao listar amigos:', error);
    res.status(500).json({ error: 'Erro ao listar amigos' });
  }
});

// DELETE - Remover amigo
router.delete('/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;

    // Verificar se a amizade existe
    const friendship = await db.get(`
      SELECT id
      FROM friendships
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `, [req.userId, friendId, friendId, req.userId]);

    if (!friendship) {
      return res.status(404).json({ error: 'Amizade não encontrada' });
    }

    // Remover amizade
    await db.run('DELETE FROM friendships WHERE id = ?', [friendship.id]);

    res.json({
      success: true,
      message: 'Amizade removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    res.status(500).json({ error: 'Erro ao remover amigo' });
  }
});

// GET - Verificar se são amigos
router.get('/:friendId/verify', async (req, res) => {
  try {
    const { friendId } = req.params;
    
    const friendship = await db.get(`
      SELECT id, status 
      FROM friendships
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `, [req.userId, friendId, friendId, req.userId]);
    
    if (friendship) {
      res.json({ success: true, areFriends: true });
    } else {
      res.json({ success: true, areFriends: false });
    }
  } catch (error) {
    console.error('Erro ao verificar amizade:', error);
    res.status(500).json({ error: 'Erro ao verificar amizade' });
  }
});

// GET - Buscar coleção de mídia de um amigo
router.get('/:friendId/media', async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // Verificar se são amigos
    const friendship = await db.get(`
      SELECT id 
      FROM friendships
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `, [req.userId, friendId, friendId, req.userId]);
    
    if (!friendship) {
      return res.status(403).json({ error: 'Você só pode ver a coleção de amigos' });
    }
    
    // Buscar informações do amigo
    const friend = await db.get('SELECT id, name FROM users WHERE id = ?', [friendId]);
    
    if (!friend) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Buscar mídia do amigo
    const media = await db.all(`
      SELECT * FROM media 
      WHERE user_id = ?
      ORDER BY 
        CASE status 
          WHEN 'quero_ver' THEN 1 
          WHEN 'assistindo' THEN 2 
          WHEN 'rever' THEN 3
          WHEN 'ja_vi' THEN 4
        END,
        CASE 
          WHEN status = 'ja_vi' THEN COALESCE(date_watched, date_added)
          ELSE date_added
        END DESC
    `, [friendId]);
    
    res.json({ 
      success: true, 
      data: {
        friend: { id: friend.id, name: friend.name },
        media: media
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mídia do amigo:', error);
    res.status(500).json({ error: 'Erro ao buscar mídia do amigo' });
  }
});

// GET - Buscar detalhes de um filme específico do amigo
router.get('/:friendId/media/:mediaId', async (req, res) => {
  try {
    const { friendId, mediaId } = req.params;
    
    // Verificar se são amigos
    const friendship = await db.get(`
      SELECT id 
      FROM friendships
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
      AND status = 'accepted'
    `, [req.userId, friendId, friendId, req.userId]);
    
    if (!friendship) {
      return res.status(403).json({ error: 'Você só pode ver filmes de amigos' });
    }
    
    // Buscar informações do amigo
    const friend = await db.get('SELECT id, name FROM users WHERE id = ?', [friendId]);
    
    if (!friend) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Buscar o filme específico do amigo
    const media = await db.get(`
      SELECT * FROM media 
      WHERE id = ? AND user_id = ?
    `, [mediaId, friendId]);
    
    if (!media) {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    
    res.json({ 
      success: true, 
      data: {
        friend: { id: friend.id, name: friend.name },
        media: media
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do filme do amigo:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do filme' });
  }
});

module.exports = router;
