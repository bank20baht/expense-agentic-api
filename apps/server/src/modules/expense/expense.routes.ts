import {
  expenseSchema,
  expenseSortFields,
  paginatedExpensesSchema,
  expenseTypeSchema,
} from './expense.entity'
import { expenseService } from './expense.service'
import { requestIdPlugin } from '../../shared/plugins/request-id.plugin'
import { authGuard } from '../../shared/plugins/auth.plugin'
import { createPaginationQuerySchema } from '../../shared/pagination/pagination.schema'
import { normalizePagination } from '../../shared/pagination/pagination.types'
import { errorSchema } from '../../shared/types/error.type'
import { Elysia, t } from 'elysia'

const expenseListDefaults = { limit: 20, sortBy: 'date', sortDirection: 'desc' } as const
const expenseListQuerySchema = createPaginationQuerySchema(expenseSortFields, expenseListDefaults)

// Every route requires a valid JWT (`authGuard`) — `authUser!.userId` is the
// requesting user's id, and every service call is scoped to it so one
// user's expenses never leak into another's response.
export const expenses = new Elysia({ prefix: '/expenses', tags: ['expenses'] })
  .use(requestIdPlugin)
  .use(authGuard)
  .get(
    '/',
    ({ query, status, requestId, authUser }) => {
      const result = expenseService.list(
        authUser!.userId,
        normalizePagination(query, expenseListDefaults),
      )
      if (!result.ok)
        return status(400, { code: 'INVALID_CURSOR', message: 'Invalid cursor', requestId })
      return result.data
    },
    {
      query: expenseListQuerySchema,
      response: {
        200: paginatedExpensesSchema,
        400: errorSchema,
      },
    },
  )
  .get(
    '/:id',
    ({ params, status, requestId, authUser }) => {
      const result = expenseService.get(authUser!.userId, params.id)
      if (!result.ok)
        return status(404, { code: 'EXPENSE_NOT_FOUND', message: 'Expense not found', requestId })
      return result.data
    },
    {
      params: t.Object({ id: t.Number() }),
      response: {
        200: expenseSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    '/',
    ({ body, status, authUser }) => {
      const item = expenseService.create(authUser!.userId, body)
      return status(201, item)
    },
    {
      body: t.Object({
        type: expenseTypeSchema,
        amount: t.Number({ minimum: 0 }),
        category: t.String({ minLength: 1 }),
        note: t.Optional(t.String()),
        date: t.String(),
      }),
      response: {
        201: expenseSchema,
      },
    },
  )
