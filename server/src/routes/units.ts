import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed } from '../context.js';
import { AppError } from '../problem.js';

const UNIT_COLS = `id, code, official_name AS "officialName", official_acronym AS "officialAcronym",
  unit_kind AS "unitKind", legal_basis AS "legalBasis", functional_level AS "functionalLevel",
  phone, email, physical_location AS "physicalLocation", opening_hours AS "openingHours", is_active AS "isActive"`;

export function registerUnitRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  app.get('/api/v1/organizational-units', async (req, reply) => {
    const rows = await withAuthed(cfg, req, async (client) => {
      const res = await client.query(
        `SELECT ${UNIT_COLS} FROM organizational_units ORDER BY official_name`,
      );
      return res.rows;
    });
    reply.send({ items: rows });
  });

  app.get<{ Params: { id: string } }>('/api/v1/organizational-units/:id', async (req, reply) => {
    const row = await withAuthed(cfg, req, async (client) => {
      const res = await client.query(
        `SELECT ${UNIT_COLS} FROM organizational_units WHERE id = $1`,
        [req.params.id],
      );
      if (res.rows.length === 0) {
        throw new AppError(404, 'Recurso não encontrado', 'Unidade inexistente ou sem acesso.');
      }
      return res.rows[0];
    });
    reply.send(row);
  });
}
