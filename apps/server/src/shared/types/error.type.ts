import { t } from 'elysia'

export const errorSchema = t.Object({
  code: t.String(), // machine-readable: 'TODO_NOT_FOUND', 'INVALID_BODY'
  message: t.String(), // human-readable, safe to show
  requestId: t.Optional(t.String()),
})

type ServiceError = 'NOT_FOUND' | 'INVALID_CURSOR'

export type Result<T> = { ok: true; data: T } | { ok: false; error: ServiceError }
