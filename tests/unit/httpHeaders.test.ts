import { describe, it, expect } from 'vitest';
import { parseExpectedVersion } from '../../server/src/httpHeaders';
import { getIdempotent, saveIdempotent, scopedKey } from '../../server/src/idempotency';

describe('parseExpectedVersion', () => {
  it('lê If-Match com aspas', () => {
    expect(parseExpectedVersion({ 'if-match': '"3"' })).toBe(3);
  });
  it('lê X-Entity-Version', () => {
    expect(parseExpectedVersion({ 'x-entity-version': '5' })).toBe(5);
  });
  it('retorna null quando ausente', () => {
    expect(parseExpectedVersion({})).toBeNull();
  });
  it('lança para valor inválido', () => {
    expect(() => parseExpectedVersion({ 'if-match': '"0"' })).toThrow();
    expect(() => parseExpectedVersion({ 'if-match': '"abc"' })).toThrow();
  });
});

describe('idempotency store', () => {
  it('armazena e recupera por chave escopada ao usuário', () => {
    const key = scopedKey('user-1', 'POST', '/processes', 'k1');
    expect(getIdempotent(key)).toBeUndefined();
    saveIdempotent(key, 201, { id: 'abc' });
    expect(getIdempotent(key)?.status).toBe(201);
  });

  it('não colide entre usuários diferentes com a mesma chave', () => {
    const a = scopedKey('user-a', 'POST', '/processes', 'same');
    const b = scopedKey('user-b', 'POST', '/processes', 'same');
    saveIdempotent(a, 201, { who: 'a' });
    expect(getIdempotent(b)).toBeUndefined();
  });
});
