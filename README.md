<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JurisControl

Aplicacao web em React/Vite para controle de processos, calendario, documentos, modelos, leis e configuracoes.

## Estado da arquitetura de dados

O armazenamento local e o esquema JSONB abaixo pertencem ao protótipo visual existente:

1. **Sem configuracao de banco central:** salva os dados no navegador, usando IndexedDB. Nesse modo, os dados ficam apenas no computador/navegador onde foram cadastrados.
2. **Com Supabase configurado:** o protótipo salva dados em um banco central online, permitindo acessar os mesmos dados em outros computadores.

O SIGLA-CMDC não deve ser implantado com esse modo de protótipo. O núcleo institucional normalizado está em `database/migrations/0001_institutional_core.sql`; ele introduz autenticação, autorização, auditoria, versionamento e políticas de acesso restritivas. O plano de migração está em `docs/migration-plan.md`.

## Rodar localmente

**Pre-requisito:** Node.js instalado.

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Rode o app:

   ```bash
   npm run dev
   ```

## Configurar banco central no Supabase

### 1. Criar projeto no Supabase

Crie uma conta em https://supabase.com e depois crie um novo projeto.

### 2. Aplicar migrations do SIGLA-CMDC

No painel do Supabase:

1. Crie primeiro um ambiente de homologação vazio.
2. Faça backup de dados e anexos do protótipo, se existirem.
3. Aplique as migrations versionadas em `database/migrations/` usando uma ferramenta de migrations PostgreSQL ou Supabase CLI.
4. Execute os seeds institucionais em `database/seeds/` somente após a migration correspondente.

Não execute `supabase/schema.sql`: ele foi descontinuado e não é um caminho de implantação do SIGLA-CMDC.

### 3. Configurar as chaves no projeto

No Supabase, abra **Project Settings > API** e copie:

- **Project URL**
- **anon public key**

Depois, no computador onde voce roda o projeto:

1. Copie o arquivo `.env.example` e renomeie a copia para `.env.local`.
2. Preencha assim:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
   ```

3. Reinicie o servidor do Vite:

   ```bash
   npm run dev
   ```

Quando o app estiver usando Supabase, a tela **Configuracoes > Banco de dados** mostrara que o modo atual e **Banco central Supabase**.

## Migrar dados que ja estavam no navegador

Se voce ja cadastrou dados antes de configurar o Supabase:

1. Abra o JurisControl no mesmo navegador onde os dados antigos aparecem.
2. Entre em **Configuracoes**.
3. Clique em **Migrar dados deste navegador para o banco central**.

Isso envia os dados locais para o Supabase.

## Observação de segurança

O esquema legado permitia leitura e escrita usando chave anônima e não deve ser usado com dados institucionais, pessoais ou de produção. A migração normalizada é deny-by-default no banco; a API autenticada deverá aplicar autorização por papel, unidade, classificação de acesso e regras de segregação.
