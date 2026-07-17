import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed, withIdempotency, expectedVersion } from '../context.js';
import { AppError } from '../problem.js';
import { parse } from '../validate.js';
import { createProcessSchema, moveProcessSchema } from '../schemas.js';

const PROC_COLS = `p.id, p.number, p.legacy_number AS "legacyNumber", p.subject, p.status, p.priority,
  p.visibility, p.process_type_id AS "processTypeId", p.workflow_id AS "workflowId",
  p.current_step_id AS "currentStepId", p.responsible_unit_id AS "responsibleUnitId",
  p.origin_unit_id AS "originUnitId", p.opened_at AS "openedAt", p.updated_at AS "updatedAt", p.version`;

export function registerProcessRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  // Lista de processos visíveis (RLS aplica o escopo).
  app.get<{ Querystring: { status?: string; q?: string } }>('/api/v1/processes', async (req, reply) => {
    const rows = await withAuthed(cfg, req, async (client) => {
      const conds: string[] = [];
      const params: unknown[] = [];
      if (req.query.status) {
        params.push(req.query.status);
        conds.push(`p.status = $${params.length}`);
      }
      if (req.query.q) {
        params.push(`%${req.query.q}%`);
        conds.push(`(p.subject ILIKE $${params.length} OR p.number ILIKE $${params.length})`);
      }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      const res = await client.query(
        `SELECT ${PROC_COLS} FROM processes p ${where} ORDER BY p.updated_at DESC LIMIT 200`,
        params,
      );
      return res.rows;
    });
    reply.send({ items: rows });
  });

  // Criação de processo — função transacional grava auditoria na mesma transação.
  app.post('/api/v1/processes', async (req, reply) => {
    await withIdempotency(cfg, req, reply, async (client) => {
      const input = parse(createProcessSchema, req.body);
      const res = await client.query(
        `SELECT ${PROC_COLS} FROM sigla_create_process($1,$2,$3,$4,$5,$6,$7,$8,$9) AS p`,
        [
          input.processTypeCode,
          input.workflowCode ?? null,
          input.subject,
          input.originUnitId,
          input.responsibleUnitId,
          input.priority,
          input.visibility,
          input.restrictionReason ?? null,
          input.restrictionScope ?? null,
        ],
      );
      return { status: 201, body: res.rows[0] };
    });
  });

  app.get<{ Params: { id: string } }>('/api/v1/processes/:id', async (req, reply) => {
    const body = await withAuthed(cfg, req, async (client) => {
      const res = await client.query(`SELECT ${PROC_COLS} FROM processes p WHERE p.id = $1`, [
        req.params.id,
      ]);
      if (res.rows.length === 0) {
        throw new AppError(404, 'Recurso não encontrado', 'Processo inexistente ou sem acesso.');
      }
      const movements = await client.query(
        `SELECT m.id, m.new_status AS "newStatus", m.previous_status AS "previousStatus",
                m.from_unit_id AS "fromUnitId", m.to_unit_id AS "toUnitId",
                m.new_step_id AS "newStepId", m.justification, m.occurred_at AS "occurredAt",
                m.created_by_user_id AS "createdByUserId"
           FROM process_movements m WHERE m.process_id = $1 ORDER BY m.occurred_at DESC`,
        [req.params.id],
      );
      const row = res.rows[0];
      reply.header('ETag', `"${row.version}"`);
      return { ...row, movements: movements.rows };
    });
    reply.send(body);
  });

  // Movimentação — concorrência otimista via If-Match/X-Entity-Version.
  app.post<{ Params: { id: string } }>('/api/v1/processes/:id/movements', async (req, reply) => {
    const version = expectedVersion(req);
    await withIdempotency(cfg, req, reply, async (client) => {
      const input = parse(moveProcessSchema, req.body);
      const res = await client.query(
        `SELECT ${PROC_COLS} FROM sigla_move_process($1,$2,$3,$4,$5,$6,$7,$8) AS p`,
        [
          req.params.id,
          input.toUnitId ?? null,
          input.toUserId ?? null,
          input.newStepId ?? null,
          input.newStatus ?? null,
          input.dueAt ?? null,
          input.justification ?? null,
          version,
        ],
      );
      return { status: 200, body: res.rows[0] };
    });
  });
}
