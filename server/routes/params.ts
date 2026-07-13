export function queryParam(value: unknown) {
  return typeof value === 'string' ? value : undefined
}
