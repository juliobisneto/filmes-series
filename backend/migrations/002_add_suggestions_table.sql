-- ============================================================
-- Migration: Criar tabela suggestions (Sistema de Sugestões)
-- Data: 29/01/2026
-- Descrição: Tabela para gerenciar sugestões de filmes entre amigos
-- ============================================================

-- Verificar se a tabela já existe (opcional, PostgreSQL ignora se usar IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT unique_suggestion UNIQUE(sender_id, receiver_id, media_id),
  CONSTRAINT valid_suggestion_status CHECK(status IN ('pending', 'accepted', 'rejected'))
);

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_suggestions_receiver_status ON suggestions(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_suggestions_sender ON suggestions(sender_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_media ON suggestions(media_id);

-- Verificar se a tabela foi criada com sucesso
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'suggestions'
ORDER BY ordinal_position;

-- ============================================================
-- INSTRUÇÕES:
-- 1. Acesse Railway Dashboard
-- 2. Selecione seu projeto "Filmes e Séries"
-- 3. Clique no serviço PostgreSQL
-- 4. Vá em "Data" ou "Query"
-- 5. Cole este SQL e execute
-- 6. Verifique se retornou as colunas da tabela suggestions
-- ============================================================
