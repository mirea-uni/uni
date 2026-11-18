import { ApiError, apiFetch } from './client.ts'
import * as mock from './mockAuth.ts'

export interface User {
  id: number
  email: string
}

export interface Session {
  access_token: string
  user: User
}

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

// бэк отдаёт ошибки на английском, пользователю показываем понятный текст
const MESSAGES: Record<number, string> = {
  401: 'Неверный email или пароль',
  409: 'Пользователь с таким email уже зарегистрирован',
  422: 'Проверьте email, пароль должен быть не короче 8 символов',
}

async function authRequest(path: string, email: string, password: string): Promise<Session> {
  try {
    return await apiFetch<Session>(path, { method: 'POST', body: JSON.stringify({ email, password }) })
  } catch (err) {
    if (err instanceof ApiError && MESSAGES[err.status]) {
      throw new ApiError(err.status, MESSAGES[err.status])
    }
    throw err
  }
}

export function login(email: string, password: string): Promise<Session> {
  if (isMock) return mock.login(email, password)
  return authRequest('/auth/login', email, password)
}

export function register(email: string, password: string): Promise<Session> {
  if (isMock) return mock.register(email, password)
  return authRequest('/auth/register', email, password)
}
