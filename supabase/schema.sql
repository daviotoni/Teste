-- JurisControl - estrutura inicial do banco central no Supabase
--
-- Como usar:
-- 1. Acesse o painel do Supabase.
-- 2. Abra SQL Editor > New query.
-- 3. Cole este arquivo inteiro e clique em Run.
-- 4. Depois configure as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.
--
-- Observacao importante:
-- Esta configuracao permite leitura e escrita usando a chave anonima do projeto.
-- E simples para prototipo e uso inicial, mas antes de colocar dados sensiveis em producao
-- o ideal e criar autenticacao real no backend e politicas de seguranca mais restritas.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendario (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS versoes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modelos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emissores (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leis (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leis ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura anonima users" ON users;
DROP POLICY IF EXISTS "Permitir escrita anonima users" ON users;
DROP POLICY IF EXISTS "Permitir leitura anonima processos" ON processos;
DROP POLICY IF EXISTS "Permitir escrita anonima processos" ON processos;
DROP POLICY IF EXISTS "Permitir leitura anonima calendario" ON calendario;
DROP POLICY IF EXISTS "Permitir escrita anonima calendario" ON calendario;
DROP POLICY IF EXISTS "Permitir leitura anonima documentos" ON documentos;
DROP POLICY IF EXISTS "Permitir escrita anonima documentos" ON documentos;
DROP POLICY IF EXISTS "Permitir leitura anonima versoes" ON versoes;
DROP POLICY IF EXISTS "Permitir escrita anonima versoes" ON versoes;
DROP POLICY IF EXISTS "Permitir leitura anonima modelos" ON modelos;
DROP POLICY IF EXISTS "Permitir escrita anonima modelos" ON modelos;
DROP POLICY IF EXISTS "Permitir leitura anonima emissores" ON emissores;
DROP POLICY IF EXISTS "Permitir escrita anonima emissores" ON emissores;
DROP POLICY IF EXISTS "Permitir leitura anonima leis" ON leis;
DROP POLICY IF EXISTS "Permitir escrita anonima leis" ON leis;
DROP POLICY IF EXISTS "Permitir leitura anonima config" ON config;
DROP POLICY IF EXISTS "Permitir escrita anonima config" ON config;

CREATE POLICY "Permitir leitura anonima users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima processos" ON processos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima processos" ON processos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima calendario" ON calendario FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima calendario" ON calendario FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima documentos" ON documentos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima documentos" ON documentos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima versoes" ON versoes FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima versoes" ON versoes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima modelos" ON modelos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima modelos" ON modelos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima emissores" ON emissores FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima emissores" ON emissores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima leis" ON leis FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima leis" ON leis FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura anonima config" ON config FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir escrita anonima config" ON config FOR ALL TO anon USING (true) WITH CHECK (true);
