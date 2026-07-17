BEGIN;
INSERT INTO organizational_units (code, official_name, unit_kind, legal_basis, functional_level) VALUES
('CONSULTORIA_GERAL_LEGISLATIVA','Consultoria-Geral Legislativa','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('CONTROLADORIA_GERAL','Controladoria-Geral','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('ESCOLA_DO_LEGISLATIVO','Diretoria da Escola do Legislativo','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('DIRETORIA_DE_PLENARIO','Diretoria de Plenário','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('DIRETORIA_GERAL','Diretoria-Geral','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('OUVIDORIA_GERAL','Ouvidoria-Geral','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('PROCURADORIA_GERAL','Procuradoria-Geral','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('SUPERINTENDENCIA_GERAL','Superintendência-Geral','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('SUPERINTENDENCIA_ASSUNTOS_ESTRATEGICOS','Superintendência de Assuntos Estratégicos','ADMINISTRATIVE','Lei Municipal nº 3.525/2025, art. 2º',1),
('PRESIDENCIA','Presidência','POLITICAL_INSTITUTIONAL','Lei Municipal nº 3.525/2025, art. 2º, parágrafo único',NULL),
('MESA_DIRETORA','Mesa Diretora','POLITICAL_INSTITUTIONAL','Lei Municipal nº 3.525/2025, art. 2º, parágrafo único',NULL)
ON CONFLICT (code) DO NOTHING;
INSERT INTO process_types(code,name) VALUES
('LEGISLATIVE_PROCESS','Processo legislativo'),('ADMINISTRATIVE_PROCESS','Processo administrativo'),('INTERNAL_REQUEST','Solicitação interna'),('TECHNICAL_ANALYSIS','Análise técnica'),('DOCUMENT_REVIEW','Revisão de documento'),('DILIGENCE','Diligência'),('INSTITUTIONAL_COMMUNICATION','Comunicação institucional'),
('JUDICIAL_CASE','Processo judicial'),('AUDIT_PROCESS','Processo de auditoria'),('PROCUREMENT_PROCESS','Processo de contratação'),('CONTRACT_PROCESS','Processo contratual'),('PAYMENT_PROCESS','Processo de pagamento'),('PERSONNEL_PROCESS','Processo de pessoal'),('ASSET_PROCESS','Processo patrimonial'),('OMBUDSMAN_CASE','Manifestação de ouvidoria'),('MAINTENANCE_REQUEST','Solicitação de manutenção'),('TRAINING_PROCESS','Processo de capacitação') ON CONFLICT (code) DO NOTHING;
INSERT INTO roles(code,name) VALUES ('UNIT_MANAGER','Chefia de unidade'),('UNIT_STAFF','Servidor de unidade'),('SYSTEM_ADMINISTRATOR','Administrador técnico') ON CONFLICT (code) DO NOTHING;
INSERT INTO permissions(code,name,description) VALUES ('process.view.own_unit','Consultar processos da própria unidade','Consulta conforme unidade e classificação'),('process.assign','Distribuir processo','Distribui processo dentro da unidade'),('process.forward','Encaminhar processo','Encaminha processo autorizado'),('document.create','Criar documento','Cria documento em rascunho'),('document.sign','Assinar documento','Assina quando houver competência'),('audit.view.unit','Consultar auditoria da unidade','Consulta eventos conforme escopo') ON CONFLICT (code) DO NOTHING;
INSERT INTO workflow_definitions (code, name, process_type_id, version)
SELECT 'PARLIAMENTARY_BILL_PRELIMINARY_ANALYSIS_V1', 'Solicitação, elaboração e análise prévia de anteprojeto parlamentar', id, 1
FROM process_types WHERE code = 'LEGISLATIVE_PROCESS'
ON CONFLICT (code) DO NOTHING;
INSERT INTO workflow_steps (workflow_id, code, name, sort_order, is_initial, is_terminal)
SELECT workflow.id, steps.code, steps.name, steps.sort_order, steps.is_initial, steps.is_terminal
FROM workflow_definitions workflow
CROSS JOIN (VALUES
  ('DRAFT','Rascunho',10,true,false), ('SUBMITTED_BY_CABINET','Submetido pelo Gabinete',20,false,false), ('RECEIVED','Recebido',30,false,false), ('ASSIGNED','Distribuído',40,false,false), ('GRAMMATICAL_AND_LEGISLATIVE_REVIEW','Revisão gramatical e legislativa',50,false,false), ('FORWARDED_TO_TECHNICAL_ANALYSIS','Encaminhado para análise técnica',60,false,false), ('UNDER_TECHNICAL_ANALYSIS','Em análise técnica',70,false,false), ('DILIGENCE_REQUESTED','Diligência solicitada',80,false,false), ('RETURNED_TO_CABINET','Devolvido ao Gabinete',90,false,false), ('RESUBMITTED','Reapresentado',100,false,false), ('UNDER_REVIEW','Em revisão',110,false,false), ('ANALYSIS_APPROVED','Análise aprovada',120,false,false), ('COMPLETED','Concluído',130,false,true), ('CANCELED','Cancelado',140,false,true)
) AS steps(code,name,sort_order,is_initial,is_terminal)
WHERE workflow.code = 'PARLIAMENTARY_BILL_PRELIMINARY_ANALYSIS_V1'
ON CONFLICT (workflow_id, code) DO NOTHING;
INSERT INTO workflow_step_transitions (workflow_id, from_step_id, to_step_id, required_permission_code, requires_justification)
SELECT workflow.id, source_step.id, target_step.id, transition.permission_code, transition.requires_justification
FROM workflow_definitions workflow
JOIN (VALUES
  ('DRAFT','SUBMITTED_BY_CABINET','process.forward',false),
  ('SUBMITTED_BY_CABINET','RECEIVED','process.forward',false),
  ('RECEIVED','ASSIGNED','process.assign',false),
  ('ASSIGNED','GRAMMATICAL_AND_LEGISLATIVE_REVIEW','process.forward',false),
  ('GRAMMATICAL_AND_LEGISLATIVE_REVIEW','FORWARDED_TO_TECHNICAL_ANALYSIS','process.forward',false),
  ('FORWARDED_TO_TECHNICAL_ANALYSIS','UNDER_TECHNICAL_ANALYSIS','process.forward',false),
  ('UNDER_TECHNICAL_ANALYSIS','UNDER_REVIEW','process.forward',false),
  ('UNDER_REVIEW','ANALYSIS_APPROVED','process.forward',false),
  ('ANALYSIS_APPROVED','COMPLETED','process.forward',false),
  ('UNDER_TECHNICAL_ANALYSIS','DILIGENCE_REQUESTED','process.forward',true),
  ('UNDER_REVIEW','DILIGENCE_REQUESTED','process.forward',true),
  ('DILIGENCE_REQUESTED','RETURNED_TO_CABINET','process.forward',true),
  ('RETURNED_TO_CABINET','RESUBMITTED','process.forward',false),
  ('RESUBMITTED','UNDER_REVIEW','process.forward',false),
  ('DRAFT','CANCELED','process.forward',true),
  ('SUBMITTED_BY_CABINET','CANCELED','process.forward',true),
  ('UNDER_REVIEW','CANCELED','process.forward',true)
) AS transition(source_code,target_code,permission_code,requires_justification) ON true
JOIN workflow_steps source_step ON source_step.workflow_id = workflow.id AND source_step.code = transition.source_code
JOIN workflow_steps target_step ON target_step.workflow_id = workflow.id AND target_step.code = transition.target_code
WHERE workflow.code = 'PARLIAMENTARY_BILL_PRELIMINARY_ANALYSIS_V1'
ON CONFLICT (workflow_id, from_step_id, to_step_id) DO NOTHING;
COMMIT;
