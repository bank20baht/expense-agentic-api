import type { Static } from 'elysia'
import type { TodoSortField, todoSchema } from './todo.entity'
import type { SortDirection } from '../../shared/pagination/pagination.types'

type Todo = Static<typeof todoSchema>

const db: Todo[] = [
  { id: 1, title: 'wire eden', done: true },
  { id: 2, title: 'ship app', done: false },
  { id: 3, title: 'ship 1 app', done: false },
  { id: 4, title: 'ship 2 app', done: false },
  { id: 5, title: 'ship 2 app', done: false },
]
let nextId = Math.max(...db.map((todo) => todo.id)) + 1

// `id` is always the tiebreaker so ordering stays deterministic even when two
// rows tie on `sortBy` — the cursor (a row id) only resolves to one position
// in the re-sorted list if the sort itself is stable across requests.
const compareTodos = (
  a: Todo,
  b: Todo,
  sortBy: TodoSortField,
  direction: SortDirection,
): number => {
  const sign = direction === 'asc' ? 1 : -1
  if (a[sortBy] < b[sortBy]) return -1 * sign
  if (a[sortBy] > b[sortBy]) return 1 * sign
  return a.id - b.id
}

export const todoRepository = {
  findAll: (): Todo[] => db,

  findById: (id: number): Todo | undefined => db.find((todo) => todo.id === id),

  // Cursor is the last-seen row's id. To resume, re-sort with the same
  // sortBy/sortDirection the caller used before and slice after that row's
  // new position — works for any sortable field, not just id.
  findPage: (params: {
    afterId: number | undefined
    limit: number
    sortBy: TodoSortField
    sortDirection: SortDirection
  }): { items: Todo[]; hasMore: boolean } => {
    const sorted = [...db].sort((a, b) => compareTodos(a, b, params.sortBy, params.sortDirection))
    const start =
      params.afterId === undefined ? 0 : sorted.findIndex((todo) => todo.id === params.afterId) + 1
    const page = sorted.slice(start, start + params.limit)
    return { items: page, hasMore: start + params.limit < sorted.length }
  },

  create: (title: string): Todo => {
    const todo: Todo = { id: nextId++, title, done: false }
    db.push(todo)
    return todo
  },

  update: (id: number, patch: { title?: string; done?: boolean }): Todo | undefined => {
    const todo = db.find((item) => item.id === id)
    if (!todo) return undefined
    if (patch.title !== undefined) todo.title = patch.title
    if (patch.done !== undefined) todo.done = patch.done
    return todo
  },
}
