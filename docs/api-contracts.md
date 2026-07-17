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
