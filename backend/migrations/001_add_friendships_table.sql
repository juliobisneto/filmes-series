-- ============================================================
-- Migration: Criar tabela friendships (Sistema de Amizades)
-- Data: 28/01/2026
-- Descrição: Tabela para gerenciar conexões entre usuários
-- ============================================================

-- Verificar se a tabela já existe (opcional, PostgreSQL ignora se usar IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK(user_id != friend_id),
  CONSTRAINT valid_status CHECK(status IN ('pending', 'accepted', 'rejected'))
);

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Verificar se a tabela foi criada com sucesso
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'friendships'
ORDER BY ordinal_position;

-- ============================================================
-- INSTRUÇÕES:
-- 1. Acesse Railway Dashboard
-- 2. Selecione seu projeto "Filmes e Séries"
-- 3. Clique no serviço PostgreSQL
-- 4. Vá em "Data" ou "Query"
-- 5. Cole este SQL e execute
-- 6. Verifique se retornou as colunas da tabela friendships
-- ============================================================
