import { Route, Routes } from 'react-router'
import Layout from './components/Layout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
