import { t } from 'elysia'
import { createPaginatedResponseSchema } from '../../shared/pagination/pagination.schema'

// Written as an explicit tuple, not `[...].map(t.Literal)` — mapping over an
// array loses literal narrowing and TS infers the union as `never`.
export const expenseTypeSchema = t.Union([t.Literal('income'), t.Literal('expense')])

export const expenseSchema = t.Object({
  id: t.Number(),
  userId: t.Number(),
  type: expenseTypeSchema,
  amount: t.Number(),
  category: t.String(),
  note: t.Optional(t.String()),
  date: t.String(), // ISO date string
})

export const expenseSortFields = ['id', 'date', 'amount'] as const
export type ExpenseSortField = (typeof expenseSortFields)[number]

export const paginatedExpensesSchema = createPaginatedResponseSchema(expenseSchema)

// Written as an explicit tuple for the same reason as `expenseTypeSchema`.
export const summaryGroupBySchema = t.Union([
  t.Literal('category'),
  t.Literal('month'),
  t.Literal('type'),
])
export type SummaryGroupBy = 'category' | 'month' | 'type'

const summaryGroupSchema = t.Object({
  key: t.String(), // category name, "YYYY-MM", or "income"/"expense" depending on groupBy
  totalIncome: t.Number(),
  totalExpense: t.Number(),
  balance: t.Number(),
  count: t.Number(),
})

export const expenseSummarySchema = t.Object({
  groupBy: summaryGroupBySchema,
  totalIncome: t.Number(),
  totalExpense: t.Number(),
  balance: t.Number(),
  count: t.Number(),
  byGroup: t.Array(summaryGroupSchema),
})
