import { Elysia } from 'elysia'

// Standalone plugin: adds `requestId` to context. Any route module composes it
// in with `.use()` — no base class, no shared handler to extend.
export const requestIdPlugin = new Elysia().derive({ as: 'scoped' }, () => ({
  requestId: crypto.randomUUID(),
}))
