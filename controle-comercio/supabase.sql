-- =====================================================================
--  Controle da Galeria — tabela no Supabase (sincronização na nuvem)
-- =====================================================================
-- Você só precisa disto se for configurar a nuvem manualmente em um
-- projeto Supabase novo. No projeto "ControleGaleria" isto já foi aplicado.
--
-- Como usar:
--   1. Crie um projeto grátis em https://supabase.com
--   2. Abra "SQL Editor" > "New query"
--   3. Cole todo este conteúdo e clique em "Run"
--   4. Em "Project Settings" > "API", copie a "Project URL" e a chave
--      "anon public" e cole no topo do arquivo index.html
-- =====================================================================

create table if not exists public.controle_galeria (
  id            text primary key,
  dados         jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.controle_galeria enable row level security;

-- Prototipo: acesso de leitura/escrita usando a chave anônima (publishable).
-- Para dados sensíveis ou uso profissional, troque por autenticação real.
drop policy if exists "acesso_publico" on public.controle_galeria;
create policy "acesso_publico" on public.controle_galeria
  for all to anon, authenticated
  using (true) with check (true);
