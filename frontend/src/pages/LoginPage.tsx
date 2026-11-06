import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/useAuth.ts'
import { validateEmail } from '../auth/validation.ts'
import FormField from '../components/FormField.tsx'

function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Введите пароль',
    }
    setErrors(newErrors)
    if (newErrors.email || newErrors.password) return

    setSubmitting(true)
    setServerError('')
    try {
      await login(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>Вход</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          type="email"
          value={email}
          error={errors.email}
          autoComplete="email"
          onChange={setEmail}
        />
        <FormField
          label="Пароль"
          type="password"
          value={password}
          error={errors.password}
          autoComplete="current-password"
          onChange={setPassword}
        />
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Входим...' : 'Войти'}
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </section>
  )
}

export default LoginPage
