import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { listProperties, PAGE_SIZE, type Page, type Property } from '../api/properties.ts'

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
        <h1>Моё имущество</h1>
        <Link className="button" to="/properties/new">
          Добавить объект
        </Link>
      </div>

      {loading && <p>Загрузка...</p>}
      {!loading && result?.error && <p className="form-error">{result.error}</p>}
      {!loading && result?.data?.items.length === 0 && (
        <p className="empty">У вас пока нет объектов. Добавьте первый или попросите совладельца пригласить вас.</p>
      )}

      {!loading && result?.data && result.data.items.length > 0 && (
        <>
          <ul className="property-list">
            {result.data.items.map((p) => (
              <li key={p.id}>
                <Link to={`/properties/${p.id}`} className="property-item">
                  {p.photo_url ? <img src={p.photo_url} alt="" /> : <div className="no-photo">нет фото</div>}
                  <div className="property-info">
                    <strong>{p.name}</strong>
                    <span>{p.address}</span>
                  </div>
                  <span className="share">{p.my_share}%</span>
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
