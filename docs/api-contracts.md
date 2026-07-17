# Contratos iniciais da API

Prefixo: `/api/v1`. A API é a única camada autorizada a executar operações de negócio; o frontend não acessa as tabelas operacionais diretamente.

## Convenções

- Autenticação: bearer token OIDC; MFA é exigido conforme política do papel.
- Mutação: `Idempotency-Key` em `POST` e `X-Entity-Version` em `PATCH`/ações concorrentes.
- Concorrência: resposta `409` quando a versão informada não corresponde ao campo `version` atual.
- Erros: `application/problem+json`.
- Datas: ISO 8601 com fuso horário.
- Todas as respostas omitem dados não autorizados pela classificação de acesso.

## Recursos

```text
GET/POST        /organizational-units
GET/PATCH       /organizational-units/:id
GET/POST        /organizational-unit-relations
GET/POST        /legal-competencies
GET/POST        /employees
GET/POST        /appointments
GET/POST        /designations
GET/POST        /temporary-substitutions
GET/POST        /roles
GET             /permissions
PUT             /roles/:roleId/permissions
POST            /users/:userId/roles

GET/POST        /processes
GET/PATCH       /processes/:id
POST            /processes/:id/movements
POST            /processes/:id/assignments
GET/POST        /processes/:id/documents
GET/POST        /documents/:id/versions
POST            /documents/:id/attachments
POST            /documents/:id/signatures
GET/POST        /tasks
GET/POST        /deadlines
GET             /audit-logs
GET             /unit-inbox
```

## Ação de movimentação

`POST /processes/:id/movements`

```json
{
  "toUnitId": "uuid",
  "toUserId": "uuid opcional",
  "newStepId": "uuid",
  "newStatus": "ASSIGNED",
  "dueAt": "2026-08-01T20:00:00Z",
  "justification": "texto obrigatório quando a transição o exigir"
}
```

A operação cria uma movimentação imutável, atualiza o processo em transação, cria/atualiza atribuições e prazos quando aplicável e grava o evento de auditoria.

## Implementação atual (primeiro módulo)

Endpoints implementados em `server/`:

```text
GET    /api/v1/health
GET    /api/v1/me
GET    /api/v1/organizational-units
GET    /api/v1/organizational-units/:id
GET    /api/v1/unit-inbox
GET    /api/v1/processes
POST   /api/v1/processes
GET    /api/v1/processes/:id
POST   /api/v1/processes/:id/movements
GET    /api/v1/processes/:id/documents
POST   /api/v1/processes/:id/documents
POST   /api/v1/documents/:id/versions
GET    /api/v1/tasks
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
```

Mapeamento operação → função transacional do banco (auditoria na mesma transação):

| Operação | Função |
|---|---|
| Criar processo | `sigla_create_process` |
| Movimentar processo | `sigla_move_process` |
| Atribuir/redistribuir | `sigla_assign_process` |
| Criar tarefa | `sigla_create_task` |
| Alterar prazo | `sigla_change_deadline` |
| Criar documento | `sigla_create_document` |
| Criar versão | `sigla_create_document_version` |
| Solicitar assinatura | `sigla_request_signature` |
| Registrar acesso restrito | `sigla_log_restricted_access` |

Notas de implementação:

- Autenticação por bearer token verificado no servidor; identidade institucional
  resolvida via `sigla_resolve_identity` e aplicada à RLS com `SET LOCAL app.user_id`.
- `Idempotency-Key` em `POST` (criação/movimentação); `If-Match`/`X-Entity-Version`
  para concorrência otimista (resposta `409` em conflito).
- Erros em `application/problem+json`; SQLSTATE do banco mapeados para HTTP
  (`42501→403`, `40001→409`, `22023→422`, `28000→401`, `P0002→404`).
- As demais rotas do rascunho acima permanecem previstas para os próximos módulos.
