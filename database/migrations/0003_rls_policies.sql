-- SIGLA-CMDC :: 0003 :: políticas RLS efetivas e testáveis.
-- Premissa de operação: a API conecta com um papel SEM BYPASSRLS (ex.: app_api)
-- e, a cada requisição autenticada, executa dentro da transação:
--     SET LOCAL app.user_id = '<uuid-do-usuario-institucional>';
-- Nenhuma política usa USING(true)/WITH CHECK(true).
-- As funções auxiliares são SECURITY DEFINER (executam como o dono da migration,
-- que ignora RLS) para evitar recursão de políticas ao consultarem as tabelas.
BEGIN;

-- ---------------------------------------------------------------------------
-- Funções de identidade e escopo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_is_authenticated() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_current_user_id() IS NOT NULL
     AND EXISTS (SELECT 1 FROM users u
                  WHERE u.id = app_current_user_id() AND u.is_active AND u.deleted_at IS NULL)
$$;

-- Unidades vigentes do usuário: lotação ativa OU substituição ativa dentro da vigência.
CREATE OR REPLACE FUNCTION app_effective_unit_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT wa.organizational_unit_id
    FROM work_assignments wa JOIN employees e ON e.id = wa.employee_id
   WHERE e.user_id = app_current_user_id()
     AND wa.starts_at <= now() AND (wa.ends_at IS NULL OR wa.ends_at > now())
  UNION
  SELECT ts.organizational_unit_id
    FROM temporary_substitutions ts JOIN employees e ON e.id = ts.substitute_employee_id
   WHERE e.user_id = app_current_user_id()
     AND ts.status = 'ACTIVE'
     AND ts.start_date <= current_date AND ts.end_date >= current_date
$$;

CREATE OR REPLACE FUNCTION app_has_permission(p_code text, p_unit uuid DEFAULT NULL) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions perm ON perm.id = rp.permission_id
     WHERE ur.user_id = app_current_user_id()
       AND perm.code = p_code
       AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())
       AND (p_unit IS NULL OR ur.organizational_unit_id IS NULL OR ur.organizational_unit_id = p_unit)
  )
$$;

-- ---------------------------------------------------------------------------
-- Regras de leitura de processo (identidade + lotação + participação +
-- relação institucional + classificação de acesso + alcance da restrição).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_can_read_process(p_id uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE p processes%ROWTYPE; in_scope boolean; is_participant boolean;
BEGIN
  IF NOT app_is_authenticated() THEN RETURN false; END IF;
  SELECT * INTO p FROM processes WHERE id = p_id;
  IF NOT FOUND OR p.deleted_at IS NOT NULL THEN RETURN false; END IF;

  is_participant := EXISTS (SELECT 1 FROM process_participants pp
                             WHERE pp.process_id = p_id AND pp.user_id = app_current_user_id());

  in_scope := is_participant
     OR p.responsible_unit_id IN (SELECT app_effective_unit_ids())
     OR p.origin_unit_id      IN (SELECT app_effective_unit_ids())
     OR EXISTS (SELECT 1 FROM process_participants pp
                 WHERE pp.process_id = p_id AND pp.organizational_unit_id IN (SELECT app_effective_unit_ids()))
     OR EXISTS (SELECT 1 FROM organizational_unit_relations r
                 WHERE r.is_active AND (r.ends_at IS NULL OR r.ends_at > now())
                   AND r.source_unit_id IN (SELECT app_effective_unit_ids())
                   AND r.target_unit_id IN (p.responsible_unit_id, p.origin_unit_id));

  IF NOT in_scope THEN RETURN false; END IF;

  IF p.visibility = 'RESTRICTED' THEN
    RETURN CASE p.restriction_scope
      WHEN 'ASSIGNED_USERS'           THEN is_participant
      WHEN 'SELECTED_USERS'           THEN is_participant
      WHEN 'ORIGINATING_UNIT'         THEN p.origin_unit_id      IN (SELECT app_effective_unit_ids())
      WHEN 'RESPONSIBLE_UNIT'         THEN p.responsible_unit_id IN (SELECT app_effective_unit_ids())
      WHEN 'SELECTED_UNITS'           THEN EXISTS (SELECT 1 FROM process_participants pp
                                                    WHERE pp.process_id=p_id
                                                      AND pp.organizational_unit_id IN (SELECT app_effective_unit_ids()))
      WHEN 'INSTITUTIONAL_LEADERSHIP' THEN app_has_permission('process.view.leadership')
      ELSE false
    END;
  END IF;

  RETURN true;
END; $$;

-- Responsabilidade atual: quem pode movimentar (lotado na unidade responsável
-- ou atribuído como responsável), sujeito a permissão no servidor/função.
CREATE OR REPLACE FUNCTION app_is_responsible_for_process(p_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_is_authenticated() AND EXISTS (
    SELECT 1 FROM processes p WHERE p.id = p_id AND p.deleted_at IS NULL
      AND (
        p.responsible_unit_id IN (SELECT app_effective_unit_ids())
        OR EXISTS (SELECT 1 FROM process_participants pp
                    WHERE pp.process_id = p_id AND pp.user_id = app_current_user_id()
                      AND pp.participant_role = 'RESPONSIBLE')
      )
  )
$$;

-- Leitura de documento (classificação própria, mais restritiva que a do processo).
CREATE OR REPLACE FUNCTION app_can_read_document(d_id uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE d documents%ROWTYPE; base boolean; me uuid := app_current_user_id();
BEGIN
  IF NOT app_is_authenticated() THEN RETURN false; END IF;
  SELECT * INTO d FROM documents WHERE id = d_id;
  IF NOT FOUND THEN RETURN false; END IF;

  base := (d.process_id IS NULL) OR app_can_read_process(d.process_id)
          OR d.created_by_user_id = me
          OR EXISTS (SELECT 1 FROM document_access_rules dar WHERE dar.document_id=d_id AND dar.user_id=me);
  IF NOT base THEN RETURN false; END IF;

  IF d.visibility = 'RESTRICTED' THEN
    RETURN d.created_by_user_id = me OR CASE d.restriction_scope
      WHEN 'SELECTED_USERS' THEN EXISTS (SELECT 1 FROM document_access_rules dar
                                          WHERE dar.document_id=d_id AND dar.user_id=me)
      WHEN 'ASSIGNED_USERS' THEN d.process_id IS NOT NULL AND EXISTS (
                                   SELECT 1 FROM process_participants pp
                                    WHERE pp.process_id=d.process_id AND pp.user_id=me)
      WHEN 'SELECTED_UNITS' THEN EXISTS (SELECT 1 FROM document_access_rules dar
                                          WHERE dar.document_id=d_id
                                            AND dar.organizational_unit_id IN (SELECT app_effective_unit_ids()))
      WHEN 'ORIGINATING_UNIT' THEN d.process_id IS NOT NULL AND EXISTS (
                                   SELECT 1 FROM processes p WHERE p.id=d.process_id
                                     AND p.origin_unit_id IN (SELECT app_effective_unit_ids()))
      WHEN 'RESPONSIBLE_UNIT' THEN d.process_id IS NOT NULL AND EXISTS (
                                   SELECT 1 FROM processes p WHERE p.id=d.process_id
                                     AND p.responsible_unit_id IN (SELECT app_effective_unit_ids()))
      WHEN 'INSTITUTIONAL_LEADERSHIP' THEN app_has_permission('process.view.leadership')
      ELSE false
    END;
  END IF;

  RETURN true;
END; $$;

-- ---------------------------------------------------------------------------
-- FORCE RLS garante que nem o dono das tabelas leia sem política. A API usa
-- papel dedicado sem BYPASSRLS; as funções transacionais (0004) são SECURITY
-- DEFINER e executam a escrita controlada.
-- ---------------------------------------------------------------------------
ALTER TABLE users                        FORCE ROW LEVEL SECURITY;
ALTER TABLE organizational_units         FORCE ROW LEVEL SECURITY;
ALTER TABLE organizational_unit_relations FORCE ROW LEVEL SECURITY;
ALTER TABLE processes                    FORCE ROW LEVEL SECURITY;
ALTER TABLE process_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_participants          FORCE ROW LEVEL SECURITY;
ALTER TABLE process_movements            FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks                        FORCE ROW LEVEL SECURITY;
ALTER TABLE deadlines                    FORCE ROW LEVEL SECURITY;
ALTER TABLE documents                    FORCE ROW LEVEL SECURITY;
ALTER TABLE document_versions            FORCE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments          FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                   FORCE ROW LEVEL SECURITY;

-- Helper para (re)criar política de forma idempotente.
-- (Postgres não tem CREATE POLICY IF NOT EXISTS; usamos DROP POLICY IF EXISTS.)

-- users -------------------------------------------------------------------
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT USING (
  app_is_authenticated() AND (
    id = app_current_user_id()
    OR EXISTS (SELECT 1 FROM work_assignments wa JOIN employees e ON e.id = wa.employee_id
                WHERE e.user_id = users.id
                  AND wa.organizational_unit_id IN (SELECT app_effective_unit_ids()))
    OR app_has_permission('user.admin')
  )
);
DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users FOR UPDATE
  USING (app_is_authenticated() AND (id = app_current_user_id() OR app_has_permission('user.admin')))
  WITH CHECK (app_is_authenticated() AND (id = app_current_user_id() OR app_has_permission('user.admin')));

-- organizational_units: estrutura interna legível por autenticados; escrita administrativa.
DROP POLICY IF EXISTS units_select ON organizational_units;
CREATE POLICY units_select ON organizational_units FOR SELECT
  USING (app_is_authenticated() AND is_active);
DROP POLICY IF EXISTS units_write ON organizational_units;
CREATE POLICY units_write ON organizational_units FOR ALL
  USING (app_has_permission('unit.admin'))
  WITH CHECK (app_has_permission('unit.admin'));

-- organizational_unit_relations
DROP POLICY IF EXISTS unit_relations_select ON organizational_unit_relations;
CREATE POLICY unit_relations_select ON organizational_unit_relations FOR SELECT
  USING (app_is_authenticated() AND (
    source_unit_id IN (SELECT app_effective_unit_ids())
    OR target_unit_id IN (SELECT app_effective_unit_ids())
    OR app_has_permission('unit.admin')
  ));
DROP POLICY IF EXISTS unit_relations_write ON organizational_unit_relations;
CREATE POLICY unit_relations_write ON organizational_unit_relations FOR ALL
  USING (app_has_permission('unit.admin'))
  WITH CHECK (app_has_permission('unit.admin'));

-- processes
DROP POLICY IF EXISTS processes_select ON processes;
CREATE POLICY processes_select ON processes FOR SELECT USING (app_can_read_process(id));
DROP POLICY IF EXISTS processes_insert ON processes;
CREATE POLICY processes_insert ON processes FOR INSERT WITH CHECK (
  app_is_authenticated()
  AND created_by_user_id = app_current_user_id()
  AND origin_unit_id IN (SELECT app_effective_unit_ids())
  AND app_has_permission('process.create')
);
DROP POLICY IF EXISTS processes_update ON processes;
CREATE POLICY processes_update ON processes FOR UPDATE
  USING (app_is_responsible_for_process(id))
  WITH CHECK (app_is_responsible_for_process(id));

-- process_participants
DROP POLICY IF EXISTS participants_select ON process_participants;
CREATE POLICY participants_select ON process_participants FOR SELECT
  USING (app_can_read_process(process_id));
DROP POLICY IF EXISTS participants_write ON process_participants;
CREATE POLICY participants_write ON process_participants FOR ALL
  USING (app_is_responsible_for_process(process_id) AND app_has_permission('process.assign'))
  WITH CHECK (app_is_responsible_for_process(process_id) AND app_has_permission('process.assign'));

-- process_movements: leitura por quem vê o processo; inserção por responsável;
-- alteração/remoção bloqueadas por trigger (append-only).
DROP POLICY IF EXISTS movements_select ON process_movements;
CREATE POLICY movements_select ON process_movements FOR SELECT
  USING (app_can_read_process(process_id));
DROP POLICY IF EXISTS movements_insert ON process_movements;
CREATE POLICY movements_insert ON process_movements FOR INSERT
  WITH CHECK (app_is_responsible_for_process(process_id) AND created_by_user_id = app_current_user_id());

-- tasks
DROP POLICY IF EXISTS tasks_select ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT USING (
  app_is_authenticated() AND (
    assigned_user_id = app_current_user_id()
    OR reviewer_user_id = app_current_user_id()
    OR assigned_unit_id IN (SELECT app_effective_unit_ids())
    OR (process_id IS NOT NULL AND app_can_read_process(process_id))
  )
);
DROP POLICY IF EXISTS tasks_insert ON tasks;
CREATE POLICY tasks_insert ON tasks FOR INSERT WITH CHECK (
  app_is_authenticated() AND created_by_user_id = app_current_user_id()
  AND (assigned_unit_id IN (SELECT app_effective_unit_ids())
       OR (process_id IS NOT NULL AND app_is_responsible_for_process(process_id)))
);
DROP POLICY IF EXISTS tasks_update ON tasks;
CREATE POLICY tasks_update ON tasks FOR UPDATE USING (
  app_is_authenticated() AND (
    assigned_user_id = app_current_user_id()
    OR reviewer_user_id = app_current_user_id()
    OR assigned_unit_id IN (SELECT app_effective_unit_ids())
  )
) WITH CHECK (
  app_is_authenticated() AND (
    assigned_user_id = app_current_user_id()
    OR reviewer_user_id = app_current_user_id()
    OR assigned_unit_id IN (SELECT app_effective_unit_ids())
  )
);

-- deadlines
DROP POLICY IF EXISTS deadlines_select ON deadlines;
CREATE POLICY deadlines_select ON deadlines FOR SELECT USING (
  app_is_authenticated() AND (
    (process_id IS NOT NULL AND app_can_read_process(process_id))
    OR (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = deadlines.task_id
          AND (t.assigned_user_id = app_current_user_id()
               OR t.assigned_unit_id IN (SELECT app_effective_unit_ids()))))
  )
);
DROP POLICY IF EXISTS deadlines_write ON deadlines;
CREATE POLICY deadlines_write ON deadlines FOR ALL USING (
  app_is_authenticated() AND process_id IS NOT NULL AND app_is_responsible_for_process(process_id)
) WITH CHECK (
  app_is_authenticated() AND created_by_user_id = app_current_user_id()
);

-- documents
DROP POLICY IF EXISTS documents_select ON documents;
CREATE POLICY documents_select ON documents FOR SELECT USING (app_can_read_document(id));
DROP POLICY IF EXISTS documents_insert ON documents;
CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (
  app_is_authenticated() AND created_by_user_id = app_current_user_id()
  AND app_has_permission('document.create')
  AND (process_id IS NULL OR app_can_read_process(process_id))
);
DROP POLICY IF EXISTS documents_update ON documents;
CREATE POLICY documents_update ON documents FOR UPDATE
  USING (app_is_authenticated() AND created_by_user_id = app_current_user_id())
  WITH CHECK (app_is_authenticated() AND created_by_user_id = app_current_user_id());

-- document_versions: leitura conforme documento; inserção pelo autor; alteração
-- de versão assinada é bloqueada por trigger em 0002.
DROP POLICY IF EXISTS versions_select ON document_versions;
CREATE POLICY versions_select ON document_versions FOR SELECT
  USING (app_can_read_document(document_id));
DROP POLICY IF EXISTS versions_insert ON document_versions;
CREATE POLICY versions_insert ON document_versions FOR INSERT
  WITH CHECK (app_is_authenticated() AND created_by_user_id = app_current_user_id()
              AND app_can_read_document(document_id));

-- document_attachments
DROP POLICY IF EXISTS attachments_select ON document_attachments;
CREATE POLICY attachments_select ON document_attachments FOR SELECT
  USING (app_can_read_document(document_id));
DROP POLICY IF EXISTS attachments_insert ON document_attachments;
CREATE POLICY attachments_insert ON document_attachments FOR INSERT
  WITH CHECK (app_is_authenticated() AND created_by_user_id = app_current_user_id()
              AND app_can_read_document(document_id));

-- audit_logs: leitura restrita a quem tem permissão de auditoria no escopo,
-- além do próprio ator. Sem UPDATE/DELETE (bloqueado por trigger append-only).
DROP POLICY IF EXISTS audit_select ON audit_logs;
CREATE POLICY audit_select ON audit_logs FOR SELECT USING (
  app_is_authenticated() AND (
    actor_user_id = app_current_user_id()
    OR (app_has_permission('audit.view.unit')
        AND (origin_unit_id IN (SELECT app_effective_unit_ids())
             OR destination_unit_id IN (SELECT app_effective_unit_ids())))
  )
);
DROP POLICY IF EXISTS audit_insert ON audit_logs;
CREATE POLICY audit_insert ON audit_logs FOR INSERT
  WITH CHECK (app_is_authenticated() AND actor_user_id = app_current_user_id());

COMMIT;
