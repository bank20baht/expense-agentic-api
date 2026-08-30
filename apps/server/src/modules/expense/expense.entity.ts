import { t } from 'elysia'
import { createPaginatedResponseSchema } from '../../shared/pagination/pagination.schema'

export const expenseTypes = ['income', 'expense'] as const
export type ExpenseType = (typeof expenseTypes)[number]

// Written as an explicit tuple, not `expenseTypes.map(t.Literal)` — mapping
// over the array loses literal narrowing and TS infers the union as `never`.
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
