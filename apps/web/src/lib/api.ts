import { treaty } from '@elysiajs/eden'
import type { App } from 'server'

/**
 * End-to-end typed client. Route paths, params, request bodies, and response
 * shapes are all inferred from the server's `App` type — no codegen, no drift.
 * Points at same origin so Vite's `/api` proxy forwards to Elysia in dev.
 */
export const api = treaty<App>(window.location.origin)
