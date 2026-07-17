-- SIGLA-CMDC :: 0002 :: integridade e domínios controlados.
-- Objetivo: substituir estados livres por domínios configuráveis e travar
-- invariantes críticas de workflow, documento, numeração, lotação e assinatura.
-- Idempotente: pode ser reaplicada com segurança.
BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- 1. Tabelas de domínio configuráveis (substituem estados livres).
--    Optamos por tabelas (e não ENUM) porque a instituição precisa
--    acrescentar/desativar valores sem migração de tipo.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS process_status_values      (code text PRIMARY KEY, label text NOT NULL, is_terminal boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS priority_values            (code text PRIMARY KEY, label text NOT NULL, sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS participant_role_values     (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS task_status_values          (code text PRIMARY KEY, label text NOT NULL, is_terminal boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS deadline_status_values      (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS document_status_values      (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS version_status_values       (code text PRIMARY KEY, label text NOT NULL, is_signed_state boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS signature_status_values     (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS nomination_status_values    (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS issued_number_status_values (code text PRIMARY KEY, label text NOT NULL, is_active boolean NOT NULL DEFAULT true);

INSERT INTO process_status_values (code,label,is_terminal,sort_order) VALUES
  ('DRAFT','Rascunho',false,10),('OPEN','Aberto',false,20),('RECEIVED','Recebido',false,30),
  ('ASSIGNED','Distribuído',false,40),('IN_ANALYSIS','Em análise',false,50),
  ('IN_DILIGENCE','Em diligência',false,60),('AWAITING_DOCUMENTATION','Aguardando documentação',false,70),
  ('SUSPENDED','Suspenso',false,80),('COMPLETED','Concluído',true,90),
  ('ARCHIVED','Arquivado',true,100),('CANCELLED','Cancelado',true,110)
ON CONFLICT (code) DO NOTHING;

INSERT INTO priority_values (code,label,sort_order) VALUES
  ('LOW','Baixa',10),('NORMAL','Normal',20),('HIGH','Alta',30),('URGENT','Urgente',40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO participant_role_values (code,label) VALUES
  ('AUTHOR','Autor'),('INTERESTED','Interessado'),('RESPONSIBLE','Responsável'),
  ('REVIEWER','Revisor'),('RECIPIENT','Destinatário'),('OBSERVER','Observador')
ON CONFLICT (code) DO NOTHING;

INSERT INTO task_status_values (code,label,is_terminal) VALUES
  ('OPEN','Aberta',false),('IN_PROGRESS','Em andamento',false),('BLOCKED','Bloqueada',false),
  ('DONE','Concluída',true),('CANCELLED','Cancelada',true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO deadline_status_values (code,label) VALUES
  ('OPEN','Aberto'),('MET','Cumprido'),('MISSED','Perdido'),('SUSPENDED','Suspenso'),('CANCELLED','Cancelado')
ON CONFLICT (code) DO NOTHING;

INSERT INTO document_status_values (code,label) VALUES
  ('DRAFT','Rascunho'),('UNDER_REVIEW','Em revisão'),('FINALIZED','Finalizado'),
  ('SIGNED','Assinado'),('ARCHIVED','Arquivado'),('CANCELLED','Cancelado')
ON CONFLICT (code) DO NOTHING;

INSERT INTO version_status_values (code,label,is_signed_state) VALUES
  ('DRAFT','Rascunho',false),('FINALIZED','Finalizada',false),
  ('SIGNATURE_REQUESTED','Assinatura solicitada',false),('SIGNED','Assinada',true),('SUPERSEDED','Substituída',false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO signature_status_values (code,label) VALUES
  ('PENDING','Pendente'),('SIGNED','Assinada'),('REJECTED','Recusada'),('CANCELLED','Cancelada')
ON CONFLICT (code) DO NOTHING;

INSERT INTO nomination_status_values (code,label) VALUES
  ('ACTIVE','Vigente'),('SUSPENDED','Suspensa'),('ENDED','Encerrada'),('REVOKED','Revogada')
ON CONFLICT (code) DO NOTHING;

INSERT INTO issued_number_status_values (code,label) VALUES
  ('ISSUED','Emitido'),('CANCELLED','Cancelado')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Amarrar as colunas de estado às tabelas de domínio.
--    ADD CONSTRAINT não aceita IF NOT EXISTS: usamos blocos idempotentes.
-- ---------------------------------------------------------------------------
DO $$ BEGIN ALTER TABLE processes           ADD CONSTRAINT processes_status_fk        FOREIGN KEY (status)           REFERENCES process_status_values(code);      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE processes           ADD CONSTRAINT processes_priority_fk      FOREIGN KEY (priority)         REFERENCES priority_values(code);            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE process_participants ADD CONSTRAINT participants_role_fk       FOREIGN KEY (participant_role) REFERENCES participant_role_values(code);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE process_movements   ADD CONSTRAINT movements_new_status_fk    FOREIGN KEY (new_status)       REFERENCES process_status_values(code);      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE tasks               ADD CONSTRAINT tasks_status_fk            FOREIGN KEY (status)           REFERENCES task_status_values(code);         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE deadlines           ADD CONSTRAINT deadlines_status_fk        FOREIGN KEY (status)           REFERENCES deadline_status_values(code);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE documents           ADD CONSTRAINT documents_status_fk        FOREIGN KEY (status)           REFERENCES document_status_values(code);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE document_versions   ADD CONSTRAINT versions_status_fk         FOREIGN KEY (status)           REFERENCES version_status_values(code);      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE signatures          ADD CONSTRAINT signatures_status_fk       FOREIGN KEY (status)           REFERENCES signature_status_values(code);    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE appointments        ADD CONSTRAINT appointments_status_fk     FOREIGN KEY (status)           REFERENCES nomination_status_values(code);   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE designations        ADD CONSTRAINT designations_status_fk     FOREIGN KEY (status)           REFERENCES nomination_status_values(code);   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE temporary_substitutions ADD CONSTRAINT substitutions_status_fk FOREIGN KEY (status)          REFERENCES nomination_status_values(code);   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE issued_numbers      ADD CONSTRAINT issued_status_fk           FOREIGN KEY (status)           REFERENCES issued_number_status_values(code);EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Alinhar defaults às tabelas de domínio.
ALTER TABLE processes ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE processes ALTER COLUMN priority SET DEFAULT 'NORMAL';

-- ---------------------------------------------------------------------------
-- 3. required_permission_code de transição referencia permissão existente.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE workflow_step_transitions
    ADD CONSTRAINT transitions_permission_fk
    FOREIGN KEY (required_permission_code) REFERENCES permissions(code) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 4. processes.current_step_id pertence ao workflow_id do próprio processo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_process_step_matches_workflow() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE step_workflow uuid;
BEGIN
  IF NEW.current_step_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.workflow_id IS NULL THEN
    RAISE EXCEPTION 'processo % define etapa atual sem workflow', NEW.id;
  END IF;
  SELECT workflow_id INTO step_workflow FROM workflow_steps WHERE id = NEW.current_step_id;
  IF step_workflow IS DISTINCT FROM NEW.workflow_id THEN
    RAISE EXCEPTION 'current_step_id % não pertence ao workflow % do processo', NEW.current_step_id, NEW.workflow_id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS processes_step_workflow ON processes;
CREATE TRIGGER processes_step_workflow BEFORE INSERT OR UPDATE OF current_step_id, workflow_id ON processes
  FOR EACH ROW EXECUTE FUNCTION assert_process_step_matches_workflow();

-- Movimentação: etapas informadas pertencem ao workflow do processo.
CREATE OR REPLACE FUNCTION assert_movement_steps_match_workflow() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE wf uuid; s uuid;
BEGIN
  SELECT workflow_id INTO wf FROM processes WHERE id = NEW.process_id;
  FOREACH s IN ARRAY ARRAY[NEW.previous_step_id, NEW.new_step_id] LOOP
    IF s IS NOT NULL THEN
      IF wf IS NULL OR (SELECT workflow_id FROM workflow_steps WHERE id = s) IS DISTINCT FROM wf THEN
        RAISE EXCEPTION 'etapa % da movimentação não pertence ao workflow do processo', s;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS movements_step_workflow ON process_movements;
CREATE TRIGGER movements_step_workflow BEFORE INSERT ON process_movements
  FOR EACH ROW EXECUTE FUNCTION assert_movement_steps_match_workflow();

-- ---------------------------------------------------------------------------
-- 5. documents.current_version_id pertence ao mesmo document_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_document_current_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ver_doc uuid;
BEGIN
  IF NEW.current_version_id IS NULL THEN RETURN NEW; END IF;
  SELECT document_id INTO ver_doc FROM document_versions WHERE id = NEW.current_version_id;
  IF ver_doc IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'current_version_id % não pertence ao documento %', NEW.current_version_id, NEW.id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS documents_current_version ON documents;
CREATE TRIGGER documents_current_version BEFORE INSERT OR UPDATE OF current_version_id ON documents
  FOR EACH ROW EXECUTE FUNCTION assert_document_current_version();

-- ---------------------------------------------------------------------------
-- 6. Versão assinada é imutável (não pode ser alterada nem excluída).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION deny_signed_version_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE signed boolean;
BEGIN
  SELECT COALESCE(v.is_signed_state,false) INTO signed FROM version_status_values v WHERE v.code = OLD.status;
  IF signed OR EXISTS (SELECT 1 FROM signatures s WHERE s.document_version_id = OLD.id AND s.status = 'SIGNED') THEN
    RAISE EXCEPTION 'versão assinada é imutável (document_version %)', OLD.id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS versions_signed_immutable ON document_versions;
CREATE TRIGGER versions_signed_immutable BEFORE UPDATE OR DELETE ON document_versions
  FOR EACH ROW EXECUTE FUNCTION deny_signed_version_change();

-- ---------------------------------------------------------------------------
-- 7. auditoria também bloqueia DELETE (0001 já cobre UPDATE OR DELETE);
--    reforçamos aqui explicitamente para audit_logs e mantemos movimentações.
--    (idempotente: recria com o mesmo nome)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION deny_audit_change();

-- ---------------------------------------------------------------------------
-- 8. Numeração: regra amarrada a tipo de processo OU documento válido;
--    número emitido imutável; número cancelado nunca reutilizado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_numbering_rule_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM process_types  WHERE code = NEW.document_or_process_type)
     AND NOT EXISTS (SELECT 1 FROM document_types WHERE code = NEW.document_or_process_type) THEN
    RAISE EXCEPTION 'regra de numeração referencia tipo inexistente: %', NEW.document_or_process_type;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS numbering_rule_type ON numbering_rules;
CREATE TRIGGER numbering_rule_type BEFORE INSERT OR UPDATE OF document_or_process_type ON numbering_rules
  FOR EACH ROW EXECUTE FUNCTION assert_numbering_rule_type();

-- issued_numbers: só permite transição ISSUED->CANCELLED; nunca reescreve o número
-- nem apaga (a linha cancelada preserva o sequence_value, impedindo reuso).
CREATE OR REPLACE FUNCTION deny_issued_number_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'issued_numbers é imutável: número emitido não pode ser excluído';
  END IF;
  IF NEW.issued_number   IS DISTINCT FROM OLD.issued_number
     OR NEW.sequence_value  IS DISTINCT FROM OLD.sequence_value
     OR NEW.reference_year  IS DISTINCT FROM OLD.reference_year
     OR NEW.numbering_rule_id IS DISTINCT FROM OLD.numbering_rule_id
     OR NEW.entity_type    IS DISTINCT FROM OLD.entity_type
     OR NEW.entity_id      IS DISTINCT FROM OLD.entity_id THEN
    RAISE EXCEPTION 'número emitido é imutável; apenas cancelamento é permitido';
  END IF;
  IF OLD.status = 'CANCELLED' AND NEW.status <> 'CANCELLED' THEN
    RAISE EXCEPTION 'número cancelado não pode ser reativado nem reutilizado';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS issued_numbers_immutable ON issued_numbers;
CREATE TRIGGER issued_numbers_immutable BEFORE UPDATE OR DELETE ON issued_numbers
  FOR EACH ROW EXECUTE FUNCTION deny_issued_number_mutation();

-- ---------------------------------------------------------------------------
-- 9. Lotação principal: não pode haver duas vigentes e sobrepostas por servidor.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE work_assignments
    ADD CONSTRAINT work_assignments_no_overlapping_primary
    EXCLUDE USING gist (
      employee_id WITH =,
      tstzrange(starts_at, COALESCE(ends_at, 'infinity'::timestamptz), '[)') WITH &&
    ) WHERE (is_primary);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 10. Substituição temporária: ato, motivo e vigência efetivos; não automática.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE temporary_substitutions
    ADD CONSTRAINT substitution_requires_act_and_reason
    CHECK (length(btrim(legal_act)) > 0 AND length(btrim(reason)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE temporary_substitutions ADD COLUMN is_automatic boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE temporary_substitutions
    ADD CONSTRAINT substitution_not_automatic CHECK (is_automatic = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 11. Uma regra de numeração por tipo + unidade (unidade NULL = regra geral).
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS numbering_rules_type_unit_uniq
  ON numbering_rules (document_or_process_type, COALESCE(organizational_unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE active;

COMMIT;
