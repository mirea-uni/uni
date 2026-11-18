import { ApiError } from './client.ts'
import type { Session } from './auth.ts'

const USERS_KEY = 'mock_users'

function loadUsers(): Record<string, string> {
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}')
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

function session(email: string): Session {
  return { access_token: `mock.${btoa(email)}`, user: { id: Object.keys(loadUsers()).indexOf(email) + 1, email } }
}

export async function register(email: string, password: string): Promise<Session> {
  await delay()
  const users = loadUsers()
  if (users[email]) {
    throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован')
  }
  users[email] = password
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return session(email)
}

export async function login(email: string, password: string): Promise<Session> {
  await delay()
  if (loadUsers()[email] !== password) {
    throw new ApiError(401, 'Неверный email или пароль')
  }
  return session(email)
}
