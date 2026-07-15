/** Normalize free-form note tags: lowercase, kebab, unique, capped. */
export function normalizeNoteTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []

  const seen = new Set<string>()
  const tags: string[] = []

  for (const item of input) {
    if (typeof item !== 'string') continue
    const tag = item
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._/-]/g, '')
      .slice(0, 32)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
    if (tags.length >= 20) break
  }

  return tags
}

export type NoteListFilters = {
  search?: string
  pinned?: string
  tag?: string
  /** `true` = archived only; anything else / omitted = active only */
  archived?: string
}

export function noteMatchesArchivedFilter(isArchived: boolean, archived?: string) {
  if (archived === 'true') return isArchived
  return !isArchived
}
