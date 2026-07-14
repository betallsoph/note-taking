export type PgError = {
  code?: string
  message?: string
}

export function getPgError(error: unknown): PgError | null {
  if (!(error instanceof Error)) return null

  const cause = (error as { cause?: unknown }).cause
  if (cause && typeof cause === 'object') {
    const pg = cause as PgError
    if (pg.code || pg.message) return pg
  }

  return { message: error.message }
}

export function isMissingRelation(error: unknown, table?: string) {
  const pg = getPgError(error)
  if (pg?.code === '42P01') return true
  const message = pg?.message ?? (error instanceof Error ? error.message : '')
  if (!message.includes('does not exist')) return false
  return table ? message.includes(table) : true
}
