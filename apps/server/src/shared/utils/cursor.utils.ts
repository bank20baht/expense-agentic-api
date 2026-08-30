export const encodeCursor = (id: number): string => Buffer.from(String(id)).toString('base64')

export const decodeCursor = (cursor: string): number | undefined => {
  const id = Number(Buffer.from(cursor, 'base64').toString())
  return Number.isInteger(id) ? id : undefined
}
