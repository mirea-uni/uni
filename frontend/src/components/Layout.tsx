import { NavLink, Outlet } from 'react-router'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <span className="logo">Квиты</span>
        <nav className="nav">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/login">Вход</NavLink>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
