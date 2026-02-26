-- ============================================================
-- Migration: Adicionar coluna last_login na tabela users
-- Descrição: Armazena a data/hora do último login do usuário
-- ============================================================

-- PostgreSQL (Railway / produção)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT NULL;

-- SQLite (desenvolvimento local): execute apenas se a coluna ainda não existir
-- ALTER TABLE users ADD COLUMN last_login DATETIME;
