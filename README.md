<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JurisControl

Aplicacao web em React/Vite para controle de processos, calendario, documentos, modelos, leis e configuracoes.

## Como funciona o banco de dados

O JurisControl agora funciona de duas formas:

1. **Sem configuracao de banco central:** salva os dados no navegador, usando IndexedDB. Nesse modo, os dados ficam apenas no computador/navegador onde foram cadastrados.
2. **Com Supabase configurado:** salva os dados em um banco central online, permitindo acessar os mesmos dados em outros computadores.

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

### 2. Criar as tabelas

No painel do Supabase:

1. Abra **SQL Editor**.
2. Clique em **New query**.
3. Copie todo o conteudo do arquivo `supabase/schema.sql`.
4. Cole no editor e clique em **Run**.

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

## Observacao de seguranca

A configuracao inicial do arquivo `supabase/schema.sql` e simples para prototipo e uso inicial. Ela permite leitura e escrita usando a chave anonima do Supabase. Antes de usar com dados sensiveis ou em producao, o ideal e implementar autenticacao real no backend e politicas de seguranca mais restritas.
