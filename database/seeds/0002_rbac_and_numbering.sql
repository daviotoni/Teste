-- SIGLA-CMDC :: seed 0002 :: RBAC (papel->permissão) e regras de numeração.
-- Aplicar DEPOIS das migrations 0001..0004 e do seed 0001.
-- NÃO contém nomes, e-mails, telefones ou responsáveis reais.
BEGIN;

-- Permissões adicionais usadas pelas funções transacionais e RLS.
INSERT INTO permissions(code,name,description) VALUES
  ('process.create','Criar processo','Abre processo na própria unidade de origem'),
  ('process.view.leadership','Consultar como liderança institucional','Acesso a classificação de alcance de liderança'),
  ('user.admin','Administrar usuários','Gestão de contas institucionais, sem acesso a conteúdo restrito'),
  ('unit.admin','Administrar unidades','Gestão de unidades e relações institucionais')
ON CONFLICT (code) DO NOTHING;

-- Vínculos papel -> permissão (matriz inicial de docs/permission-matrix.md).
-- Chefia de unidade
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = ANY (ARRAY[
  'process.view.own_unit','process.create','process.assign','process.forward','document.create'
]) WHERE r.code = 'UNIT_MANAGER'
ON CONFLICT DO NOTHING;

-- Servidor de unidade (escopo de execução; sem distribuir por padrão)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = ANY (ARRAY[
  'process.view.own_unit','process.create','document.create'
]) WHERE r.code = 'UNIT_STAFF'
ON CONFLICT DO NOTHING;

-- Administrador técnico: administração de contas/estrutura, NUNCA conteúdo.
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = ANY (ARRAY[
  'user.admin','unit.admin'
]) WHERE r.code = 'SYSTEM_ADMINISTRATOR'
ON CONFLICT DO NOTHING;

-- Uma regra de numeração por tipo de processo (prefixo PROC, reset anual).
-- NOT EXISTS garante idempotência independentemente de índices.
INSERT INTO numbering_rules(document_or_process_type, organizational_unit_id, prefix, separator, number_length, annual_reset, starting_number, active)
SELECT pt.code, NULL, 'PROC', '/', 5, true, 1, true
FROM process_types pt
WHERE NOT EXISTS (
  SELECT 1 FROM numbering_rules nr
   WHERE nr.document_or_process_type = pt.code AND nr.organizational_unit_id IS NULL
);

COMMIT;
