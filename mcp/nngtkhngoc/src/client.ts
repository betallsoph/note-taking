const DEFAULT_BASE = process.env.CS_HUB_API_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { query?: Record<string, string | undefined> },
): Promise<T> {
  const { query, ...init } = options ?? {}
  const url = new URL(
    path.startsWith('http') ? path : `${DEFAULT_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  )
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: unknown }).error)
        : res.statusText || `HTTP ${res.status}`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

export function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  }
}

export function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: message }],
  }
}
