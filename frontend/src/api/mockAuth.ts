import { ApiError, getToken } from './client.ts'
import type { User } from './auth.ts'

const USERS_KEY = 'mock_users'

function loadUsers(): Record<string, string> {
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}')
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export async function register(email: string, password: string): Promise<User> {
  await delay()
  const users = loadUsers()
  if (users[email]) {
    throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован')
  }
  users[email] = password
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return { id: Object.keys(users).length, email }
}

export async function login(email: string, password: string): Promise<string> {
  await delay()
  if (loadUsers()[email] !== password) {
    throw new ApiError(401, 'Неверный email или пароль')
  }
  return `mock.${btoa(email)}`
}

export async function getMe(): Promise<User> {
  await delay()
  const token = getToken()
  const email = token?.startsWith('mock.') ? atob(token.slice(5)) : null
  if (!email || !loadUsers()[email]) {
    throw new ApiError(401, 'Сессия истекла')
  }
  return { id: 1, email }
}
