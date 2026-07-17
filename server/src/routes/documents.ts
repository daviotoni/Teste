import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed, withIdempotency } from '../context.js';
import { parse } from '../validate.js';
import { createDocumentSchema, createVersionSchema } from '../schemas.js';

const DOC_COLS = `d.id, d.process_id AS "processId", d.document_type_id AS "documentTypeId",
  d.number, d.title, d.visibility, d.status, d.current_version_id AS "currentVersionId",
  d.created_by_user_id AS "createdByUserId", d.created_at AS "createdAt", d.version`;

export function registerDocumentRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  app.get<{ Params: { id: string } }>('/api/v1/processes/:id/documents', async (req, reply) => {
    const rows = await withAuthed(cfg, req, async (client) => {
      const res = await client.query(
        `SELECT ${DOC_COLS} FROM documents d WHERE d.process_id = $1 ORDER BY d.created_at DESC`,
        [req.params.id],
      );
      return res.rows;
    });
    reply.send({ items: rows });
  });

  app.post<{ Params: { id: string } }>('/api/v1/processes/:id/documents', async (req, reply) => {
    await withIdempotency(cfg, req, reply, async (client) => {
      const input = parse(createDocumentSchema, req.body);
      const res = await client.query(
        `SELECT ${DOC_COLS} FROM sigla_create_document($1,$2,$3,$4,$5,$6) AS d`,
        [
          req.params.id,
          input.documentTypeCode,
          input.title,
          input.visibility,
          input.restrictionReason ?? null,
          input.restrictionScope ?? null,
        ],
      );
      return { status: 201, body: res.rows[0] };
    });
  });

  app.post<{ Params: { id: string } }>('/api/v1/documents/:id/versions', async (req, reply) => {
    await withIdempotency(cfg, req, reply, async (client) => {
      const input = parse(createVersionSchema, req.body);
      const res = await client.query(
        `SELECT dv.id, dv.document_id AS "documentId", dv.version_number AS "versionNumber",
                dv.status, dv.sha256, dv.created_at AS "createdAt"
           FROM sigla_create_document_version($1,$2,$3,$4,$5,$6,$7) AS dv`,
        [
          req.params.id,
          input.content ?? null,
          input.storageKey ?? null,
          input.originalFileName ?? null,
          input.mimeType ?? null,
          input.byteSize ?? null,
          input.sha256,
        ],
      );
      return { status: 201, body: res.rows[0] };
    });
  });
}
