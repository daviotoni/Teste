import { z } from 'zod';

// Validação de payloads da API. Erros de validação viram problem+json 422.
export const createProcessSchema = z.object({
  processTypeCode: z.string().min(1),
  workflowCode: z.string().min(1).nullish(),
  subject: z.string().min(3).max(500),
  originUnitId: z.string().uuid(),
  responsibleUnitId: z.string().uuid(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED']).default('INTERNAL'),
  restrictionReason: z.string().nullish(),
  restrictionScope: z.string().nullish(),
});

export const moveProcessSchema = z.object({
  toUnitId: z.string().uuid().nullish(),
  toUserId: z.string().uuid().nullish(),
  newStepId: z.string().uuid().nullish(),
  newStatus: z.string().min(1).nullish(),
  dueAt: z.string().datetime().nullish(),
  justification: z.string().nullish(),
});

export const createDocumentSchema = z.object({
  documentTypeCode: z.string().min(1),
  title: z.string().min(1).max(500),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED']).default('INTERNAL'),
  restrictionReason: z.string().nullish(),
  restrictionScope: z.string().nullish(),
});

export const createVersionSchema = z
  .object({
    content: z.string().nullish(),
    storageKey: z.string().nullish(),
    originalFileName: z.string().nullish(),
    mimeType: z.string().nullish(),
    byteSize: z.number().int().nonnegative().nullish(),
    sha256: z.string().length(64),
  })
  .refine((v) => v.content != null || v.storageKey != null, {
    message: 'Informe content ou storageKey.',
  });

export const createTaskSchema = z.object({
  processId: z.string().uuid().nullish(),
  title: z.string().min(1).max(300),
  description: z.string().nullish(),
  assignedUnitId: z.string().uuid().nullish(),
  assignedUserId: z.string().uuid().nullish(),
  dueAt: z.string().datetime().nullish(),
});

export const patchTaskSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']).nullish(),
  title: z.string().min(1).max(300).nullish(),
  description: z.string().nullish(),
  dueAt: z.string().datetime().nullish(),
});

export type CreateProcessInput = z.infer<typeof createProcessSchema>;
export type MoveProcessInput = z.infer<typeof moveProcessSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type PatchTaskInput = z.infer<typeof patchTaskSchema>;
