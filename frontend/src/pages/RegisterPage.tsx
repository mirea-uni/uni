import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/useAuth.ts'
import { validateEmail, validatePassword } from '../auth/validation.ts'
import FormField from '../components/FormField.tsx'

interface Errors {
  email?: string
  password?: string
  confirm?: string
}

function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors: Errors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: password === confirm ? undefined : 'Пароли не совпадают',
    }
    setErrors(newErrors)
    if (newErrors.email || newErrors.password || newErrors.confirm) return

    setSubmitting(true)
    setServerError('')
    try {
      await register(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>Регистрация</h1>
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
          autoComplete="new-password"
          onChange={setPassword}
        />
        <FormField
          label="Повторите пароль"
          type="password"
          value={confirm}
          error={errors.confirm}
          autoComplete="new-password"
          onChange={setConfirm}
        />
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </section>
  )
}

export default RegisterPage
