-- SIGLA-CMDC: institutional core and pilot workflow.
-- This migration intentionally does not import prototype JSON data. See docs/migration-plan.md.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Preserve the prototype table if it exists. The normalized `users` table below is authoritative.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'data') THEN
    ALTER TABLE public.users RENAME TO legacy_users_prototype;
  END IF;
END $$;

CREATE TYPE organizational_unit_kind AS ENUM ('ADMINISTRATIVE', 'POLITICAL_INSTITUTIONAL', 'LEGISLATIVE');
CREATE TYPE relationship_kind AS ENUM ('HIERARCHICAL', 'SUPERVISORY', 'FUNCTIONAL', 'ADVISORY', 'POLITICAL_COMMAND', 'LEGISLATIVE_SUPPORT');
CREATE TYPE access_visibility AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED');
CREATE TYPE access_reason AS ENUM ('PERSONAL_DATA', 'SENSITIVE_PERSONAL_DATA', 'LEGAL_PRIVILEGE', 'JUDICIAL_SECRECY', 'AUDIT_WORKING_PAPER', 'OMBUDSMAN_IDENTITY', 'SECURITY_INFORMATION', 'PERSONNEL_INFORMATION', 'CONTRACTUAL_CONFIDENTIALITY', 'OTHER_LEGAL_RESTRICTION');
CREATE TYPE access_scope AS ENUM ('ASSIGNED_USERS', 'ORIGINATING_UNIT', 'RESPONSIBLE_UNIT', 'SELECTED_UNITS', 'SELECTED_USERS', 'INSTITUTIONAL_LEADERSHIP');
CREATE TYPE signature_level AS ENUM ('SIMPLE', 'ADVANCED', 'QUALIFIED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject uuid UNIQUE,
  display_name text NOT NULL,
  email text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES users(id),
  registration_number text UNIQUE, full_name text NOT NULL, government_id text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE organizational_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, official_name text NOT NULL,
  official_acronym text, unit_kind organizational_unit_kind NOT NULL, legal_basis text, functional_level smallint,
  phone text, email text, physical_location text, opening_hours text, is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  CHECK ((unit_kind = 'POLITICAL_INSTITUTIONAL') = (functional_level IS NULL))
);
CREATE TABLE organizational_unit_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_unit_id uuid NOT NULL REFERENCES organizational_units(id),
  target_unit_id uuid NOT NULL REFERENCES organizational_units(id), relationship_type relationship_kind NOT NULL,
  legal_basis text, starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by_user_id uuid REFERENCES users(id),
  CHECK (source_unit_id <> target_unit_id), CHECK (ends_at IS NULL OR ends_at > starts_at),
  UNIQUE (source_unit_id, target_unit_id, relationship_type, starts_at)
);
CREATE TABLE positions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, official_name text NOT NULL, legal_basis text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE commissioned_positions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), position_id uuid NOT NULL UNIQUE REFERENCES positions(id), symbol text, quantity integer CHECK (quantity IS NULL OR quantity >= 0), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE trust_functions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, official_name text NOT NULL, symbol text, requires_two_years_service boolean NOT NULL DEFAULT false, legal_basis text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE appointments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES employees(id), position_id uuid NOT NULL REFERENCES positions(id), organizational_unit_id uuid REFERENCES organizational_units(id), appointment_act text NOT NULL, appointment_act_date date NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at IS NULL OR ends_at > starts_at));
CREATE TABLE designations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES employees(id), trust_function_id uuid REFERENCES trust_functions(id), organizational_unit_id uuid NOT NULL REFERENCES organizational_units(id), legal_act text NOT NULL, legal_act_date date NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at IS NULL OR ends_at > starts_at));
CREATE TABLE work_assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES employees(id), organizational_unit_id uuid NOT NULL REFERENCES organizational_units(id), appointment_id uuid REFERENCES appointments(id), designation_id uuid REFERENCES designations(id), starts_at timestamptz NOT NULL, ends_at timestamptz, is_primary boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_at IS NULL OR ends_at > starts_at));
CREATE TABLE temporary_substitutions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titular_employee_id uuid NOT NULL REFERENCES employees(id), substitute_employee_id uuid NOT NULL REFERENCES employees(id), organizational_unit_id uuid NOT NULL REFERENCES organizational_units(id), position_id uuid REFERENCES positions(id), start_date date NOT NULL, end_date date NOT NULL, legal_act text NOT NULL, legal_act_date date NOT NULL, reason text NOT NULL, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(), CHECK (titular_employee_id <> substitute_employee_id), CHECK (end_date >= start_date));

CREATE TABLE legal_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), law_number text NOT NULL, law_year integer NOT NULL, article text NOT NULL,
  paragraph text, item text, subitem text, official_text text NOT NULL, organizational_unit_id uuid REFERENCES organizational_units(id),
  position_id uuid REFERENCES positions(id), effective_from date NOT NULL, effective_until date, status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_until IS NULL OR effective_until >= effective_from)
);
CREATE TABLE system_capabilities (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, nature text NOT NULL CHECK (nature IN ('LEGAL_REQUIREMENT','OPERATIONAL_INTERPRETATION','ADMINISTRATIVE_DECISION','SYSTEM_SUPPORT')), description text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE competency_capability_links (competency_id uuid NOT NULL REFERENCES legal_competencies(id), capability_id uuid NOT NULL REFERENCES system_capabilities(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (competency_id, capability_id));

CREATE TABLE roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, description text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE role_permissions (role_id uuid NOT NULL REFERENCES roles(id), permission_id uuid NOT NULL REFERENCES permissions(id), PRIMARY KEY(role_id, permission_id));
CREATE TABLE user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), role_id uuid NOT NULL REFERENCES roles(id), organizational_unit_id uuid REFERENCES organizational_units(id), starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, granted_by_user_id uuid REFERENCES users(id), CHECK (ends_at IS NULL OR ends_at > starts_at));

CREATE TABLE process_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE workflow_definitions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, process_type_id uuid NOT NULL REFERENCES process_types(id), version integer NOT NULL DEFAULT 1, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(process_type_id, version));
CREATE TABLE workflow_steps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow_id uuid NOT NULL REFERENCES workflow_definitions(id), code text NOT NULL, name text NOT NULL, sort_order integer NOT NULL, is_initial boolean NOT NULL DEFAULT false, is_terminal boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workflow_id, code), UNIQUE(workflow_id, sort_order));
CREATE TABLE workflow_step_transitions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow_id uuid NOT NULL REFERENCES workflow_definitions(id), from_step_id uuid NOT NULL REFERENCES workflow_steps(id), to_step_id uuid NOT NULL REFERENCES workflow_steps(id), required_permission_code text, requires_justification boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workflow_id, from_step_id, to_step_id), CHECK (from_step_id <> to_step_id));
CREATE TABLE processes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_type_id uuid NOT NULL REFERENCES process_types(id), workflow_id uuid REFERENCES workflow_definitions(id), current_step_id uuid REFERENCES workflow_steps(id), number text UNIQUE, legacy_number text, subject text NOT NULL, origin_unit_id uuid NOT NULL REFERENCES organizational_units(id), responsible_unit_id uuid NOT NULL REFERENCES organizational_units(id), visibility access_visibility NOT NULL DEFAULT 'INTERNAL', restriction_reason access_reason, restriction_scope access_scope, status text NOT NULL DEFAULT 'DRAFT', priority text NOT NULL DEFAULT 'NORMAL', version integer NOT NULL DEFAULT 1 CHECK(version > 0), opened_at timestamptz, closed_at timestamptz, cancelled_at timestamptz, created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, CHECK ((visibility = 'RESTRICTED') = (restriction_reason IS NOT NULL AND restriction_scope IS NOT NULL)));
CREATE TABLE process_participants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_id uuid NOT NULL REFERENCES processes(id), user_id uuid REFERENCES users(id), organizational_unit_id uuid REFERENCES organizational_units(id), participant_role text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK (user_id IS NOT NULL OR organizational_unit_id IS NOT NULL));
CREATE TABLE process_movements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_id uuid NOT NULL REFERENCES processes(id), from_unit_id uuid REFERENCES organizational_units(id), to_unit_id uuid REFERENCES organizational_units(id), from_user_id uuid REFERENCES users(id), to_user_id uuid REFERENCES users(id), previous_step_id uuid REFERENCES workflow_steps(id), new_step_id uuid REFERENCES workflow_steps(id), previous_status text, new_status text NOT NULL, previous_due_at timestamptz, new_due_at timestamptz, justification text, occurred_at timestamptz NOT NULL DEFAULT now(), created_by_user_id uuid NOT NULL REFERENCES users(id));
CREATE TABLE tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_id uuid REFERENCES processes(id), title text NOT NULL, description text, assigned_unit_id uuid REFERENCES organizational_units(id), assigned_user_id uuid REFERENCES users(id), reviewer_user_id uuid REFERENCES users(id), status text NOT NULL DEFAULT 'OPEN', due_at timestamptz, completed_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK(version > 0), created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE deadlines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_id uuid REFERENCES processes(id), task_id uuid REFERENCES tasks(id), due_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'OPEN', suspension_reason text, version integer NOT NULL DEFAULT 1 CHECK(version > 0), created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (process_id IS NOT NULL OR task_id IS NOT NULL));
CREATE TABLE document_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), process_id uuid REFERENCES processes(id), document_type_id uuid NOT NULL REFERENCES document_types(id), number text UNIQUE, title text NOT NULL, visibility access_visibility NOT NULL DEFAULT 'INTERNAL', restriction_reason access_reason, restriction_scope access_scope, current_version_id uuid, status text NOT NULL DEFAULT 'DRAFT', version integer NOT NULL DEFAULT 1 CHECK(version > 0), created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK ((visibility = 'RESTRICTED') = (restriction_reason IS NOT NULL AND restriction_scope IS NOT NULL)));
CREATE TABLE document_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id), version_number integer NOT NULL, content text, storage_key text, original_file_name text, mime_type text, byte_size bigint, sha256 char(64) NOT NULL, status text NOT NULL DEFAULT 'DRAFT', created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id, version_number), CHECK (content IS NOT NULL OR storage_key IS NOT NULL));
CREATE TABLE document_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id), storage_key text NOT NULL UNIQUE, original_file_name text NOT NULL, mime_type text NOT NULL, byte_size bigint NOT NULL CHECK(byte_size >= 0), sha256 char(64) NOT NULL, created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE documents ADD CONSTRAINT documents_current_version_fk FOREIGN KEY (current_version_id) REFERENCES document_versions(id);
CREATE TABLE document_access_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id), scope access_scope NOT NULL, organizational_unit_id uuid REFERENCES organizational_units(id), user_id uuid REFERENCES users(id), granted_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), CHECK (organizational_unit_id IS NOT NULL OR user_id IS NOT NULL OR scope IN ('ORIGINATING_UNIT','RESPONSIBLE_UNIT','INSTITUTIONAL_LEADERSHIP')));
CREATE TABLE numbering_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_or_process_type text NOT NULL, organizational_unit_id uuid REFERENCES organizational_units(id), prefix text, separator text NOT NULL DEFAULT '/', number_length integer NOT NULL DEFAULT 4 CHECK(number_length BETWEEN 1 AND 12), annual_reset boolean NOT NULL DEFAULT true, starting_number integer NOT NULL DEFAULT 1 CHECK(starting_number > 0), suffix text, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE numbering_sequences (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numbering_rule_id uuid NOT NULL REFERENCES numbering_rules(id), reference_year integer NOT NULL, last_value integer NOT NULL DEFAULT 0, UNIQUE(numbering_rule_id, reference_year));
CREATE TABLE issued_numbers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numbering_rule_id uuid NOT NULL REFERENCES numbering_rules(id), reference_year integer NOT NULL, sequence_value integer NOT NULL, issued_number text NOT NULL UNIQUE, entity_type text NOT NULL, entity_id uuid NOT NULL, status text NOT NULL DEFAULT 'ISSUED', cancelled_at timestamptz, cancellation_reason text, issued_by_user_id uuid NOT NULL REFERENCES users(id), issued_at timestamptz NOT NULL DEFAULT now(), UNIQUE(numbering_rule_id, reference_year, sequence_value));
CREATE TABLE signatures (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_version_id uuid NOT NULL REFERENCES document_versions(id), signer_user_id uuid NOT NULL REFERENCES users(id), level signature_level NOT NULL, provider_code text NOT NULL, status text NOT NULL DEFAULT 'PENDING', signed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE signature_evidence (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), signature_id uuid NOT NULL REFERENCES signatures(id), evidence_type text NOT NULL, payload jsonb NOT NULL, sha256 char(64), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), occurred_at timestamptz NOT NULL DEFAULT now(), actor_user_id uuid REFERENCES users(id), action text NOT NULL, entity_type text NOT NULL, entity_id uuid NOT NULL, origin_unit_id uuid REFERENCES organizational_units(id), destination_unit_id uuid REFERENCES organizational_units(id), previous_state jsonb, new_state jsonb, justification text, request_id uuid, ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now());

CREATE INDEX process_responsible_unit_idx ON processes(responsible_unit_id, status);
CREATE INDEX process_movements_process_idx ON process_movements(process_id, occurred_at DESC);
CREATE INDEX tasks_assigned_user_idx ON tasks(assigned_user_id, status, due_at);
CREATE INDEX deadlines_due_idx ON deadlines(status, due_at);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); NEW.version = COALESCE(OLD.version, 0) + 1; RETURN NEW; END; $$;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON organizational_units FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER processes_updated_at BEFORE UPDATE ON processes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER deadlines_updated_at BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION deny_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END; $$;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION deny_audit_change();
CREATE OR REPLACE FUNCTION deny_movement_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'process_movements cannot be changed or deleted'; END; $$;
CREATE TRIGGER movements_no_change BEFORE UPDATE OR DELETE ON process_movements FOR EACH ROW EXECUTE FUNCTION deny_movement_change();

-- RLS is deny-by-default. The API sets application.user_id after authenticating the request.
ALTER TABLE users ENABLE ROW LEVEL SECURITY; ALTER TABLE employees ENABLE ROW LEVEL SECURITY; ALTER TABLE organizational_units ENABLE ROW LEVEL SECURITY; ALTER TABLE organizational_unit_relations ENABLE ROW LEVEL SECURITY; ALTER TABLE legal_competencies ENABLE ROW LEVEL SECURITY; ALTER TABLE processes ENABLE ROW LEVEL SECURITY; ALTER TABLE process_movements ENABLE ROW LEVEL SECURITY; ALTER TABLE tasks ENABLE ROW LEVEL SECURITY; ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY; ALTER TABLE documents ENABLE ROW LEVEL SECURITY; ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
COMMIT;
