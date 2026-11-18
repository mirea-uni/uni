import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'

function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          Квиты
        </NavLink>
        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/" end>
                Главная
              </NavLink>
              <NavLink to="/properties">Имущество</NavLink>
              <span className="user-email">{user.email}</span>
              <button type="button" className="link-button" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Вход</NavLink>
              <NavLink to="/register">Регистрация</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
