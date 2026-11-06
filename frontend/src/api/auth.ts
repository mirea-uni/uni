import { apiFetch } from './client.ts'
import * as mock from './mockAuth.ts'

export interface User {
  id: number
  email: string
}

interface TokenResponse {
  access_token: string
}

// пока нет бэка (UNI-15) можно включить VITE_USE_MOCK=true в .env
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

export async function login(email: string, password: string): Promise<string> {
  if (isMock) return mock.login(email, password)
  const data = await apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.access_token
}

export async function register(email: string, password: string): Promise<User> {
  if (isMock) return mock.register(email, password)
  return apiFetch<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(): Promise<User> {
  if (isMock) return mock.getMe()
  return apiFetch<User>('/auth/me')
}
