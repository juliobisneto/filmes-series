require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const mediaRoutes = require('./routes/media');
const omdbRoutes = require('./routes/omdb');
const tmdbRoutes = require('./routes/tmdb');
const backupRoutes = require('./routes/backup');
const adminRoutes = require('./routes/admin');
const friendsRoutes = require('./routes/friends');
const suggestionsRoutes = require('./routes/suggestions');
const emailTestRoutes = require('./routes/emailTest');
const adminPasswordRoutes = require('./routes/adminPassword');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas públicas (sem autenticação)
app.use('/api/auth', authRoutes);
app.use('/api/email-test', emailTestRoutes); // Rota de teste de email (público)
app.use('/api/admin-password', adminPasswordRoutes); // Rota administrativa de senha (protegida por secret)

// Rotas protegidas (requerem autenticação)
app.use('/api/profile', profileRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/omdb', omdbRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin', adminRoutes); // Rota de administração (requer admin)
app.use('/api/friends', friendsRoutes); // Rotas de amizades (requer autenticação)
app.use('/api/suggestions', suggestionsRoutes); // Rotas de sugestões (requer autenticação)

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Filmes e Séries Multi-Usuário está rodando',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gerenciamento de Filmes e Séries - Multi-Usuário',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth (register, login)',
      profile: '/api/profile',
      media: '/api/media',
      omdb: '/api/omdb',
      tmdb: '/api/tmdb (NOVO - busca em português + atores/diretores)',
      backup: '/api/backup',
      health: '/api/health'
    }
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Detectar IP local da rede
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Ignorar endereços internos e IPv6
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }

  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em:`);
  console.log(`   • Local:      http://localhost:${PORT}`);
  console.log(`   • Rede:       http://${localIP}:${PORT}`);
  console.log(`🔐 Sistema Multi-Usuário ATIVO`);
  console.log(`📦 Sistema de Backup Automático ATIVO`);
  console.log(`🎬 Endpoints:`);
  console.log(`   PUBLIC:`);
  console.log(`   - POST   /api/auth/register`);
  console.log(`   - POST   /api/auth/login`);
  console.log(`   - GET    /api/auth/me`);
  console.log(`   PROTECTED:`);
  console.log(`   - GET    /api/profile`);
  console.log(`   - PUT    /api/profile`);
  console.log(`   - GET    /api/media`);
  console.log(`   - POST   /api/media`);
  console.log(`   - GET    /api/omdb/search?title=nome`);
  console.log(`   - GET    /api/tmdb/search/movie?query=titulo`);
  console.log(`   - GET    /api/tmdb/search/person?query=nome`);
  console.log(`   - GET    /api/tmdb/search/hybrid?query=titulo`);
  console.log(`   - POST   /api/backup/create (criar backup)`);
  console.log(`   - GET    /api/backup/list (listar backups)`);
  console.log(`   - POST   /api/backup/restore (restaurar)`);
  console.log(`\n⚠️  Configure JWT_SECRET e TMDB_API_KEY no arquivo .env\n`);
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido, encerrando servidor...');
  process.exit(0);
});
