#!/usr/bin/env bun
// Bun script equivalent of `nest g module <name>` — no CLI framework, just
// string templates. Scaffolds src/modules/<name>/ following the todo module
// pattern: entity -> repository -> service -> routes, with cursor pagination
// wired in from the start so every module stays consistent.
//
// Usage: bun run generate:module <name>   (singular, e.g. "note", "user")

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const rawName = process.argv[2]

if (!rawName) {
  console.error('Usage: bun run generate:module <name>')
  console.error('Example: bun run generate:module note')
  process.exit(1)
}

if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(rawName)) {
  console.error(
    `Invalid module name "${rawName}" — use letters, numbers, dashes, starting with a letter.`,
  )
  process.exit(1)
}

const camel = rawName.toLowerCase().replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const pascal = camel[0].toUpperCase() + camel.slice(1)
// Naive pluralization for the route prefix / exported plugin name only —
// entity/service/repository stay singular, same split the todo module uses.
const plural = camel.endsWith('s') ? camel : `${camel}s`

const dir = join(import.meta.dir, '..', 'src', 'modules', camel)

if (existsSync(dir)) {
  console.error(`src/modules/${camel} already exists — pick another name or delete it first.`)
  process.exit(1)
}

const entityFile = `import { t } from 'elysia'
import { createPaginatedResponseSchema } from '../../shared/pagination/pagination.schema'

// TODO: replace \`name\` with this module's real fields.
export const ${camel}Schema = t.Object({
  id: t.Number(),
  name: t.String(),
})

export const ${camel}SortFields = ['id', 'name'] as const
export type ${pascal}SortField = (typeof ${camel}SortFields)[number]

export const paginated${pascal}sSchema = createPaginatedResponseSchema(${camel}Schema)
`

const repositoryFile = `import type { Static } from 'elysia'
import type { ${pascal}SortField, ${camel}Schema } from './${camel}.entity'
import type { SortDirection } from '../../shared/pagination/pagination.types'

type ${pascal} = Static<typeof ${camel}Schema>

const db: ${pascal}[] = []
let nextId = 1

const compare${pascal}s = (
  a: ${pascal},
  b: ${pascal},
  sortBy: ${pascal}SortField,
  direction: SortDirection,
): number => {
  const sign = direction === 'asc' ? 1 : -1
  if (a[sortBy] < b[sortBy]) return -1 * sign
  if (a[sortBy] > b[sortBy]) return 1 * sign
  return a.id - b.id
}

export const ${camel}Repository = {
  findAll: (): ${pascal}[] => db,

  findById: (id: number): ${pascal} | undefined => db.find((item) => item.id === id),

  findPage: (params: {
    afterId: number | undefined
    limit: number
    sortBy: ${pascal}SortField
    sortDirection: SortDirection
  }): { items: ${pascal}[]; hasMore: boolean } => {
    const sorted = [...db].sort((a, b) => compare${pascal}s(a, b, params.sortBy, params.sortDirection))
    const start =
      params.afterId === undefined ? 0 : sorted.findIndex((item) => item.id === params.afterId) + 1
    const page = sorted.slice(start, start + params.limit)
    return { items: page, hasMore: start + params.limit < sorted.length }
  },

  // TODO: replace \`name\` with this module's real create/update fields.
  create: (name: string): ${pascal} => {
    const item: ${pascal} = { id: nextId++, name }
    db.push(item)
    return item
  },

  update: (id: number, patch: { name?: string }): ${pascal} | undefined => {
    const item = db.find((row) => row.id === id)
    if (!item) return undefined
    if (patch.name !== undefined) item.name = patch.name
    return item
  },
}
`

const serviceFile = `import type { Static } from 'elysia'
import type { ${pascal}SortField, ${camel}Schema } from './${camel}.entity'
import { ${camel}Repository } from './${camel}.repository'
import type { PaginationParams } from '../../shared/pagination/pagination.types'
import type { Result } from '../../shared/types/error.type'
import { decodeCursor, encodeCursor } from '../../shared/utils/cursor.utils'

type ${pascal} = Static<typeof ${camel}Schema>

// Framework-agnostic: no Elysia import, no HTTP status codes. Returns a
// Result so the route layer decides how to surface failure.

export const ${camel}Service = {
  list: (
    params: PaginationParams<${pascal}SortField>,
  ): Result<{ items: ${pascal}[]; nextCursor: string | null }> => {
    let afterId: number | undefined
    if (params.cursor !== undefined) {
      afterId = decodeCursor(params.cursor)
      if (afterId === undefined) return { ok: false, error: 'INVALID_CURSOR' }
    }
    const { items, hasMore } = ${camel}Repository.findPage({
      afterId,
      limit: params.limit,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    })
    const last = items.at(-1)
    const nextCursor = hasMore && last ? encodeCursor(last.id) : null
    return { ok: true, data: { items, nextCursor } }
  },

  get: (id: number): Result<${pascal}> => {
    const item = ${camel}Repository.findById(id)
    return item ? { ok: true, data: item } : { ok: false, error: 'NOT_FOUND' }
  },

  create: (name: string): ${pascal} => ${camel}Repository.create(name),

  update: (id: number, patch: { name?: string }): Result<${pascal}> => {
    const item = ${camel}Repository.update(id, patch)
    return item ? { ok: true, data: item } : { ok: false, error: 'NOT_FOUND' }
  },
}
`

const routesFile = `import { ${camel}Schema, ${camel}SortFields, paginated${pascal}sSchema } from './${camel}.entity'
import { ${camel}Service } from './${camel}.service'
import { requestIdPlugin } from '../../shared/plugins/request-id.plugin'
import { createPaginationQuerySchema } from '../../shared/pagination/pagination.schema'
import { normalizePagination } from '../../shared/pagination/pagination.types'
import { errorSchema } from '../../shared/types/error.type'
import { Elysia, t } from 'elysia'

const ${camel}ListDefaults = { limit: 20, sortBy: 'id', sortDirection: 'asc' } as const
const ${camel}ListQuerySchema = createPaginationQuerySchema(${camel}SortFields, ${camel}ListDefaults)

export const ${plural} = new Elysia({ prefix: '/${plural}', tags: ['${plural}'] })
  .use(requestIdPlugin)
  .get(
    '/',
    ({ query, status, requestId }) => {
      const result = ${camel}Service.list(normalizePagination(query, ${camel}ListDefaults))
      if (!result.ok)
        return status(400, { code: 'INVALID_CURSOR', message: 'Invalid cursor', requestId })
      return result.data
    },
    {
      query: ${camel}ListQuerySchema,
      response: {
        200: paginated${pascal}sSchema,
        400: errorSchema,
      },
    },
  )
  .get(
    '/:id',
    ({ params, status, requestId }) => {
      const result = ${camel}Service.get(params.id)
      if (!result.ok)
        return status(404, { code: '${pascal.toUpperCase()}_NOT_FOUND', message: '${pascal} not found', requestId })
      return result.data
    },
    {
      params: t.Object({ id: t.Number() }),
      response: {
        200: ${camel}Schema,
        404: errorSchema,
      },
    },
  )
  .post(
    '/',
    ({ body, status }) => {
      const item = ${camel}Service.create(body.name)
      return status(201, item)
    },
    {
      body: t.Object({ name: t.String({ minLength: 1 }) }),
      response: {
        201: ${camel}Schema,
      },
    },
  )
  .patch(
    '/:id',
    ({ params, body, status, requestId }) => {
      const result = ${camel}Service.update(params.id, body)
      if (!result.ok)
        return status(404, { code: '${pascal.toUpperCase()}_NOT_FOUND', message: '${pascal} not found', requestId })
      return result.data
    },
    {
      params: t.Object({ id: t.Number() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
      }),
      response: {
        200: ${camel}Schema,
        404: errorSchema,
      },
    },
  )
`

await mkdir(dir, { recursive: true })
await writeFile(join(dir, `${camel}.entity.ts`), entityFile)
await writeFile(join(dir, `${camel}.repository.ts`), repositoryFile)
await writeFile(join(dir, `${camel}.service.ts`), serviceFile)
await writeFile(join(dir, `${camel}.routes.ts`), routesFile)

console.log(`Generated src/modules/${camel}/`)
console.log(`  ${camel}.entity.ts`)
console.log(`  ${camel}.repository.ts`)
console.log(`  ${camel}.service.ts`)
console.log(`  ${camel}.routes.ts`)
console.log('')
console.log('Wire it up in src/index.ts:')
console.log(`  import { ${plural} } from './modules/${camel}/${camel}.routes'`)
console.log(`  .group('/api', (app) => app.use(todos).use(${plural}))`)
