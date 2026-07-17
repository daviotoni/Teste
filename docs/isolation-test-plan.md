# Plano de testes de isolamento entre unidades

1. Usuário de uma unidade não lista processo interno de outra unidade sem relação/autorização.
2. Usuário atribuído ao processo consegue consultar apenas o conteúdo permitido pela classificação.
3. Documento `RESTRICTED` com alcance `SELECTED_USERS` não é retornado para outro membro da mesma unidade.
4. Administrador técnico não recebe conteúdo de documento restrito por ter apenas papel técnico.
5. Substituto recebe a permissão delegada somente entre `start_date` e `end_date`.
6. Usuário de origem não move processo após perder a responsabilidade atual.
7. Unidade auditada não atualiza evidências, achados ou logs de auditoria.
8. Toda tentativa negada é registrada como evento de segurança/auditoria.

Os testes serão implementados como integração de API contra PostgreSQL com RLS habilitada e banco isolado por execução.
