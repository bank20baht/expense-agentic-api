import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { fromTypes, openapi } from '@elysiajs/openapi'
import { auth } from './modules/auth/auth.routes'
import { expenses } from './modules/expense/expense.routes'

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
      documentation: {
        info: { title: 'Expense API', version: '1.0.0' },
        tags: [
          { name: 'auth', description: 'Login, issues a JWT' },
          { name: 'expenses', description: 'Expense/income records, scoped per user' },
        ],
      },
    }),
  )
  .use(cors())
  .get('/', () => 'Elysia server up')
  .group('/api', (app) => app.use(auth).use(expenses))
  .listen(3000)

console.log(`Server on http://localhost:${app.server?.port}`)

export type App = typeof app
