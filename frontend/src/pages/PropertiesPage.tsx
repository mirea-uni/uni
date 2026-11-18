import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { listProperties, type PropertyPage } from '../api/properties.ts'
import HouseIcon from '../components/HouseIcon.tsx'
import ShareBar from '../components/ShareBar.tsx'

interface Result {
  page: number
  data?: PropertyPage
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
      {!loading && result?.data?.items.length === 0 && page === 1 && (
        <div className="empty-state">
          <HouseIcon size={56} />
          <p>У вас пока нет объектов</p>
          <span>Добавьте первый или попросите совладельца пригласить вас.</span>
        </div>
      )}

      {!loading && result?.data && (result.data.items.length > 0 || page > 1) && (
        <>
          <ul className="property-list">
            {result.data.items.map((p) => (
              <li key={p.id}>
                <Link to={`/properties/${p.id}`} className="property-row">
                  <div className="row-photo">{p.photo_url ? <img src={p.photo_url} alt="" /> : <HouseIcon size={28} />}</div>
                  <div className="row-info">
                    <strong>{p.name}</strong>
                    <span>{p.property_type}</span>
                  </div>
                  <ShareBar share={p.ownership_share} compact />
                </Link>
              </li>
            ))}
          </ul>
          {(page > 1 || result.data.hasNext) && (
            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
                Назад
              </button>
              <span>Страница {page}</span>
              <button type="button" disabled={!result.data.hasNext} onClick={() => setParams({ page: String(page + 1) })}>
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
