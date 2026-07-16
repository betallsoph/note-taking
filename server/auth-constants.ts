export interface AuthUser {
  id: string
  email: string
  name: string
  username: string | null
}

export const MOCK_USER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'learner@example.com',
  name: 'CS Learner',
  username: null,
}
