import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { listProperties, PAGE_SIZE, type Page, type Property } from '../api/properties.ts'
import HouseIcon from '../components/HouseIcon.tsx'
import ShareBar from '../components/ShareBar.tsx'

interface Result {
  page: number
  data?: Page<Property>
  error?: string
}

function PropertiesPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    listProperties(page).then(
      (data) => !cancelled && setResult({ page, data }),
      (err: unknown) => !cancelled && setResult({ page, error: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [page])

  const loading = result?.page !== page
  const pages = result?.data ? Math.max(1, Math.ceil(result.data.total / PAGE_SIZE)) : 1

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Моё имущество</h1>
          {result?.data && <p className="muted">Объектов: {result.data.total}</p>}
        </div>
        <Link className="button" to="/properties/new">
          Добавить объект
        </Link>
      </div>

      {loading && <p>Загрузка...</p>}
      {!loading && result?.error && <p className="form-error">{result.error}</p>}
      {!loading && result?.data?.items.length === 0 && (
        <div className="empty-state">
          <HouseIcon size={56} />
          <p>У вас пока нет объектов</p>
          <span>Добавьте первый или попросите совладельца пригласить вас.</span>
        </div>
      )}

      {!loading && result?.data && result.data.items.length > 0 && (
        <>
          <ul className="property-list">
            {result.data.items.map((p) => (
              <li key={p.id}>
                <Link to={`/properties/${p.id}`} className="property-row">
                  <div className="row-photo">{p.photo_url ? <img src={p.photo_url} alt="" /> : <HouseIcon size={28} />}</div>
                  <div className="row-info">
                    <strong>{p.name}</strong>
                    <span>{p.address || 'Адрес не указан'}</span>
                  </div>
                  <ShareBar share={p.my_share} compact />
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
                Назад
              </button>
              <span>
                Страница {page} из {pages}
              </span>
              <button type="button" disabled={page >= pages} onClick={() => setParams({ page: String(page + 1) })}>
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default PropertiesPage
