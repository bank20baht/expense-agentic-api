import type { Static } from 'elysia'
import type { ExpenseSortField, expenseSchema } from './expense.entity'
import { expenseRepository } from './expense.repository'
import type { PaginationParams } from '../../shared/pagination/pagination.types'
import type { Result } from '../../shared/types/error.type'
import { decodeCursor, encodeCursor } from '../../shared/utils/cursor.utils'

type Expense = Static<typeof expenseSchema>

// Framework-agnostic: no Elysia import, no HTTP status codes. Returns a
// Result so the route layer decides how to surface failure. Every method
// takes `userId` so data never leaks across accounts.
export const expenseService = {
  list: (
    userId: number,
    params: PaginationParams<ExpenseSortField>,
  ): Result<{ items: Expense[]; nextCursor: string | null }> => {
    let afterId: number | undefined
    if (params.cursor !== undefined) {
      afterId = decodeCursor(params.cursor)
      if (afterId === undefined) return { ok: false, error: 'INVALID_CURSOR' }
    }
    const { items, hasMore } = expenseRepository.findPage({
      userId,
      afterId,
      limit: params.limit,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    })
    const last = items.at(-1)
    const nextCursor = hasMore && last ? encodeCursor(last.id) : null
    return { ok: true, data: { items, nextCursor } }
  },

  get: (userId: number, id: number): Result<Expense> => {
    const item = expenseRepository.findById(userId, id)
    return item ? { ok: true, data: item } : { ok: false, error: 'NOT_FOUND' }
  },

  create: (
    userId: number,
    input: { type: Expense['type']; amount: number; category: string; note?: string; date: string },
  ): Expense => expenseRepository.create(userId, input),
}
