const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuração do transporter com timeouts e opções explícitas
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // Porta TLS (mais compatível com servidores cloud)
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Aceitar certificados auto-assinados
      },
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verificar se as credenciais estão configuradas
    this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    
    if (!this.isConfigured) {
      console.warn('⚠️  Email não configurado. Configure EMAIL_USER e EMAIL_PASSWORD no .env');
    } else {
      console.log('📧 Email Service configurado com:', {
        host: 'smtp.gmail.com',
        port: 587,
        user: process.env.EMAIL_USER,
        passwordLength: process.env.EMAIL_PASSWORD.length
      });
    }
  }

  // Template base para emails
  getEmailTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #1a1a1a;
            color: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #2d2d2d;
            border-radius: 10px;
            margin-top: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #e50914;
          }
          .header h1 {
            margin: 0;
            color: #e50914;
            font-size: 2rem;
          }
          .content {
            padding: 30px 0;
            line-height: 1.6;
          }
          .content h2 {
            color: #ffffff;
            margin-top: 0;
          }
          .content p {
            color: #cccccc;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #e50914, #b20710);
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background: linear-gradient(135deg, #b20710, #8a0508);
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #444;
            color: #888;
            font-size: 12px;
          }
          .highlight {
            background-color: rgba(229, 9, 20, 0.1);
            border-left: 3px solid #e50914;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 Filmes & Séries</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>&copy; 2026 Filmes & Séries - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Método auxiliar para enviar email
  async sendEmail(mailOptions) {
    if (!this.isConfigured) {
      console.log('📧 Email não enviado (não configurado):', mailOptions.subject);
      return false;
    }

    try {
      console.log('📤 Tentando enviar email:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email enviado com sucesso!`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      throw error; // Re-throw para capturar no endpoint
    }
  }

  // Email de solicitação de amizade
  async sendFriendRequest(to, data) {
    const { senderName, senderEmail } = data;
    
    const content = `
      <h2>👥 Nova Solicitação de Amizade!</h2>
      <p>Olá!</p>
      <p><strong>${senderName}</strong> (${senderEmail}) quer ser seu amigo no Filmes & Séries!</p>
      <p>Aceite a solicitação para compartilhar suas experiências cinematográficas e trocar sugestões de filmes.</p>
      <a href="${process.env.FRONTEND_URL || 'https://filmes-series-chi.vercel.app'}/friends" class="button">
        👥 Ver Solicitações
      </a>
    `;

    const mailOptions = {
      from: `"Filmes & Séries" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '👥 Nova Solicitação de Amizade - Filmes & Séries',
      html: this.getEmailTemplate(content)
    };

    return await this.sendEmail(mailOptions);
  }

  // Email de amizade aceita
  async sendFriendAccepted(to, data) {
    const { accepterName } = data;
    
    const content = `
      <h2>🎉 Solicitação de Amizade Aceita!</h2>
      <p>Boa notícia!</p>
      <p><strong>${accepterName}</strong> aceitou sua solicitação de amizade!</p>
      <p>Agora vocês podem:</p>
      <ul>
        <li>📚 Compartilhar coleções de filmes e séries</li>
        <li>💡 Trocar sugestões personalizadas</li>
        <li>⭐ Ver avaliações um do outro</li>
      </ul>
      <a href="${process.env.FRONTEND_URL || 'https://filmes-series-chi.vercel.app'}/friends" class="button">
        👥 Ver Amigos
      </a>
    `;

    const mailOptions = {
      from: `"Filmes & Séries" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '🎉 Solicitação Aceita - Filmes & Séries',
      html: this.getEmailTemplate(content)
    };

    return await this.sendEmail(mailOptions);
  }

  // Email de sugestão de filme recebida
  async sendMovieSuggestion(to, data) {
    const { senderName, movieTitle, moviePoster, message, movieYear, movieGenre } = data;
    
    const posterImg = moviePoster 
      ? `<div style="text-align: center; margin: 20px 0;">
          <img src="${moviePoster}" alt="${movieTitle}" style="max-width: 300px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
         </div>`
      : '';
    
    const genreInfo = movieGenre ? `<p><strong>Gênero:</strong> ${movieGenre}</p>` : '';
    
    const content = `
      <h2>💡 Nova Sugestão de Filme!</h2>
      <p>Olá!</p>
      <p><strong>${senderName}</strong> sugeriu um filme para você assistir:</p>
      ${posterImg}
      <h3 style="color: #9c27b0; margin: 20px 0 10px 0; text-align: center;">
        ${movieTitle} ${movieYear ? `(${movieYear})` : ''}
      </h3>
      ${genreInfo}
      ${message ? `
        <div class="highlight" style="background-color: rgba(156, 39, 176, 0.1); border-left: 3px solid #9c27b0;">
          <p style="margin: 0; font-style: italic; color: #ffffff;">
            <strong>Mensagem de ${senderName}:</strong><br>
            "${message}"
          </p>
        </div>
      ` : ''}
      <p>Acesse o sistema para ver todos os detalhes e decidir se quer adicionar à sua coleção!</p>
      <a href="${process.env.FRONTEND_URL || 'https://filmes-series-chi.vercel.app'}/suggestions" class="button" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2);">
        💡 Ver Sugestões
      </a>
    `;

    const mailOptions = {
      from: `"Filmes & Séries" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `💡 ${senderName} sugeriu: ${movieTitle}`,
      html: this.getEmailTemplate(content)
    };

    return await this.sendEmail(mailOptions);
  }

  // Email de sugestão aceita
  async sendSuggestionAccepted(to, data) {
    const { accepterName, movieTitle, movieYear } = data;
    
    const content = `
      <h2>🎉 Sua Sugestão Foi Aceita!</h2>
      <p>Boa notícia!</p>
      <p><strong>${accepterName}</strong> aceitou sua sugestão e adicionou <strong>"${movieTitle}"</strong> ${movieYear ? `(${movieYear})` : ''} à coleção!</p>
      <div class="highlight">
        <p style="margin: 0;">
          🎯 <strong>Acertou em cheio!</strong><br>
          Parece que vocês têm gostos em comum para filmes e séries!
        </p>
      </div>
      <p>Continue compartilhando suas descobertas cinematográficas com seus amigos!</p>
      <a href="${process.env.FRONTEND_URL || 'https://filmes-series-chi.vercel.app'}/suggestions" class="button" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2);">
        💡 Ver Sugestões
      </a>
    `;

    const mailOptions = {
      from: `"Filmes & Séries" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🎉 Sugestão Aceita: ${movieTitle}`,
      html: this.getEmailTemplate(content)
    };

    return await this.sendEmail(mailOptions);
  }
}

module.exports = new EmailService();
