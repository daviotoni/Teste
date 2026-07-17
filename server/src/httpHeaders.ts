// Utilitários puros de cabeçalho HTTP (sem dependências) — fáceis de testar.

// Extrai a versão esperada de If-Match/X-Entity-Version para concorrência
// otimista. Retorna null quando ausente; lança RangeError quando inválida.
export function parseExpectedVersion(headers: Record<string, unknown>): number | null {
  const ifMatch = headers['if-match'];
  const explicit = headers['x-entity-version'];
  const raw =
    (typeof ifMatch === 'string' ? ifMatch.replace(/"/g, '') : undefined) ??
    (typeof explicit === 'string' ? explicit : undefined);
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError('If-Match/X-Entity-Version deve ser inteiro positivo.');
  }
  return n;
}
