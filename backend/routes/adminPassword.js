const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// POST - Endpoint administrativo para trocar senha
// ATENÇÃO: Usar apenas em casos especiais!
router.post('/change-password', async (req, res) => {
  try {
    const { email, newPassword, adminSecret } = req.body;

    // Validar secret (proteção básica)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Acesso negado: secret inválido' });
    }

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email e nova senha são obrigatórios' });
    }

    // Buscar usuário
    const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user) {
      return res.status(404).json({ error: `Usuário não encontrado: ${email}` });
    }

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    console.log(`🔑 Senha alterada para usuário: ${user.name} (${user.email})`);

    res.json({
      success: true,
      message: `Senha alterada com sucesso para ${user.email}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Erro ao trocar senha:', error);
    res.status(500).json({ error: 'Erro ao trocar senha' });
  }
});

module.exports = router;
