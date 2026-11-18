import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import * as authApi from '../api/auth.ts'
import { getToken, setToken, setUnauthorizedHandler } from '../api/client.ts'
import { AuthContext } from './AuthContext.ts'

const USER_KEY = 'user'

// у бэка нет /auth/me, поэтому пользователя из ответа на вход храним рядом с токеном
function loadUser(): authApi.User | null {
  if (!getToken()) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<authApi.User | null>(loadUser)

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // если токен протух, первый же запрос вернёт 401 и apiFetch вызовет logout
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  function start(session: authApi.Session) {
    setToken(session.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    setUser(session.user)
  }

  async function login(email: string, password: string) {
    start(await authApi.login(email, password))
  }

  async function register(email: string, password: string) {
    start(await authApi.register(email, password))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
