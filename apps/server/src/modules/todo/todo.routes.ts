import { paginatedTodosSchema, todoSchema, todoSortFields } from './todo.entity'
import { todoService } from './todo.service'
import { requestIdPlugin } from '../../shared/plugins/request-id.plugin'
import { createPaginationQuerySchema } from '../../shared/pagination/pagination.schema'
import { normalizePagination } from '../../shared/pagination/pagination.types'
import { errorSchema } from '../../shared/types/error.type'
import { Elysia, t } from 'elysia'

const todoListDefaults = { limit: 20, sortBy: 'id', sortDirection: 'asc' } as const
const todoListQuerySchema = createPaginationQuerySchema(todoSortFields, todoListDefaults)

// `detail.tags` groups routes under the "todos" section in the OpenAPI UI.
// Routes only do HTTP: parse input, call the service, map Result -> status.
export const todos = new Elysia({ prefix: '/todos', tags: ['todos'] })
  .use(requestIdPlugin)
  // Response schemas are declared explicitly: runtime schema takes precedence
  // over type gen, so the docs stay correct even for multi-status handlers.
  .get(
    '/',
    ({ query, status, requestId }) => {
      const result = todoService.list(normalizePagination(query, todoListDefaults))
      if (!result.ok)
        return status(400, { code: 'INVALID_CURSOR', message: 'Invalid cursor', requestId })
      return result.data
    },
    {
      query: todoListQuerySchema,
      response: {
        200: paginatedTodosSchema,
        400: errorSchema,
      },
    },
  )
  .get(
    '/:id',
    ({ params, status, requestId }) => {
      const result = todoService.get(params.id)
      if (!result.ok)
        return status(404, { code: 'TODO_NOT_FOUND', message: 'Todo not found', requestId })
      return result.data
    },
    {
      params: t.Object({ id: t.Number() }),
      response: {
        200: todoSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    '/',
    ({ body, status }) => {
      const todo = todoService.create(body.title)
      return status(201, todo)
    },
    {
      body: t.Object({ title: t.String({ minLength: 1 }) }),
      response: {
        201: todoSchema,
      },
    },
  )
  .patch(
    '/:id',
    ({ params, body, status, requestId }) => {
      const result = todoService.update(params.id, body)
      if (!result.ok)
        return status(404, { code: 'TODO_NOT_FOUND', message: 'Todo not found', requestId })
      return result.data
    },
    {
      params: t.Object({ id: t.Number() }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        done: t.Optional(t.Boolean()),
      }),
      response: {
        200: todoSchema,
        404: errorSchema,
      },
    },
  )
