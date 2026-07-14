const BASE = '/api'
const ACCESS_TOKEN_STORAGE_KEY = 'cs-hub-access-token'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const accessToken = getAccessToken()
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(err.error ?? 'Request failed', res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    me: () => request<import('@/types').User>('/auth/me'),
  },
  dashboard: {
    stats: () => request<import('@/types').DashboardStats>('/dashboard'),
  },
  articles: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<import('@/types').Article[]>(`/articles${qs}`)
    },
    get: (id: string) => request<import('@/types').Article>(`/articles/${id}`),
    create: (data: Partial<import('@/types').Article>) =>
      request<import('@/types').Article>('/articles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Article>) =>
      request<import('@/types').Article>(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/articles/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) =>
      request<import('@/types').Article>(`/articles/${id}/duplicate`, { method: 'POST' }),
    archive: (id: string) =>
      request<import('@/types').Article>(`/articles/${id}/archive`, { method: 'POST' }),
  },
  categories: {
    list: () => request<import('@/types').Category[]>('/categories'),
    create: (data: Partial<import('@/types').Category>) =>
      request<import('@/types').Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Category>) =>
      request<import('@/types').Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  tags: {
    list: () => request<import('@/types').Tag[]>('/tags'),
    create: (data: Partial<import('@/types').Tag>) =>
      request<import('@/types').Tag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  },
  problems: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<import('@/types').Problem[]>(`/problems${qs}`)
    },
    get: (id: string) => request<import('@/types').ProblemDetail>(`/problems/${id}`),
    create: (data: Partial<import('@/types').Problem>) =>
      request<import('@/types').Problem>('/problems', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Problem>) =>
      request<import('@/types').Problem>(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/problems/${id}`, { method: 'DELETE' }),
    addSolution: (id: string, data: Partial<import('@/types').Solution>) =>
      request<import('@/types').Solution>(`/problems/${id}/solutions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addMistake: (id: string, data: Partial<import('@/types').Mistake>) =>
      request<import('@/types').Mistake>(`/problems/${id}/mistakes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  flashcards: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<import('@/types').Flashcard[]>(`/flashcards${qs}`)
    },
    due: () => request<import('@/types').Flashcard[]>('/flashcards/due'),
    get: (id: string) => request<import('@/types').Flashcard>(`/flashcards/${id}`),
    create: (data: Partial<import('@/types').Flashcard>) =>
      request<import('@/types').Flashcard>('/flashcards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Flashcard>) =>
      request<import('@/types').Flashcard>(`/flashcards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/flashcards/${id}`, { method: 'DELETE' }),
    review: (id: string, rating: import('@/types').ReviewRating) =>
      request<import('@/types').Flashcard>(`/flashcards/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),
  },
  roadmaps: {
    list: () => request<import('@/types').Roadmap[]>('/roadmaps'),
    get: (id: string) => request<import('@/types').Roadmap>(`/roadmaps/${id}`),
    create: (data: Partial<import('@/types').Roadmap>) =>
      request<import('@/types').Roadmap>('/roadmaps', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Roadmap>) =>
      request<import('@/types').Roadmap>(`/roadmaps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/roadmaps/${id}`, { method: 'DELETE' }),
    addItem: (id: string, data: Partial<import('@/types').RoadmapItem>) =>
      request<import('@/types').RoadmapItem>(`/roadmaps/${id}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (roadmapId: string, itemId: string, data: Partial<import('@/types').RoadmapItem>) =>
      request<import('@/types').RoadmapItem>(`/roadmaps/${roadmapId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteItem: (roadmapId: string, itemId: string) =>
      request<void>(`/roadmaps/${roadmapId}/items/${itemId}`, { method: 'DELETE' }),
  },
  notes: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<import('@/types').Note[]>(`/notes${qs}`)
    },
    get: (id: string) => request<import('@/types').Note>(`/notes/${id}`),
    create: (data: Partial<import('@/types').Note>) =>
      request<import('@/types').Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Note>) =>
      request<import('@/types').Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
  },
  reminders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<import('@/types').Reminder[]>(`/reminders${qs}`)
    },
    due: () => request<import('@/types').Reminder[]>('/reminders/due'),
    get: (id: string) => request<import('@/types').Reminder>(`/reminders/${id}`),
    create: (data: Partial<import('@/types').Reminder>) =>
      request<import('@/types').Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('@/types').Reminder>) =>
      request<import('@/types').Reminder>(`/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),
  },
  devAccounts: {
    listProjects: () => request<import('@/types').DevProject[]>('/dev-accounts/projects'),
    createProject: (data: Partial<import('@/types').DevProject>) =>
      request<import('@/types').DevProject>('/dev-accounts/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateProject: (id: string, data: Partial<import('@/types').DevProject>) =>
      request<import('@/types').DevProject>(`/dev-accounts/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteProject: (id: string) =>
      request<void>(`/dev-accounts/projects/${id}`, { method: 'DELETE' }),
    createAccount: (projectId: string, data: Partial<import('@/types').DevAccount>) =>
      request<import('@/types').DevAccount>(`/dev-accounts/projects/${projectId}/accounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateAccount: (
      projectId: string,
      accountId: string,
      data: Partial<import('@/types').DevAccount>,
    ) =>
      request<import('@/types').DevAccount>(
        `/dev-accounts/projects/${projectId}/accounts/${accountId}`,
        { method: 'PUT', body: JSON.stringify(data) },
      ),
    deleteAccount: (projectId: string, accountId: string) =>
      request<void>(`/dev-accounts/projects/${projectId}/accounts/${accountId}`, {
        method: 'DELETE',
      }),
  },
  simulations: {
    types: () => request<{ dataStructures: string[]; sorting: string[]; graph: string[]; tree: string[] }>(
      '/simulations/types',
    ),
    generate: (type: string, input?: unknown) =>
      request<import('@/types').SimulationResult>('/simulations/generate', {
        method: 'POST',
        body: JSON.stringify({ type, input }),
      }),
    search: (q: string) =>
      request<import('@/types').SearchResults>(`/simulations/search?q=${encodeURIComponent(q)}`),
  },
}
