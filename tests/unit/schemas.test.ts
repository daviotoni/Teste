import { describe, it, expect } from 'vitest';
import { createProcessSchema, moveProcessSchema, createVersionSchema } from '../../server/src/schemas';

describe('createProcessSchema', () => {
  it('aceita payload válido e aplica defaults', () => {
    const r = createProcessSchema.safeParse({
      processTypeCode: 'ADMINISTRATIVE_PROCESS',
      subject: 'Assunto de teste',
      originUnitId: '11111111-1111-4111-8111-111111111111',
      responsibleUnitId: '22222222-2222-4222-8222-222222222222',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.priority).toBe('NORMAL');
      expect(r.data.visibility).toBe('INTERNAL');
    }
  });

  it('rejeita UUID inválido de unidade', () => {
    const r = createProcessSchema.safeParse({
      processTypeCode: 'X',
      subject: 'Assunto',
      originUnitId: 'nao-uuid',
      responsibleUnitId: '22222222-2222-4222-8222-222222222222',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita assunto muito curto', () => {
    const r = createProcessSchema.safeParse({
      processTypeCode: 'X',
      subject: 'ab',
      originUnitId: '11111111-1111-4111-8111-111111111111',
      responsibleUnitId: '22222222-2222-4222-8222-222222222222',
    });
    expect(r.success).toBe(false);
  });
});

describe('createVersionSchema', () => {
  it('exige content ou storageKey', () => {
    const r = createVersionSchema.safeParse({ sha256: 'a'.repeat(64) });
    expect(r.success).toBe(false);
  });
  it('aceita com content e sha256 de 64 chars', () => {
    const r = createVersionSchema.safeParse({ content: 'texto', sha256: 'a'.repeat(64) });
    expect(r.success).toBe(true);
  });
});

describe('moveProcessSchema', () => {
  it('aceita movimentação mínima', () => {
    expect(moveProcessSchema.safeParse({ newStatus: 'IN_ANALYSIS' }).success).toBe(true);
  });
});
