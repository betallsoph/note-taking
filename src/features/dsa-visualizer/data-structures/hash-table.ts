import { buildSteps } from '../types/utils'
import type { HashBucket, HashTableState } from '../types/states'

const BUCKET_COUNT = 5

function hash(key: string) {
  let h = 0
  for (const c of key) h = (h + c.charCodeAt(0)) % BUCKET_COUNT
  return h
}

function htState(
  entries: { key: string; value: number }[],
  highlightKey?: string,
  collisionKeys?: string[],
): HashTableState {
  const buckets: (HashBucket | null)[][] = Array.from({ length: BUCKET_COUNT }, () => [])
  for (const e of entries) {
    buckets[hash(e.key)].push(e)
  }
  return { type: 'hash-table', buckets, bucketCount: BUCKET_COUNT, highlightKey, collisionKeys }
}

export function generateHashTableInsert() {
  const entries: { key: string; value: number }[] = []
  const toInsert = [
    { key: 'cat', value: 1 },
    { key: 'dog', value: 2 },
    { key: 'rat', value: 3 },
  ]
  const steps = [{ title: 'Empty Table', description: `${BUCKET_COUNT} buckets, chaining for collisions`, state: htState([]) }]
  for (const item of toInsert) {
    entries.push(item)
    const bucket = hash(item.key)
    const collision = entries.filter((e) => hash(e.key) === bucket).length > 1
    steps.push({
      title: `Insert "${item.key}"`,
      description: `hash("${item.key}") = ${bucket}${collision ? ' (collision, chain)' : ''}`,
      state: htState([...entries], item.key, collision ? [item.key] : undefined),
    })
  }
  return buildSteps(steps)
}

export function generateHashTableSearch() {
  const entries = [
    { key: 'cat', value: 1 },
    { key: 'dog', value: 2 },
    { key: 'rat', value: 3 },
  ]
  const target = 'dog'
  const bucket = hash(target)
  return buildSteps([
    { title: 'Hash Table', description: `Searching for "${target}"`, state: htState(entries) },
    { title: 'Compute Hash', description: `hash("${target}") = ${bucket}`, state: htState(entries, target) },
    { title: 'Search Bucket', description: `Traverse chain at bucket ${bucket}`, state: htState(entries, target) },
    { title: 'Found', description: `"${target}" → value ${entries.find((e) => e.key === target)?.value}`, state: htState(entries, target) },
  ])
}

export function generateHashTableDelete() {
  const entries = [
    { key: 'cat', value: 1 },
    { key: 'dog', value: 2 },
    { key: 'rat', value: 3 },
  ]
  const target = 'dog'
  const after = entries.filter((e) => e.key !== target)
  return buildSteps([
    { title: 'Hash Table', description: `Deleting "${target}"`, state: htState(entries, target) },
    { title: 'Locate in Chain', description: `Found at bucket ${hash(target)}`, state: htState(entries, target) },
    { title: 'Remove', description: `Unlink "${target}" from chain`, state: htState(after) },
  ])
}
