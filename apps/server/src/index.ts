import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { fromTypes, openapi } from '@elysiajs/openapi'
import { todos } from './modules/todo/todo.routes'

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
      documentation: {
        info: { title: 'Guildline API', version: '1.0.0' },
        tags: [{ name: 'todos', description: 'Todo CRUD' }],
      },
    }),
  )
  .use(cors())
  .get('/', () => 'Elysia server up')
  // No return annotation — Elysia infers the shape, Eden hands it to the client.
  // Add a field here and it appears on `data` in the frontend automatically.
  .get('/api/hello', () => ({
    message: 'Hello from Elysia',
    timestamp: Date.now(),
  }))
  .group('/api', (app) => app.use(todos))
  .listen(3000)

console.log(`Server on http://localhost:${app.server?.port}`)

export type App = typeof app
