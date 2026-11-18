import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { archiveProperty, getProperty, type Property } from '../api/properties.ts'

interface Result {
  id: number
  data?: Property
  error?: string
}

function PropertyPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const [result, setResult] = useState<Result | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProperty(id).then(
      (data) => !cancelled && setResult({ id, data }),
      (err: unknown) => !cancelled && setResult({ id, error: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [id])

  if (result?.id !== id) return <p>Загрузка...</p>
  if (!result.data) return <p className="form-error">{result.error}</p>
  const property = result.data

  async function handleArchive() {
    setArchiving(true)
    setActionError('')
    try {
      await archiveProperty(id)
      navigate('/properties', { replace: true })
    } catch (err) {
      setActionError(errorMessage(err, 'Не удалось архивировать объект'))
      setArchiving(false)
    }
  }

  return (
    <section className="property-card">
      <Link to="/properties">← К списку</Link>
      <h1>{property.name}</h1>
      {property.photo_url && <img className="property-photo" src={property.photo_url} alt={property.name} />}
      <p>
        <b>Адрес:</b> {property.address || '—'}
      </p>
      <p>
        <b>Описание:</b> {property.description || '—'}
      </p>
      <p>
        <b>Ваша доля:</b> {property.my_share}%
      </p>

      {property.can_edit && (
        <div className="actions">
          <Link className="button" to={`/properties/${id}/edit`}>
            Редактировать
          </Link>
          {!confirming ? (
            <button type="button" className="button danger" onClick={() => setConfirming(true)}>
              В архив
            </button>
          ) : (
            <span className="confirm">
              Убрать объект в архив?
              <button type="button" className="button danger" disabled={archiving} onClick={handleArchive}>
                Да
              </button>
              <button type="button" className="button secondary" onClick={() => setConfirming(false)}>
                Отмена
              </button>
            </span>
          )}
        </div>
      )}
      {actionError && <p className="form-error">{actionError}</p>}
    </section>
  )
}

export default PropertyPage
