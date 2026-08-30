export type SortDirection = 'asc' | 'desc'

export type PaginationParams<TSortField extends string> = {
  cursor?: string
  limit: number
  sortBy: TSortField
  sortDirection: SortDirection
}

export type PaginationDefaults<TSortField extends string> = {
  limit: number
  sortBy: TSortField
  sortDirection: SortDirection
}

// Functional equivalent of `PaginationQueryMaker.make()`: query params come
// back from validation with everything optional (defaults only guarantee a
// runtime value, not a narrower static type) — this fills the gaps once so
// every service method downstream can assume fully-populated params.
export const normalizePagination = <TSortField extends string>(
  raw: { cursor?: string; limit?: number; sortBy?: TSortField; sortDirection?: SortDirection },
  defaults: PaginationDefaults<TSortField>,
): PaginationParams<TSortField> => ({
  cursor: raw.cursor,
  limit: raw.limit ?? defaults.limit,
  sortBy: raw.sortBy ?? defaults.sortBy,
  sortDirection: raw.sortDirection ?? defaults.sortDirection,
})
