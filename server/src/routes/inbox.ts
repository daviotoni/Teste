import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed } from '../context.js';

// GET /api/v1/unit-inbox — agrega a caixa da unidade do usuário autenticado.
// Todas as consultas rodam sob RLS (app.user_id), então apenas linhas visíveis
// pela lotação/atribuição/classificação do usuário são retornadas.
const PROC_COLS = `p.id, p.number, p.subject, p.status, p.priority,
  p.responsible_unit_id AS "responsibleUnitId", p.origin_unit_id AS "originUnitId",
  p.updated_at AS "updatedAt", p.version`;

export function registerInboxRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  app.get('/api/v1/unit-inbox', async (req, reply) => {
    const data = await withAuthed(cfg, req, async (client) => {
      const received = await client.query(
        `SELECT ${PROC_COLS} FROM processes p
          WHERE p.responsible_unit_id IN (SELECT app_effective_unit_ids())
            AND p.status IN ('RECEIVED','OPEN')
          ORDER BY p.updated_at DESC LIMIT 100`,
      );

      const undistributed = await client.query(
        `SELECT ${PROC_COLS} FROM processes p
          WHERE p.responsible_unit_id IN (SELECT app_effective_unit_ids())
            AND p.status NOT IN ('COMPLETED','ARCHIVED','CANCELLED')
            AND NOT EXISTS (SELECT 1 FROM process_participants pp
                             WHERE pp.process_id = p.id AND pp.participant_role = 'RESPONSIBLE'
                               AND pp.user_id IS NOT NULL)
          ORDER BY p.updated_at DESC LIMIT 100`,
      );

      const assignedToMe = await client.query(
        `SELECT ${PROC_COLS} FROM processes p
          WHERE EXISTS (SELECT 1 FROM process_participants pp
                         WHERE pp.process_id = p.id AND pp.user_id = app_current_user_id()
                           AND pp.participant_role = 'RESPONSIBLE')
          ORDER BY p.updated_at DESC LIMIT 100`,
      );

      const inAnalysis = await client.query(
        `SELECT ${PROC_COLS} FROM processes p
          WHERE p.responsible_unit_id IN (SELECT app_effective_unit_ids())
            AND p.status = 'IN_ANALYSIS'
          ORDER BY p.updated_at DESC LIMIT 100`,
      );

      const pendingTasks = await client.query(
        `SELECT t.id, t.title, t.status, t.due_at AS "dueAt", t.process_id AS "processId",
                t.assigned_unit_id AS "assignedUnitId", t.assigned_user_id AS "assignedUserId", t.version
           FROM tasks t
          WHERE t.status NOT IN ('DONE','CANCELLED')
            AND (t.assigned_user_id = app_current_user_id()
                 OR t.assigned_unit_id IN (SELECT app_effective_unit_ids()))
          ORDER BY t.due_at NULLS LAST LIMIT 100`,
      );

      const deadlines = await client.query(
        `SELECT d.id, d.due_at AS "dueAt", d.status, d.process_id AS "processId", d.task_id AS "taskId",
                (d.due_at < now()) AS "overdue"
           FROM deadlines d
          WHERE d.status = 'OPEN' AND d.due_at <= now() + interval '7 days'
          ORDER BY d.due_at ASC LIMIT 100`,
      );

      const awaitingSignature = await client.query(
        `SELECT DISTINCT d.id AS "documentId", d.title, dv.id AS "versionId",
                dv.version_number AS "versionNumber", s.id AS "signatureId", s.status AS "signatureStatus"
           FROM signatures s
           JOIN document_versions dv ON dv.id = s.document_version_id
           JOIN documents d ON d.id = dv.document_id
          WHERE s.status = 'PENDING'
          ORDER BY d.title LIMIT 100`,
      );

      const lastMovements = await client.query(
        `SELECT m.id, m.process_id AS "processId", m.new_status AS "newStatus",
                m.from_unit_id AS "fromUnitId", m.to_unit_id AS "toUnitId",
                m.justification, m.occurred_at AS "occurredAt"
           FROM process_movements m
          ORDER BY m.occurred_at DESC LIMIT 30`,
      );

      const permsRes = await client.query(
        `SELECT DISTINCT p.code FROM user_roles ur
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = app_current_user_id()
            AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())`,
      );
      const perms = new Set(permsRes.rows.map((r: { code: string }) => r.code));

      return {
        receivedProcesses: received.rows,
        undistributedProcesses: undistributed.rows,
        assignedToMe: assignedToMe.rows,
        inAnalysis: inAnalysis.rows,
        pendingTasks: pendingTasks.rows,
        deadlines: deadlines.rows,
        documentsAwaitingSignature: awaitingSignature.rows,
        lastMovements: lastMovements.rows,
        allowedActions: {
          createProcess: perms.has('process.create'),
          assignProcess: perms.has('process.assign'),
          forwardProcess: perms.has('process.forward'),
          createDocument: perms.has('document.create'),
        },
      };
    });
    reply.send(data);
  });
}
