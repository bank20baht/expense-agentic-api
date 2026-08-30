import type { Static } from 'elysia'
import type { TodoSortField, todoSchema } from './todo.entity'
import { todoRepository } from './todo.repository'
import type { PaginationParams } from '../../shared/pagination/pagination.types'
import type { Result } from '../../shared/types/error.type'
import { decodeCursor, encodeCursor } from '../../shared/utils/cursor.utils'

type Todo = Static<typeof todoSchema>

export const todoService = {
  list: (
    params: PaginationParams<TodoSortField>,
  ): Result<{ items: Todo[]; nextCursor: string | null }> => {
    let afterId: number | undefined
    if (params.cursor !== undefined) {
      afterId = decodeCursor(params.cursor)
      if (afterId === undefined) return { ok: false, error: 'INVALID_CURSOR' }
    }
    const { items, hasMore } = todoRepository.findPage({
      afterId,
      limit: params.limit,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    })
    const last = items.at(-1)
    const nextCursor = hasMore && last ? encodeCursor(last.id) : null
    return { ok: true, data: { items, nextCursor } }
  },

  get: (id: number): Result<Todo> => {
    const todo = todoRepository.findById(id)
    return todo ? { ok: true, data: todo } : { ok: false, error: 'NOT_FOUND' }
  },

  create: (title: string): Todo => todoRepository.create(title),

  update: (id: number, patch: { title?: string; done?: boolean }): Result<Todo> => {
    const todo = todoRepository.update(id, patch)
    return todo ? { ok: true, data: todo } : { ok: false, error: 'NOT_FOUND' }
  },
}
