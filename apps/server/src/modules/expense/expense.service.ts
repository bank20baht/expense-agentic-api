import type { Static } from 'elysia'
import type { ExpenseSortField, SummaryGroupBy, expenseSchema } from './expense.entity'
import { expenseRepository } from './expense.repository'
import type { PaginationParams } from '../../shared/pagination/pagination.types'
import type { Result } from '../../shared/types/error.type'
import { decodeCursor, encodeCursor } from '../../shared/utils/cursor.utils'

type Expense = Static<typeof expenseSchema>

type SummaryGroup = {
  key: string
  totalIncome: number
  totalExpense: number
  balance: number
  count: number
}

// Key an item falls under for a given groupBy — `date` is "YYYY-MM-DD", so
// slicing the first 7 chars gives the month bucket.
const groupKey = (item: Expense, groupBy: SummaryGroupBy): string => {
  switch (groupBy) {
    case 'category':
      return item.category
    case 'month':
      return item.date.slice(0, 7)
    case 'type':
      return item.type
  }
}

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

  summary: (
    userId: number,
    params: { from?: string; to?: string; groupBy: SummaryGroupBy },
  ): {
    groupBy: SummaryGroupBy
    totalIncome: number
    totalExpense: number
    balance: number
    count: number
    byGroup: SummaryGroup[]
  } => {
    const items = expenseRepository.findAllByUser({ userId, from: params.from, to: params.to })
    const totalIncome = items
      .filter((i) => i.type === 'income')
      .reduce((sum, i) => sum + i.amount, 0)
    const totalExpense = items
      .filter((i) => i.type === 'expense')
      .reduce((sum, i) => sum + i.amount, 0)

    const groups = new Map<string, SummaryGroup>()
    for (const item of items) {
      const key = groupKey(item, params.groupBy)
      const group = groups.get(key) ?? {
        key,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        count: 0,
      }
      if (item.type === 'income') group.totalIncome += item.amount
      else group.totalExpense += item.amount
      group.balance = group.totalIncome - group.totalExpense
      group.count += 1
      groups.set(key, group)
    }

    return {
      groupBy: params.groupBy,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: items.length,
      byGroup: [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)),
    }
  },
}
