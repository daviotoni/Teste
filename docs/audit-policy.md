# Política técnica de auditoria

## Eventos auditáveis

Autenticação, criação e alteração de perfis, nomeações, designações, substituições, classificação de acesso, emissão/cancelamento de número, criação/alteração de processo, movimentação, atribuição, prazo, tarefa, documento, versão, assinatura, acesso a conteúdo restrito e exportação.

## Invariantes

1. `audit_logs` aceita somente inserção; o banco bloqueia `UPDATE` e `DELETE`.
2. `process_movements` aceita somente inserção; correções são novos atos com justificativa.
3. O evento é gravado na mesma transação da ação de negócio.
4. O evento registra ator, data/hora, origem, destino, estados anterior/posterior, justificativa e correlação da requisição quando disponíveis.
5. Consultas a conteúdo restrito geram evento de acesso.
6. Logs não substituem o histórico de negócio: documentos, versões, movimentações, tarefas e prazos conservam tabelas próprias.
