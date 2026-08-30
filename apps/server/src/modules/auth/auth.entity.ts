import { t } from 'elysia'

export const loginBodySchema = t.Object({
  username: t.String({ minLength: 1 }),
  password: t.String({ minLength: 1 }),
})

export const tokenResponseSchema = t.Object({
  token: t.String(),
})

// Payload embedded in the signed JWT — `userId` lets any downstream route
// scope data access without a DB lookup on every request. Named `userId`
// rather than the reserved `sub` claim, which `@elysiajs/jwt` types as a
// string.
export type JwtPayload = { userId: number; username: string }
