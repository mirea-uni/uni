import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link to="/">На главную</Link>
    </section>
  )
}

export default NotFoundPage
