const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// GET - Endpoint público de teste de email (sem autenticação)
router.get('/test', async (req, res) => {
  try {
    // Verificar se está configurado
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    
    if (!isConfigured) {
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

    // Mostrar configuração (sem enviar email ainda)
    const maskedPassword = process.env.EMAIL_PASSWORD 
      ? '***' + process.env.EMAIL_PASSWORD.slice(-4)
      : 'não configurado';

    res.json({
      configured: true,
      message: '✅ Email está configurado! Use /api/email-test/send para testar o envio.',
      config: {
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: maskedPassword,
        FRONTEND_URL: process.env.FRONTEND_URL || 'não configurado',
        passwordLength: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0,
        hasSpaces: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.includes(' ') : false
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar configuração de email:', error);
    res.status(500).json({
      error: error.message,
      message: '❌ Erro ao verificar configuração: ' + error.message
    });
  }
});

// POST - Enviar email de teste (requer email no body)
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório',
        message: 'Envie: { "email": "seu@email.com" }'
      });
    }

    // Verificar se está configurado
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.json({
        configured: false,
        message: '⚠️ Email não configurado no servidor'
      });
    }

    console.log(`🧪 Testando envio de email para ${email}...`);
    console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`🔑 EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD.length}`);
    console.log(`🔑 EMAIL_PASSWORD has spaces: ${process.env.EMAIL_PASSWORD.includes(' ')}`);
    
    // Tentar enviar email de teste
    await emailService.sendMovieSuggestion(email, {
      senderName: 'Sistema de Testes',
      movieTitle: '🎬 Email de Teste - Interestelar',
      moviePoster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2ZlNmIyNmUwYjljXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
      movieYear: '2014',
      movieGenre: 'Ficção Científica',
      message: 'Este é um email de teste do sistema de notificações. Se você recebeu esta mensagem, o envio de emails está funcionando corretamente! ✅'
    });

    console.log(`✅ Email de teste enviado com sucesso para ${email}`);

    res.json({
      configured: true,
      success: true,
      message: `✅ Email enviado com sucesso para ${email}. Verifique sua caixa de entrada (e spam)!`,
      config: {
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: '***' + process.env.EMAIL_PASSWORD.slice(-4),
        FRONTEND_URL: process.env.FRONTEND_URL || 'não configurado'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error);
    res.status(500).json({
      configured: true,
      success: false,
      error: error.message,
      stack: error.stack,
      message: '❌ Erro ao enviar email: ' + error.message
    });
  }
});

module.exports = router;
