import { Elysia } from 'elysia'
import { loginBodySchema, tokenResponseSchema } from './auth.entity'
import { authService } from './auth.service'
import { jwtPlugin } from '../../shared/plugins/auth.plugin'
import { errorSchema } from '../../shared/types/error.type'

export const auth = new Elysia({ prefix: '/auth', tags: ['auth'] }).use(jwtPlugin).post(
  '/login',
  async ({ jwt, body, status }) => {
    const result = authService.verifyCredentials(body.username, body.password)
    if (!result.ok)
      return status(401, { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' })
    const token = await jwt.sign({ userId: result.data.id, username: result.data.username })
    return { token }
  },
  {
    body: loginBodySchema,
    response: {
      200: tokenResponseSchema,
      401: errorSchema,
    },
  },
)
