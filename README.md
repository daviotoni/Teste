# SIGLA-CMDC

Sistema institucional de gestão de processos, documentos e fluxos. O repositório
está em transição de um **protótipo legado** (React/Vite + IndexedDB/JSONB) para
um **núcleo institucional normalizado** (PostgreSQL + UUIDs + RBAC + RLS +
auditoria append-only + API `/api/v1`).

Este entregável cobre a base do **primeiro módulo funcional**: caixa da unidade,
consulta de processos, criação de processo e histórico básico. Módulos
especializados (plenário, votação, contratos, ouvidoria, jurídico) **não** fazem
parte desta etapa.

> **Importante**
> - Não há credenciais padrão. O login `admin/admin` foi **removido**.
> - O frontend **não** acessa as tabelas normalizadas diretamente: todo acesso a
>   dados institucionais passa pela **API autenticada** `/api/v1`.
> - O modo legado (IndexedDB) é **apenas demonstração local** e **não** é
>   centralizado. Não sincroniza com o banco institucional.
> - `supabase/schema.sql` é do protótipo legado e **não deve ser executado** no
>   banco institucional. Use as migrations em `database/migrations`.
> - Não use dados pessoais reais, documentos oficiais, credenciais ou assinaturas
>   válidas em seeds e testes.

## Arquitetura

```
Navegador (React/Vite)
  ├─ Modo institucional  ── Supabase Auth (bearer) ──> API /api/v1 ──> PostgreSQL (RLS)
  └─ Modo demonstração local (IndexedDB) — isolado, sem banco institucional
```

- **Banco** (`database/`): modelo normalizado, RLS efetiva, funções transacionais
  que gravam auditoria na mesma transação da ação de negócio.
- **API** (`server/`): Fastify. Única camada que opera o núcleo. Valida token,
  aplica autorização no servidor e chama as funções transacionais.
- **Frontend** (`components/`, `services/`): tela da caixa da unidade consumindo a
  API; componentes legados isolados como demonstração local.

## Pré-requisitos

- Node.js 22+
- PostgreSQL 15+ (ou Supabase) para a API e os testes de integração

## Instalação

```bash
npm install
cp .env.example .env.local   # preencha as variáveis (ver seção Variáveis)
```

## Como rodar o frontend

```bash
npm run dev      # http://localhost:3000
npm run build    # build de produção (dist/)
npm run preview  # pré-visualização do build
```

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, a tela de login informa que a
autenticação institucional não está configurada e oferece apenas o modo
demonstração local.

## Como rodar a API

```bash
npm run api      # sobe a API em http://localhost:8787 (prefixo /api/v1)
```

A API exige `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_ANON_KEY`. Ela recusa
iniciar sem essas variáveis.

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | frontend | Supabase Auth (chave **anônima pública**; nunca service_role). |
| `VITE_API_BASE_URL` | frontend | Base da API (padrão `http://localhost:8787/api/v1`). |
| `DATABASE_URL` | API | Conexão do papel **app_api** (SEM BYPASSRLS). |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | API | Verificação do token no servidor. |
| `API_PORT` / `API_HOST` / `API_CORS_ORIGIN` | API | Rede da API (opcionais). |
| `DATABASE_ADMIN_URL` | testes | Papel privilegiado para fixtures de integração. |

A chave `service_role` **nunca** é usada no frontend nem exposta ao navegador.

## Banco de dados

### Papel de aplicação (obrigatório para a RLS)

A RLS só é efetiva se a API conectar com um papel que **não** ignora RLS:

```sql
CREATE ROLE app_api LOGIN PASSWORD 'defina-uma-senha' NOBYPASSRLS;
-- Os GRANTs são aplicados pela migration 0004 quando o papel existe.
```

### Aplicar migrations

Aplique **em ordem** (idempotentes):

```bash
psql "$DATABASE_ADMIN_URL" -f database/migrations/0001_institutional_core.sql
psql "$DATABASE_ADMIN_URL" -f database/migrations/0002_integrity_and_domains.sql
psql "$DATABASE_ADMIN_URL" -f database/migrations/0003_rls_policies.sql
psql "$DATABASE_ADMIN_URL" -f database/migrations/0004_transactional_functions.sql
```

### Aplicar seeds

Sem nomes, e-mails ou responsáveis reais:

```bash
psql "$DATABASE_ADMIN_URL" -f database/seeds/0001_institutional_units.sql
psql "$DATABASE_ADMIN_URL" -f database/seeds/0002_rbac_and_numbering.sql
```

> `supabase/schema.sql` é **legado** e não deve ser executado no banco
> institucional.

## Testes

```bash
npm run lint             # ESLint
npm run typecheck        # tsc (frontend + servidor)
npm test                 # testes unitários (sem banco)
npm run test:integration # testes de integração (exigem PostgreSQL)
npm run build            # build de produção
```

Os **testes de integração** exigem `DATABASE_URL` (papel **app_api**, sem
bypassrls) e `DATABASE_ADMIN_URL` (papel privilegiado), com migrations e seeds
aplicados. **Sem essas variáveis, eles são pulados** — não são marcados como
aprovados. Execute-os em CI/homologação com um Postgres isolado por execução.

Cobertura de integração (em `tests/integration`): isolamento entre unidades,
administrador técnico sem acesso automático, validade temporal de substituição,
movimentação por usuário sem responsabilidade, imutabilidade de movimentações e
auditoria, integridade de workflow/etapa e de versão de documento, emissão de
número sem duplicidade e criação de processo com auditoria na mesma transação.

## Importador institucional

A migração dos dados do protótipo é feita por um **importador de backend
auditável** (`server/importer`, documentado em `database/importer/README.md`),
nunca pelo navegador. Por padrão é dry-run e gera um plano + relatório de erros:

```bash
npm run import -- caminho/para/export.json
```

## Modo demonstração local (legado)

Os componentes legados (Dashboard, Processos, Calendário, Documentos, Leis)
funcionam apenas com IndexedDB, isolados como demonstração. Um aviso permanente
deixa claro que **os dados não são centralizados e não devem ser usados para
atividade institucional**. Não há sincronização com o banco central.

## Documentação adicional

- `docs/api-contracts.md` — contratos da API `/api/v1`.
- `docs/permission-matrix.md` — matriz de permissões (RBAC).
- `docs/audit-policy.md` — política de auditoria append-only.
- `docs/migration-plan.md` — plano de migração do protótipo.
- `docs/isolation-test-plan.md` — plano de testes de isolamento.
