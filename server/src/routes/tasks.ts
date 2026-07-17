import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed, withIdempotency } from '../context.js';
import { AppError } from '../problem.js';
import { parse } from '../validate.js';
import { createTaskSchema, patchTaskSchema } from '../schemas.js';

const TASK_COLS = `t.id, t.process_id AS "processId", t.title, t.description, t.status,
  t.assigned_unit_id AS "assignedUnitId", t.assigned_user_id AS "assignedUserId",
  t.reviewer_user_id AS "reviewerUserId", t.due_at AS "dueAt", t.completed_at AS "completedAt", t.version`;

export function registerTaskRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  app.get('/api/v1/tasks', async (req, reply) => {
    const rows = await withAuthed(cfg, req, async (client) => {
      const res = await client.query(
        `SELECT ${TASK_COLS} FROM tasks t
          WHERE t.assigned_user_id = app_current_user_id()
             OR t.assigned_unit_id IN (SELECT app_effective_unit_ids())
          ORDER BY t.due_at NULLS LAST LIMIT 200`,
      );
      return res.rows;
    });
    reply.send({ items: rows });
  });

  app.post('/api/v1/tasks', async (req, reply) => {
    await withIdempotency(cfg, req, reply, async (client) => {
      const input = parse(createTaskSchema, req.body);
      const res = await client.query(
        `SELECT ${TASK_COLS} FROM sigla_create_task($1,$2,$3,$4,$5,$6) AS t`,
        [
          input.processId ?? null,
          input.title,
          input.description ?? null,
          input.assignedUnitId ?? null,
          input.assignedUserId ?? null,
          input.dueAt ?? null,
        ],
      );
      return { status: 201, body: res.rows[0] };
    });
  });

  // PATCH direto (a política RLS de tasks autoriza a escrita do responsável).
  app.patch<{ Params: { id: string } }>('/api/v1/tasks/:id', async (req, reply) => {
    const body = await withAuthed(cfg, req, async (client) => {
      const input = parse(patchTaskSchema, req.body);
      const sets: string[] = [];
      const params: unknown[] = [];
      const add = (col: string, val: unknown) => {
        params.push(val);
        sets.push(`${col} = $${params.length}`);
      };
      if (input.status !== undefined && input.status !== null) add('status', input.status);
      if (input.title !== undefined && input.title !== null) add('title', input.title);
      if (input.description !== undefined) add('description', input.description);
      if (input.dueAt !== undefined) add('due_at', input.dueAt);
      if (input.status === 'DONE') sets.push('completed_at = now()');
      if (sets.length === 0) {
        throw new AppError(422, 'Payload inválido', 'Nenhum campo para atualizar.');
      }
      params.push(req.params.id);
      const res = await client.query(
        `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${TASK_COLS}`,
        params,
      );
      if (res.rows.length === 0) {
        throw new AppError(404, 'Recurso não encontrado', 'Tarefa inexistente ou sem acesso.');
      }
      return res.rows[0];
    });
    reply.send(body);
  });
}
