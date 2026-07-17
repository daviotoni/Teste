-- SIGLA-CMDC :: 0004 :: procedimentos transacionais do núcleo.
-- Cada função executa, na MESMA transação: validação de identidade, papel e
-- unidade; validação de etapa/transição; validação de justificativa; alteração
-- da entidade; movimentação (quando aplicável); atualização de responsabilidade
-- e prazo (quando aplicável); e gravação do evento de auditoria.
-- São SECURITY DEFINER: a autorização é feita explicitamente dentro da função.
BEGIN;

-- Evento de auditoria (correlaciona request_id quando a API o define).
CREATE OR REPLACE FUNCTION sigla_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_origin uuid, p_dest uuid, p_prev jsonb, p_new jsonb, p_justif text
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, origin_unit_id,
                         destination_unit_id, previous_state, new_state, justification, request_id)
  VALUES (app_current_user_id(), p_action, p_entity_type, p_entity_id, p_origin, p_dest,
          p_prev, p_new, p_justif, NULLIF(current_setting('app.request_id', true), '')::uuid)
$$;

-- Resolve a identidade institucional a partir do subject do provedor de auth.
-- SECURITY DEFINER: executa a busca antes de app.user_id existir (a API precisa
-- do id institucional para então aplicar o contexto RLS). Não expõe conteúdo.
CREATE OR REPLACE FUNCTION sigla_resolve_identity(p_auth_subject uuid)
RETURNS TABLE(id uuid, display_name text, email text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, display_name, email FROM users
   WHERE auth_subject = p_auth_subject AND is_active AND deleted_at IS NULL
$$;

-- Emissão de número único e imutável a partir da regra de numeração vigente.
CREATE OR REPLACE FUNCTION sigla_issue_number(
  p_type text, p_unit uuid, p_entity_type text, p_entity_id uuid
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rule numbering_rules%ROWTYPE; yr integer := extract(year from now())::int; seq integer; num text;
BEGIN
  SELECT * INTO rule FROM numbering_rules
   WHERE document_or_process_type = p_type AND active
     AND (organizational_unit_id = p_unit OR organizational_unit_id IS NULL)
   ORDER BY organizational_unit_id NULLS LAST
   LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'sem regra de numeração para o tipo %', p_type USING ERRCODE='22023'; END IF;
  IF NOT rule.annual_reset THEN yr := 0; END IF;

  INSERT INTO numbering_sequences(numbering_rule_id, reference_year, last_value)
    VALUES (rule.id, yr, rule.starting_number - 1)
    ON CONFLICT (numbering_rule_id, reference_year) DO NOTHING;
  UPDATE numbering_sequences SET last_value = last_value + 1
    WHERE numbering_rule_id = rule.id AND reference_year = yr
    RETURNING last_value INTO seq;

  num := COALESCE(rule.prefix,'')
       || CASE WHEN rule.prefix IS NOT NULL THEN rule.separator ELSE '' END
       || lpad(seq::text, rule.number_length, '0')
       || CASE WHEN rule.annual_reset THEN rule.separator || yr::text ELSE '' END
       || COALESCE(rule.suffix,'');

  INSERT INTO issued_numbers(numbering_rule_id, reference_year, sequence_value, issued_number,
                             entity_type, entity_id, status, issued_by_user_id)
    VALUES (rule.id, yr, seq, num, p_entity_type, p_entity_id, 'ISSUED', app_current_user_id());
  RETURN num;
END; $$;

-- Criar processo -----------------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_create_process(
  p_process_type_code text, p_workflow_code text, p_subject text,
  p_origin_unit_id uuid, p_responsible_unit_id uuid,
  p_priority text DEFAULT 'NORMAL', p_visibility text DEFAULT 'INTERNAL',
  p_restriction_reason text DEFAULT NULL, p_restriction_scope text DEFAULT NULL
) RETURNS processes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE ptype uuid; wf uuid; initial_step uuid; new_row processes%ROWTYPE; num text;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  IF NOT app_has_permission('process.create', p_origin_unit_id) THEN
    RAISE EXCEPTION 'sem permissão para criar processo' USING ERRCODE='42501'; END IF;
  IF p_origin_unit_id NOT IN (SELECT app_effective_unit_ids()) THEN
    RAISE EXCEPTION 'unidade de origem fora da lotação vigente' USING ERRCODE='42501'; END IF;
  IF p_subject IS NULL OR length(btrim(p_subject)) = 0 THEN
    RAISE EXCEPTION 'assunto obrigatório' USING ERRCODE='22023'; END IF;

  SELECT id INTO ptype FROM process_types WHERE code = p_process_type_code AND is_active;
  IF ptype IS NULL THEN RAISE EXCEPTION 'tipo de processo inválido: %', p_process_type_code USING ERRCODE='22023'; END IF;

  IF p_workflow_code IS NOT NULL THEN
    SELECT id INTO wf FROM workflow_definitions WHERE code = p_workflow_code AND is_active;
    IF wf IS NULL THEN RAISE EXCEPTION 'workflow inválido: %', p_workflow_code USING ERRCODE='22023'; END IF;
    SELECT id INTO initial_step FROM workflow_steps WHERE workflow_id = wf AND is_initial ORDER BY sort_order LIMIT 1;
  END IF;

  INSERT INTO processes(process_type_id, workflow_id, current_step_id, subject, origin_unit_id, responsible_unit_id,
                        visibility, restriction_reason, restriction_scope, status, priority, opened_at, created_by_user_id)
  VALUES (ptype, wf, initial_step, p_subject, p_origin_unit_id, p_responsible_unit_id,
          p_visibility::access_visibility, p_restriction_reason::access_reason, p_restriction_scope::access_scope,
          'OPEN', p_priority, now(), app_current_user_id())
  RETURNING * INTO new_row;

  num := sigla_issue_number(p_process_type_code, p_origin_unit_id, 'process', new_row.id);
  UPDATE processes SET number = num WHERE id = new_row.id RETURNING * INTO new_row;

  INSERT INTO process_participants(process_id, user_id, participant_role)
    VALUES (new_row.id, app_current_user_id(), 'AUTHOR');
  INSERT INTO process_participants(process_id, organizational_unit_id, participant_role)
    VALUES (new_row.id, p_responsible_unit_id, 'RESPONSIBLE');

  INSERT INTO process_movements(process_id, to_unit_id, previous_step_id, new_step_id,
                                previous_status, new_status, justification, created_by_user_id)
  VALUES (new_row.id, p_responsible_unit_id, NULL, initial_step, NULL, 'OPEN',
          'Criação do processo', app_current_user_id());

  PERFORM sigla_audit('process.create','process',new_row.id, p_origin_unit_id, p_responsible_unit_id,
                      NULL, to_jsonb(new_row), NULL);
  RETURN new_row;
END; $$;

-- Movimentar processo ------------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_move_process(
  p_id uuid, p_to_unit uuid, p_to_user uuid, p_new_step uuid, p_new_status text,
  p_due_at timestamptz, p_justification text, p_expected_version integer DEFAULT NULL
) RETURNS processes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE p processes%ROWTYPE; tr workflow_step_transitions%ROWTYPE; new_row processes%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  SELECT * INTO p FROM processes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR p.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'processo inexistente' USING ERRCODE='P0002'; END IF;
  IF p_expected_version IS NOT NULL AND p.version <> p_expected_version THEN
    RAISE EXCEPTION 'conflito de concorrência otimista (versão esperada % atual %)', p_expected_version, p.version USING ERRCODE='40001';
  END IF;
  IF NOT app_is_responsible_for_process(p_id) THEN
    RAISE EXCEPTION 'usuário sem responsabilidade atual sobre o processo' USING ERRCODE='42501'; END IF;

  IF p.workflow_id IS NOT NULL AND p_new_step IS NOT NULL THEN
    SELECT * INTO tr FROM workflow_step_transitions
      WHERE workflow_id = p.workflow_id AND from_step_id = p.current_step_id AND to_step_id = p_new_step;
    IF NOT FOUND THEN RAISE EXCEPTION 'transição de workflow inválida' USING ERRCODE='22023'; END IF;
    IF tr.required_permission_code IS NOT NULL
       AND NOT app_has_permission(tr.required_permission_code, p.responsible_unit_id) THEN
      RAISE EXCEPTION 'sem permissão % para a transição', tr.required_permission_code USING ERRCODE='42501'; END IF;
    IF tr.requires_justification AND (p_justification IS NULL OR length(btrim(p_justification)) = 0) THEN
      RAISE EXCEPTION 'justificativa obrigatória para esta transição' USING ERRCODE='22023'; END IF;
  END IF;

  UPDATE processes SET
    current_step_id     = COALESCE(p_new_step, current_step_id),
    responsible_unit_id = COALESCE(p_to_unit, responsible_unit_id),
    status              = COALESCE(p_new_status, status)
  WHERE id = p_id RETURNING * INTO new_row;

  INSERT INTO process_movements(process_id, from_unit_id, to_unit_id, to_user_id,
    previous_step_id, new_step_id, previous_status, new_status, previous_due_at, new_due_at,
    justification, created_by_user_id)
  VALUES (p_id, p.responsible_unit_id, p_to_unit, p_to_user,
    p.current_step_id, p_new_step, p.status, COALESCE(p_new_status, p.status), NULL, p_due_at,
    p_justification, app_current_user_id());

  IF p_to_user IS NOT NULL THEN
    DELETE FROM process_participants WHERE process_id = p_id AND participant_role = 'RESPONSIBLE' AND user_id IS NOT NULL;
    INSERT INTO process_participants(process_id, user_id, participant_role) VALUES (p_id, p_to_user, 'RESPONSIBLE');
  END IF;
  IF p_to_unit IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM process_participants WHERE process_id = p_id AND organizational_unit_id = p_to_unit AND participant_role = 'RESPONSIBLE') THEN
    INSERT INTO process_participants(process_id, organizational_unit_id, participant_role) VALUES (p_id, p_to_unit, 'RESPONSIBLE');
  END IF;
  IF p_due_at IS NOT NULL THEN
    INSERT INTO deadlines(process_id, due_at, status, created_by_user_id) VALUES (p_id, p_due_at, 'OPEN', app_current_user_id());
  END IF;

  PERFORM sigla_audit('process.move','process',p_id, p.responsible_unit_id, p_to_unit,
                      to_jsonb(p), to_jsonb(new_row), p_justification);
  RETURN new_row;
END; $$;

-- Atribuir/redistribuir processo ------------------------------------------
CREATE OR REPLACE FUNCTION sigla_assign_process(
  p_id uuid, p_to_user uuid, p_justification text, p_expected_version integer DEFAULT NULL
) RETURNS processes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE p processes%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  SELECT * INTO p FROM processes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'processo inexistente' USING ERRCODE='P0002'; END IF;
  IF p_expected_version IS NOT NULL AND p.version <> p_expected_version THEN
    RAISE EXCEPTION 'conflito de concorrência otimista' USING ERRCODE='40001'; END IF;
  IF NOT (app_is_responsible_for_process(p_id) AND app_has_permission('process.assign', p.responsible_unit_id)) THEN
    RAISE EXCEPTION 'sem permissão para distribuir o processo' USING ERRCODE='42501'; END IF;

  DELETE FROM process_participants WHERE process_id = p_id AND participant_role = 'RESPONSIBLE' AND user_id IS NOT NULL;
  INSERT INTO process_participants(process_id, user_id, participant_role) VALUES (p_id, p_to_user, 'RESPONSIBLE');
  UPDATE processes SET status = 'ASSIGNED' WHERE id = p_id;

  INSERT INTO process_movements(process_id, from_unit_id, to_unit_id, to_user_id,
    previous_step_id, new_step_id, previous_status, new_status, justification, created_by_user_id)
  VALUES (p_id, p.responsible_unit_id, p.responsible_unit_id, p_to_user,
    p.current_step_id, p.current_step_id, p.status, 'ASSIGNED', p_justification, app_current_user_id());

  PERFORM sigla_audit('process.assign','process',p_id, p.responsible_unit_id, p.responsible_unit_id,
                      to_jsonb(p), jsonb_build_object('assigned_user_id', p_to_user), p_justification);
  RETURN (SELECT pr FROM processes pr WHERE pr.id = p_id);
END; $$;

-- Criar tarefa -------------------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_create_task(
  p_process_id uuid, p_title text, p_description text,
  p_assigned_unit_id uuid, p_assigned_user_id uuid, p_due_at timestamptz
) RETURNS tasks LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE t tasks%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  IF p_title IS NULL OR length(btrim(p_title)) = 0 THEN RAISE EXCEPTION 'título obrigatório' USING ERRCODE='22023'; END IF;
  IF p_process_id IS NOT NULL AND NOT app_is_responsible_for_process(p_process_id)
     AND (p_assigned_unit_id IS NULL OR p_assigned_unit_id NOT IN (SELECT app_effective_unit_ids())) THEN
    RAISE EXCEPTION 'sem escopo para criar tarefa neste processo' USING ERRCODE='42501'; END IF;

  INSERT INTO tasks(process_id, title, description, assigned_unit_id, assigned_user_id, status, due_at, created_by_user_id)
  VALUES (p_process_id, p_title, p_description, p_assigned_unit_id, p_assigned_user_id, 'OPEN', p_due_at, app_current_user_id())
  RETURNING * INTO t;
  IF p_due_at IS NOT NULL THEN
    INSERT INTO deadlines(task_id, due_at, status, created_by_user_id) VALUES (t.id, p_due_at, 'OPEN', app_current_user_id());
  END IF;
  PERFORM sigla_audit('task.create','task',t.id, p_assigned_unit_id, NULL, NULL, to_jsonb(t), NULL);
  RETURN t;
END; $$;

-- Alterar prazo ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_change_deadline(
  p_deadline_id uuid, p_new_due_at timestamptz, p_new_status text, p_justification text, p_expected_version integer DEFAULT NULL
) RETURNS deadlines LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE d deadlines%ROWTYPE; nd deadlines%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  SELECT * INTO d FROM deadlines WHERE id = p_deadline_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'prazo inexistente' USING ERRCODE='P0002'; END IF;
  IF p_expected_version IS NOT NULL AND d.version <> p_expected_version THEN
    RAISE EXCEPTION 'conflito de concorrência otimista' USING ERRCODE='40001'; END IF;
  IF d.process_id IS NOT NULL AND NOT app_is_responsible_for_process(d.process_id) THEN
    RAISE EXCEPTION 'sem responsabilidade para alterar o prazo' USING ERRCODE='42501'; END IF;

  UPDATE deadlines SET due_at = COALESCE(p_new_due_at, due_at), status = COALESCE(p_new_status, status),
                       suspension_reason = COALESCE(p_justification, suspension_reason)
   WHERE id = p_deadline_id RETURNING * INTO nd;
  PERFORM sigla_audit('deadline.change','deadline',p_deadline_id, NULL, NULL, to_jsonb(d), to_jsonb(nd), p_justification);
  RETURN nd;
END; $$;

-- Criar documento ----------------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_create_document(
  p_process_id uuid, p_document_type_code text, p_title text,
  p_visibility text DEFAULT 'INTERNAL', p_restriction_reason text DEFAULT NULL, p_restriction_scope text DEFAULT NULL
) RETURNS documents LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE dt uuid; d documents%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  IF NOT app_has_permission('document.create') THEN RAISE EXCEPTION 'sem permissão para criar documento' USING ERRCODE='42501'; END IF;
  IF p_process_id IS NOT NULL AND NOT app_can_read_process(p_process_id) THEN
    RAISE EXCEPTION 'sem acesso ao processo do documento' USING ERRCODE='42501'; END IF;
  SELECT id INTO dt FROM document_types WHERE code = p_document_type_code AND is_active;
  IF dt IS NULL THEN RAISE EXCEPTION 'tipo de documento inválido: %', p_document_type_code USING ERRCODE='22023'; END IF;

  INSERT INTO documents(process_id, document_type_id, title, visibility, restriction_reason, restriction_scope, status, created_by_user_id)
  VALUES (p_process_id, dt, p_title, p_visibility::access_visibility, p_restriction_reason::access_reason,
          p_restriction_scope::access_scope, 'DRAFT', app_current_user_id())
  RETURNING * INTO d;
  PERFORM sigla_audit('document.create','document',d.id, NULL, NULL, NULL, to_jsonb(d), NULL);
  RETURN d;
END; $$;

-- Criar versão de documento ------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_create_document_version(
  p_document_id uuid, p_content text, p_storage_key text, p_original_file_name text,
  p_mime_type text, p_byte_size bigint, p_sha256 char(64)
) RETURNS document_versions LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE nextnum integer; v document_versions%ROWTYPE;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  IF NOT app_can_read_document(p_document_id) THEN RAISE EXCEPTION 'sem acesso ao documento' USING ERRCODE='42501'; END IF;
  SELECT COALESCE(max(version_number),0) + 1 INTO nextnum FROM document_versions WHERE document_id = p_document_id;

  INSERT INTO document_versions(document_id, version_number, content, storage_key, original_file_name,
                                mime_type, byte_size, sha256, status, created_by_user_id)
  VALUES (p_document_id, nextnum, p_content, p_storage_key, p_original_file_name, p_mime_type, p_byte_size,
          p_sha256, 'DRAFT', app_current_user_id())
  RETURNING * INTO v;
  UPDATE documents SET current_version_id = v.id WHERE id = p_document_id;
  PERFORM sigla_audit('document.version.create','document_version',v.id, NULL, NULL, NULL, to_jsonb(v), NULL);
  RETURN v;
END; $$;

-- Solicitar assinatura -----------------------------------------------------
CREATE OR REPLACE FUNCTION sigla_request_signature(
  p_document_version_id uuid, p_signer_user_id uuid, p_level text, p_provider_code text
) RETURNS signatures LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE s signatures%ROWTYPE; doc_id uuid;
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  SELECT document_id INTO doc_id FROM document_versions WHERE id = p_document_version_id;
  IF doc_id IS NULL THEN RAISE EXCEPTION 'versão inexistente' USING ERRCODE='P0002'; END IF;
  IF NOT app_can_read_document(doc_id) THEN RAISE EXCEPTION 'sem acesso ao documento' USING ERRCODE='42501'; END IF;

  INSERT INTO signatures(document_version_id, signer_user_id, level, provider_code, status)
  VALUES (p_document_version_id, p_signer_user_id, p_level::signature_level, p_provider_code, 'PENDING')
  RETURNING * INTO s;
  UPDATE document_versions SET status = 'SIGNATURE_REQUESTED' WHERE id = p_document_version_id;
  PERFORM sigla_audit('signature.request','signature',s.id, NULL, NULL, NULL, to_jsonb(s), NULL);
  RETURN s;
END; $$;

-- Registrar acesso a conteúdo restrito -------------------------------------
CREATE OR REPLACE FUNCTION sigla_log_restricted_access(
  p_entity_type text, p_entity_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT app_is_authenticated() THEN RAISE EXCEPTION 'não autenticado' USING ERRCODE='28000'; END IF;
  PERFORM sigla_audit('access.restricted', p_entity_type, p_entity_id, NULL, NULL, NULL,
                      jsonb_build_object('accessed_at', now()), NULL);
END; $$;

-- Concessão opcional ao papel de aplicação (quando existir no ambiente).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_api') THEN
    GRANT USAGE ON SCHEMA public TO app_api;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_api;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_api;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_api;
  END IF;
END $$;

COMMIT;
