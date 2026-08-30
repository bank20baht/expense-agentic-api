import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { createPrivateKey, createPublicKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { JwtPayload } from '../../modules/auth/auth.entity'

// POC RSA keypair, checked into `apps/server/keys/` — generate your own and
// load both halves from env/secret storage before this ever sees production
// traffic. Signing uses the private key; verifying only ever needs the
// public half, so any code that just checks a token never has to touch the
// private key at all.
const keysDir = join(import.meta.dir, '../../../keys')
const JWT_PRIVATE_KEY_PEM = readFileSync(join(keysDir, 'jwt-private.key'), 'utf8')
const JWT_PUBLIC_KEY_PEM = readFileSync(join(keysDir, 'jwt-public.key'), 'utf8')

// @elysiajs/jwt uses the same key object for both signing and verifying
// internally, so one instance can't hold a private/public pair at once —
// two separate plugin instances, one per key half, one per operation.
export const jwtSignPlugin = new Elysia().use(
  jwt({ name: 'jwtSign', secret: createPrivateKey(JWT_PRIVATE_KEY_PEM), alg: 'RS256' }),
)

const jwtVerifyPlugin = new Elysia().use(
  jwt({ name: 'jwtVerify', secret: createPublicKey(JWT_PUBLIC_KEY_PEM), alg: 'RS256' }),
)

// Verifies the `Authorization: Bearer <token>` header against the public key
// and derives `authUser` from the JWT payload. `onBeforeHandle`
// short-circuits with 401 before any handler using `.use(authGuard)` runs,
// so downstream code can trust `authUser` is set (see the `!` in route
// handlers).
export const authGuard = new Elysia()
  .use(jwtVerifyPlugin)
  .derive({ as: 'scoped' }, async ({ jwtVerify, headers }) => {
    const token = headers.authorization?.replace(/^Bearer\s+/i, '')
    const payload = token ? await jwtVerify.verify(token) : false
    return { authUser: (payload || null) as JwtPayload | null }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ authUser, status }) => {
    if (!authUser) return status(401, { code: 'UNAUTHORIZED', message: 'Invalid or missing token' })
  })
