import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

// Testes de integração do núcleo (RLS, auditoria, integridade, autorização).
//
// Requisitos de ambiente:
//   DATABASE_URL        -> papel de aplicação SEM BYPASSRLS (ex.: app_api).
//                          Usado para as asserções de RLS (leitura escopada).
//   DATABASE_ADMIN_URL  -> papel privilegiado para criar fixtures e executar as
//                          funções transacionais/mutações.
//
// O banco deve ter as migrations 0001..0004 e os seeds 0001..0002 aplicados.
// Sem essas variáveis, a suíte é PULADA (não fingimos que passou).
const APP_URL = process.env.DATABASE_URL;
const ADMIN_URL = process.env.DATABASE_ADMIN_URL;
const enabled = Boolean(APP_URL && ADMIN_URL);
// Em CI (CI_REQUIRE_INTEGRATION=1) a suíte NÃO pode pular: se faltar banco, ela
// roda mesmo assim e falha no beforeAll — pular deixa de ser um caminho válido.
const mustRun = process.env.CI_REQUIRE_INTEGRATION === '1';

describe.skipIf(!enabled && !mustRun)('núcleo institucional (integração)', () => {
  let admin: pg.Pool;
  let app: pg.Pool;
  const ctx: Record<string, string> = {};

  const asUser = async <T>(pool: pg.Pool, userId: string, fn: (c: pg.PoolClient) => Promise<T>, commit = false): Promise<T> => {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      await c.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      const r = await fn(c);
      await c.query(commit ? 'COMMIT' : 'ROLLBACK');
      return r;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  };

  beforeAll(async () => {
    if (!enabled) {
      throw new Error(
        'CI_REQUIRE_INTEGRATION=1 exige DATABASE_URL e DATABASE_ADMIN_URL. ' +
          'Ausência de banco não pode ser tratada como sucesso.',
      );
    }
    admin = new pg.Pool({ connectionString: ADMIN_URL });
    app = new pg.Pool({ connectionString: APP_URL });

    // Garante que o papel da API não ignora RLS — senão os testes dariam
    // falso-positivo. Falha explícita orienta a corrigir a configuração.
    const who = await app.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user');
    if (who.rows[0]?.rolsuper || who.rows[0]?.rolbypassrls) {
      throw new Error('DATABASE_URL deve usar um papel SEM superuser/bypassrls (ex.: app_api).');
    }

    const suffix = Math.floor(Number(process.env.TEST_SEED ?? '1')).toString(36) + '_' +
      (await admin.query('SELECT floor(extract(epoch from clock_timestamp())*1000)::bigint AS t')).rows[0].t;

    // Duas unidades administrativas.
    const units = await admin.query(
      `INSERT INTO organizational_units (code, official_name, unit_kind, functional_level)
       VALUES ($1,'Unidade A de teste','ADMINISTRATIVE',1), ($2,'Unidade B de teste','ADMINISTRATIVE',1)
       RETURNING id, code`,
      [`TEST_A_${suffix}`, `TEST_B_${suffix}`],
    );
    ctx.unitA = units.rows.find((r) => r.code.startsWith('TEST_A'))!.id;
    ctx.unitB = units.rows.find((r) => r.code.startsWith('TEST_B'))!.id;

    // Três usuários: A (chefia unidade A), B (servidor unidade B), Admin técnico.
    const mkUser = async (name: string) => {
      const r = await admin.query(
        'INSERT INTO users (auth_subject, display_name, is_active) VALUES (gen_random_uuid(), $1, true) RETURNING id',
        [name],
      );
      const uid = r.rows[0].id;
      const e = await admin.query(
        'INSERT INTO employees (user_id, full_name, is_active) VALUES ($1,$2,true) RETURNING id',
        [uid, name],
      );
      return { uid, eid: e.rows[0].id };
    };
    const a = await mkUser('Servidor A');
    const b = await mkUser('Servidor B');
    const adm = await mkUser('Admin Técnico');
    ctx.userA = a.uid; ctx.userB = b.uid; ctx.userAdmin = adm.uid;
    ctx.empA = a.eid; ctx.empB = b.eid;

    // Lotações vigentes.
    await admin.query(
      `INSERT INTO work_assignments (employee_id, organizational_unit_id, starts_at, is_primary)
       VALUES ($1,$2, now() - interval '30 days', true)`,
      [a.eid, ctx.unitA],
    );
    await admin.query(
      `INSERT INTO work_assignments (employee_id, organizational_unit_id, starts_at, is_primary)
       VALUES ($1,$2, now() - interval '30 days', true)`,
      [b.eid, ctx.unitB],
    );

    // Papéis vigentes.
    const roleId = async (code: string) =>
      (await admin.query('SELECT id FROM roles WHERE code=$1', [code])).rows[0].id;
    await admin.query('INSERT INTO user_roles (user_id, role_id, organizational_unit_id) VALUES ($1,$2,$3)', [ctx.userA, await roleId('UNIT_MANAGER'), ctx.unitA]);
    await admin.query('INSERT INTO user_roles (user_id, role_id, organizational_unit_id) VALUES ($1,$2,$3)', [ctx.userB, await roleId('UNIT_STAFF'), ctx.unitB]);
    await admin.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)', [ctx.userAdmin, await roleId('SYSTEM_ADMINISTRATOR')]);

    // Processo criado por A (via função transacional) e persistido.
    const proc = await asUser(admin, ctx.userA, async (c) => {
      const r = await c.query(
        `SELECT id, number FROM sigla_create_process('ADMINISTRATIVE_PROCESS', NULL, 'Processo de teste A', $1, $1) AS p`,
        [ctx.unitA],
      );
      return r.rows[0];
    }, true);
    ctx.procA = proc.id;
    ctx.procANumber = proc.number;
  }, 60_000);

  afterAll(async () => {
    await admin?.end();
    await app?.end();
  });

  it('criação de processo grava auditoria na mesma transação', async () => {
    await asUser(admin, ctx.userA, async (c) => {
      const r = await c.query(
        `SELECT id FROM sigla_create_process('ADMINISTRATIVE_PROCESS', NULL, 'Processo auditado', $1, $1) AS p`,
        [ctx.unitA],
      );
      const audits = await c.query(
        `SELECT 1 FROM audit_logs WHERE action='process.create' AND entity_id=$1`,
        [r.rows[0].id],
      );
      expect(audits.rowCount).toBe(1); // auditoria visível dentro da MESMA transação
    });
  });

  it('emite números sem duplicidade', async () => {
    const numbers = await asUser(admin, ctx.userA, async (c) => {
      const p1 = await c.query(`SELECT number FROM sigla_create_process('ADMINISTRATIVE_PROCESS', NULL, 'p1', $1, $1) AS p`, [ctx.unitA]);
      const p2 = await c.query(`SELECT number FROM sigla_create_process('ADMINISTRATIVE_PROCESS', NULL, 'p2', $1, $1) AS p`, [ctx.unitA]);
      return [p1.rows[0].number, p2.rows[0].number];
    });
    expect(numbers[0]).not.toBe(numbers[1]);
  });

  it('RLS isola processos entre unidades', async () => {
    const seenByB = await asUser(app, ctx.userB, (c) => c.query('SELECT id FROM processes WHERE id=$1', [ctx.procA]));
    expect(seenByB.rowCount).toBe(0);
    const seenByA = await asUser(app, ctx.userA, (c) => c.query('SELECT id FROM processes WHERE id=$1', [ctx.procA]));
    expect(seenByA.rowCount).toBe(1);
  });

  it('administrador técnico não vê processo interno automaticamente', async () => {
    const seen = await asUser(app, ctx.userAdmin, (c) => c.query('SELECT id FROM processes WHERE id=$1', [ctx.procA]));
    expect(seen.rowCount).toBe(0);
  });

  it('usuário sem responsabilidade não movimenta o processo', async () => {
    await expect(
      asUser(admin, ctx.userB, (c) =>
        c.query(`SELECT sigla_move_process($1, $2, NULL, NULL, 'IN_ANALYSIS', NULL, NULL, NULL)`, [ctx.procA, ctx.unitB]),
      ),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('movimentações são imutáveis (sem UPDATE/DELETE)', async () => {
    await expect(admin.query('UPDATE process_movements SET new_status=$1 WHERE process_id=$2', ['CANCELLED', ctx.procA])).rejects.toBeDefined();
    await expect(admin.query('DELETE FROM process_movements WHERE process_id=$1', [ctx.procA])).rejects.toBeDefined();
  });

  it('auditoria é imutável (sem UPDATE/DELETE)', async () => {
    await expect(admin.query("UPDATE audit_logs SET action='x' WHERE entity_id=$1", [ctx.procA])).rejects.toBeDefined();
    await expect(admin.query('DELETE FROM audit_logs WHERE entity_id=$1', [ctx.procA])).rejects.toBeDefined();
  });

  it('current_step_id deve pertencer ao workflow do processo', async () => {
    // Cria um workflow/step estranho e tenta apontar o processo para ele.
    const wf = await admin.query(
      `INSERT INTO workflow_definitions (code, name, process_type_id)
       SELECT 'WF_TEST_'||floor(random()*1e9)::text, 'wf', id FROM process_types WHERE code='ADMINISTRATIVE_PROCESS' RETURNING id`,
    );
    const step = await admin.query(
      `INSERT INTO workflow_steps (workflow_id, code, name, sort_order, is_initial) VALUES ($1,'S','S',1,true) RETURNING id`,
      [wf.rows[0].id],
    );
    await expect(
      admin.query('UPDATE processes SET current_step_id=$1 WHERE id=$2', [step.rows[0].id, ctx.procA]),
    ).rejects.toBeDefined();
  });

  it('current_version_id deve pertencer ao mesmo documento', async () => {
    await asUser(admin, ctx.userA, async (c) => {
      const d1 = (await c.query(`SELECT id FROM sigla_create_document($1,'TECHNICAL_OPINION','Doc 1') AS d`, [ctx.procA])).rows[0].id;
      const d2 = (await c.query(`SELECT id FROM sigla_create_document($1,'TECHNICAL_OPINION','Doc 2') AS d`, [ctx.procA])).rows[0].id;
      const v1 = (await c.query(
        `SELECT id FROM sigla_create_document_version($1,'texto',NULL,NULL,NULL,NULL,$2) AS v`,
        [d1, 'a'.repeat(64)],
      )).rows[0].id;
      // Apontar o documento 2 para uma versão do documento 1 deve ser rejeitado.
      await expect(c.query('UPDATE documents SET current_version_id=$1 WHERE id=$2', [v1, d2])).rejects.toBeDefined();
    });
  });

  it('substituição só concede acesso dentro da vigência', async () => {
    // Substituição JÁ ENCERRADA de B para a unidade A: não deve conceder acesso.
    await admin.query(
      `INSERT INTO temporary_substitutions
        (titular_employee_id, substitute_employee_id, organizational_unit_id, start_date, end_date, legal_act, legal_act_date, reason, status)
       VALUES ($1,$2,$3, current_date - 20, current_date - 10, 'Ato 1/2026', current_date - 21, 'Férias', 'ACTIVE')`,
      [ctx.empA, ctx.empB, ctx.unitA],
    );
    const seen = await asUser(app, ctx.userB, (c) => c.query('SELECT id FROM processes WHERE id=$1', [ctx.procA]));
    expect(seen.rowCount).toBe(0); // fora da vigência -> sem acesso
  });
});
