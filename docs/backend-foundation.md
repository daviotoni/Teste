# Fundação da API institucional

`server/api.mjs` é o ponto de entrada inicial da API REST. Ele mantém o frontend fora das tabelas normalizadas e usa somente dependências já existentes no repositório.

## Autenticação

Todas as rotas exigem `Authorization: Bearer <access-token>`. O token é verificado pelo Supabase Auth com `auth.getUser`; a consulta ao banco reutiliza o token autenticado para que as políticas RLS sejam aplicadas. Não há usuário padrão, senha padrão ou sessão criada pelo navegador nesse caminho.

## Rotas iniciais

- `GET /api/v1/me`
- `GET /api/v1/organizational-units`
- `GET /api/v1/processes`
- `POST /api/v1/processes`

`POST /api/v1/processes` chama a função SQL `create_process`, que cria processo e evento de auditoria na mesma transação.

## Limite atual

Movimentações, documentos, versões, tarefas e prazos serão adicionados depois dos testes de integração contra PostgreSQL/Supabase. Nenhuma tela do protótipo deve chamar tabelas normalizadas diretamente.
