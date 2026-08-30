import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import type { JwtPayload } from '../../modules/auth/auth.entity'

// POC secret — move to an env var before this ever sees production traffic.
const JWT_SECRET = 'expense-poc-secret-change-me'

export const jwtPlugin = new Elysia().use(jwt({ name: 'jwt', secret: JWT_SECRET }))

// Verifies the `Authorization: Bearer <token>` header and derives `authUser`
// from the JWT payload. `onBeforeHandle` short-circuits with 401 before any
// handler using `.use(authGuard)` runs, so downstream code can trust
// `authUser` is set (see the `!` in route handlers).
export const authGuard = new Elysia()
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ jwt, headers }) => {
    const token = headers.authorization?.replace(/^Bearer\s+/i, '')
    const payload = token ? await jwt.verify(token) : false
    return { authUser: (payload || null) as JwtPayload | null }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ authUser, status }) => {
    if (!authUser) return status(401, { code: 'UNAUTHORIZED', message: 'Invalid or missing token' })
  })
