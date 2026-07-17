import type { FastifyInstance } from 'fastify';
import type { ApiConfig } from '../config.js';
import { withAuthed } from '../context.js';

export function registerMeRoutes(app: FastifyInstance, cfg: ApiConfig): void {
  app.get('/api/v1/me', async (req, reply) => {
    const body = await withAuthed(cfg, req, async (client, user) => {
      const roles = await client.query(
        `SELECT r.code, r.name, ur.organizational_unit_id AS "organizationalUnitId"
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = app_current_user_id()
            AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())`,
      );
      const units = await client.query(
        `SELECT id, code, official_name AS "officialName", official_acronym AS "officialAcronym"
           FROM organizational_units WHERE id IN (SELECT app_effective_unit_ids())`,
      );
      const perms = await client.query(
        `SELECT DISTINCT p.code FROM user_roles ur
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = app_current_user_id()
            AND ur.starts_at <= now() AND (ur.ends_at IS NULL OR ur.ends_at > now())`,
      );
      return {
        id: user.institutionalUserId,
        displayName: user.displayName,
        email: user.email,
        roles: roles.rows,
        units: units.rows,
        permissions: perms.rows.map((r: { code: string }) => r.code),
      };
    });
    reply.send(body);
  });
}
