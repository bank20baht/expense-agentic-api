import { t, type TSchema } from 'elysia'
import type { PaginationDefaults } from './pagination.types'

// Functional equivalent of the class-validator `PaginationQueryParameter<T>`
// base class + `@IsOptional() limit = 12` defaults: no decorators/DI here
// (Elysia is chain/functional, not class-based), so a module declares its
// sortable fields + defaults once and gets a typed, defaulted query schema.
export const createPaginationQuerySchema = <F extends readonly [string, ...string[]]>(
  sortableFields: F,
  defaults: PaginationDefaults<F[number]>,
) =>
  t.Object({
    cursor: t.Optional(t.String()),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: defaults.limit })),
    sortBy: t.Optional(
      t.Union(
        sortableFields.map((field) => t.Literal(field)),
        { default: defaults.sortBy },
      ),
    ),
    sortDirection: t.Optional(
      t.Union([t.Literal('asc'), t.Literal('desc')], { default: defaults.sortDirection }),
    ),
  })

export const createPaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
  t.Object({
    items: t.Array(itemSchema),
    nextCursor: t.Nullable(t.String()),
  })
