-- Enforce cross-record integrity and make the first RLS rules executable.
BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE employees ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE positions ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE trust_functions ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE legal_competencies ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trust_functions_updated_at BEFORE UPDATE ON trust_functions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER competencies_updated_at BEFORE UPDATE ON legal_competencies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_id_workflow_unique UNIQUE (id, workflow_id);
ALTER TABLE processes ADD CONSTRAINT processes_step_in_workflow_fk FOREIGN KEY (current_step_id, workflow_id) REFERENCES workflow_steps(id, workflow_id) DEFERRABLE INITIALLY DEFERRED;

CREATE OR REPLACE FUNCTION verify_document_current_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_version_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM document_versions WHERE id = NEW.current_version_id AND document_id = NEW.id
  ) THEN RAISE EXCEPTION 'current_version_id must belong to its document'; END IF;
  RETURN NEW;
END; $$;
CREATE CONSTRAINT TRIGGER documents_current_version_same_document
AFTER INSERT OR UPDATE OF current_version_id ON documents DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION verify_document_current_version();

ALTER TABLE workflow_step_transitions ADD CONSTRAINT transition_permission_fk FOREIGN KEY (required_permission_code) REFERENCES permissions(code);
ALTER TABLE numbering_rules ADD CONSTRAINT numbering_type_exists CHECK (document_or_process_type <> '');
ALTER TABLE work_assignments ADD CONSTRAINT one_active_primary_assignment_per_employee EXCLUDE USING gist (employee_id WITH =, tstzrange(starts_at, COALESCE(ends_at, 'infinity'), '[)') WITH &&) WHERE (is_primary);

CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT id FROM users WHERE auth_subject = COALESCE(NULLIF(current_setting('app.user_id', true), '')::uuid, auth.uid());
$$;
CREATE OR REPLACE FUNCTION can_access_process(target_process_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM processes p
    WHERE p.id = target_process_id AND app_user_id() IS NOT NULL AND (
      p.visibility <> 'RESTRICTED'
      OR EXISTS (SELECT 1 FROM process_participants pp WHERE pp.process_id = p.id AND pp.user_id = app_user_id())
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = app_user_id() AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())
          AND (ur.organizational_unit_id = p.origin_unit_id OR ur.organizational_unit_id = p.responsible_unit_id)
      )
    )
  );
$$;

CREATE POLICY processes_read_authorized ON processes FOR SELECT USING (can_access_process(id));
CREATE POLICY process_participants_read_authorized ON process_participants FOR SELECT USING (can_access_process(process_id));
CREATE POLICY movements_read_authorized ON process_movements FOR SELECT USING (can_access_process(process_id));
CREATE POLICY tasks_read_authorized ON tasks FOR SELECT USING (process_id IS NULL OR can_access_process(process_id));
CREATE POLICY deadlines_read_authorized ON deadlines FOR SELECT USING ((process_id IS NOT NULL AND can_access_process(process_id)) OR (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = deadlines.task_id AND (t.process_id IS NULL OR can_access_process(t.process_id)))));
CREATE POLICY documents_read_authorized ON documents FOR SELECT USING ((process_id IS NOT NULL AND can_access_process(process_id)) OR (visibility <> 'RESTRICTED'));
CREATE POLICY document_versions_read_authorized ON document_versions FOR SELECT USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND ((d.process_id IS NOT NULL AND can_access_process(d.process_id)) OR d.visibility <> 'RESTRICTED')));
CREATE POLICY units_read_authenticated ON organizational_units FOR SELECT USING (app_user_id() IS NOT NULL);
CREATE POLICY relations_read_authenticated ON organizational_unit_relations FOR SELECT USING (app_user_id() IS NOT NULL);
CREATE POLICY own_user_read ON users FOR SELECT USING (id = app_user_id());

CREATE POLICY processes_create_authorized ON processes FOR INSERT WITH CHECK (
  created_by_user_id = app_user_id()
  AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = app_user_id() AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now()) AND ur.organizational_unit_id = origin_unit_id)
);

CREATE OR REPLACE FUNCTION create_process(
  input_process_type_id uuid, input_subject text, input_origin_unit_id uuid,
  input_responsible_unit_id uuid, input_workflow_id uuid DEFAULT NULL
) RETURNS processes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result processes;
BEGIN
  IF app_user_id() IS NULL THEN RAISE EXCEPTION 'authenticated institutional user is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = app_user_id() AND ur.organizational_unit_id = input_origin_unit_id AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())) THEN
    RAISE EXCEPTION 'active assignment in the origin unit is required';
  END IF;
  INSERT INTO processes (process_type_id, workflow_id, subject, origin_unit_id, responsible_unit_id, created_by_user_id, opened_at, status)
  VALUES (input_process_type_id, input_workflow_id, input_subject, input_origin_unit_id, input_responsible_unit_id, app_user_id(), now(), 'OPEN') RETURNING * INTO result;
  INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, origin_unit_id, destination_unit_id, new_state)
  VALUES (app_user_id(), 'PROCESS_CREATED', 'process', result.id, input_origin_unit_id, input_responsible_unit_id, jsonb_build_object('status', result.status));
  RETURN result;
END; $$;

COMMIT;
