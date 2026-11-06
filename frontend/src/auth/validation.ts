const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Введите email'
  if (!EMAIL_RE.test(email.trim())) return 'Некорректный email'
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Введите пароль'
  if (password.length < 8) return 'Пароль должен быть не короче 8 символов'
}
