import { useAuth } from '../auth/useAuth.ts'

function HomePage() {
  const { user } = useAuth()

  return (
    <section>
      <h1>Квиты</h1>
      <p>Платформа для совместного владения имуществом.</p>
      {user && <p>Вы вошли как {user.email}</p>}
    </section>
  )
}

export default HomePage
