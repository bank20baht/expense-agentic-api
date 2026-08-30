import type { Static } from 'elysia'
import type { ExpenseSortField, expenseSchema } from './expense.entity'
import type { SortDirection } from '../../shared/pagination/pagination.types'

type Expense = Static<typeof expenseSchema>

// Seeded across 3 months with repeating categories — enough spread for an
// agentic client to answer "how much on food this month" / "trend by
// category" / "compare June vs August" style questions per user.
const db: Expense[] = [
  // alice (userId 1) — June, July, August 2026
  { id: 1, userId: 1, type: 'income', amount: 30000, category: 'salary', date: '2026-06-01' },
  {
    id: 2,
    userId: 1,
    type: 'expense',
    amount: 220,
    category: 'food',
    note: 'lunch',
    date: '2026-06-03',
  },
  { id: 3, userId: 1, type: 'expense', amount: 1500, category: 'transport', date: '2026-06-07' },
  {
    id: 4,
    userId: 1,
    type: 'expense',
    amount: 900,
    category: 'utilities',
    note: 'electricity',
    date: '2026-06-20',
  },
  { id: 5, userId: 1, type: 'income', amount: 30000, category: 'salary', date: '2026-07-01' },
  {
    id: 6,
    userId: 1,
    type: 'expense',
    amount: 310,
    category: 'food',
    note: 'groceries',
    date: '2026-07-04',
  },
  { id: 7, userId: 1, type: 'expense', amount: 1350, category: 'transport', date: '2026-07-10' },
  {
    id: 8,
    userId: 1,
    type: 'expense',
    amount: 650,
    category: 'entertainment',
    note: 'movies',
    date: '2026-07-18',
  },
  { id: 9, userId: 1, type: 'income', amount: 30000, category: 'salary', date: '2026-08-01' },
  {
    id: 10,
    userId: 1,
    type: 'expense',
    amount: 250,
    category: 'food',
    note: 'lunch',
    date: '2026-08-02',
  },
  { id: 11, userId: 1, type: 'expense', amount: 1200, category: 'transport', date: '2026-08-03' },
  {
    id: 12,
    userId: 1,
    type: 'expense',
    amount: 980,
    category: 'utilities',
    note: 'internet + electricity',
    date: '2026-08-15',
  },
  {
    id: 13,
    userId: 1,
    type: 'expense',
    amount: 1800,
    category: 'shopping',
    note: 'new shoes',
    date: '2026-08-20',
  },
  {
    id: 14,
    userId: 1,
    type: 'income',
    amount: 2000,
    category: 'freelance',
    note: 'side project',
    date: '2026-08-25',
  },

  // bob (userId 2) — June, July, August 2026
  { id: 15, userId: 2, type: 'income', amount: 25000, category: 'salary', date: '2026-06-01' },
  { id: 16, userId: 2, type: 'expense', amount: 400, category: 'food', date: '2026-06-06' },
  {
    id: 17,
    userId: 2,
    type: 'expense',
    amount: 700,
    category: 'health',
    note: 'dentist',
    date: '2026-06-14',
  },
  { id: 18, userId: 2, type: 'income', amount: 25000, category: 'salary', date: '2026-07-01' },
  { id: 19, userId: 2, type: 'expense', amount: 550, category: 'food', date: '2026-07-08' },
  { id: 20, userId: 2, type: 'expense', amount: 1100, category: 'transport', date: '2026-07-16' },
  {
    id: 21,
    userId: 2,
    type: 'expense',
    amount: 300,
    category: 'entertainment',
    note: 'concert',
    date: '2026-07-26',
  },
  { id: 22, userId: 2, type: 'income', amount: 25000, category: 'salary', date: '2026-08-01' },
  { id: 23, userId: 2, type: 'expense', amount: 500, category: 'food', date: '2026-08-05' },
  { id: 24, userId: 2, type: 'expense', amount: 1250, category: 'transport', date: '2026-08-12' },
  {
    id: 25,
    userId: 2,
    type: 'expense',
    amount: 600,
    category: 'shopping',
    note: 'clothes',
    date: '2026-08-19',
  },
  { id: 26, userId: 2, type: 'income', amount: 3500, category: 'bonus', date: '2026-08-28' },
]
let nextId = Math.max(...db.map((item) => item.id)) + 1

// `id` is always the tiebreaker so ordering stays deterministic even when two
// rows tie on `sortBy` — the cursor (a row id) only resolves to one position
// in the re-sorted list if the sort itself is stable across requests.
const compareExpenses = (
  a: Expense,
  b: Expense,
  sortBy: ExpenseSortField,
  direction: SortDirection,
): number => {
  const sign = direction === 'asc' ? 1 : -1
  if (a[sortBy] < b[sortBy]) return -1 * sign
  if (a[sortBy] > b[sortBy]) return 1 * sign
  return a.id - b.id
}

export const expenseRepository = {
  findById: (userId: number, id: number): Expense | undefined =>
    db.find((item) => item.id === id && item.userId === userId),

  // Cursor is the last-seen row's id, scoped to the requesting user only.
  findPage: (params: {
    userId: number
    afterId: number | undefined
    limit: number
    sortBy: ExpenseSortField
    sortDirection: SortDirection
  }): { items: Expense[]; hasMore: boolean } => {
    const sorted = db
      .filter((item) => item.userId === params.userId)
      .sort((a, b) => compareExpenses(a, b, params.sortBy, params.sortDirection))
    const start =
      params.afterId === undefined ? 0 : sorted.findIndex((item) => item.id === params.afterId) + 1
    const page = sorted.slice(start, start + params.limit)
    return { items: page, hasMore: start + params.limit < sorted.length }
  },

  create: (
    userId: number,
    input: { type: Expense['type']; amount: number; category: string; note?: string; date: string },
  ): Expense => {
    const item: Expense = { id: nextId++, userId, ...input }
    db.push(item)
    return item
  },
}
