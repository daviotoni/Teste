import type { ZodSchema } from 'zod';
import { AppError } from './problem.js';

// Valida o corpo/consulta e converte falhas em problem+json 422.
export function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(422, 'Payload inválido', 'Falha de validação de dados.', {
      errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return result.data;
}
