import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'

function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <header className="header">
        <span className="logo">Квиты</span>
        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/" end>
                Главная
              </NavLink>
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
