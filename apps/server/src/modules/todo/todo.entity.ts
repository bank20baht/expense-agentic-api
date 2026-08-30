import { t } from 'elysia'
import { createPaginatedResponseSchema } from '../../shared/pagination/pagination.schema'

export const todoSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  done: t.Boolean(),
})

export const todoSortFields = ['id', 'title', 'done'] as const
export type TodoSortField = (typeof todoSortFields)[number]

export const paginatedTodosSchema = createPaginatedResponseSchema(todoSchema)
