import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { archiveProperty, canEdit, getProperty, type Property } from '../api/properties.ts'
import HouseIcon from '../components/HouseIcon.tsx'
import ShareBar from '../components/ShareBar.tsx'

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
    <section>
      <Link className="back" to="/properties">К списку объектов</Link>
      <div className="property-card">
        <div className="card-photo">
          {property.photo_url ? <img src={property.photo_url} alt={property.name} /> : <HouseIcon size={72} />}
        </div>
        <div className="card-body">
          <h1>{property.name}</h1>
          <p className="muted">{property.property_type}</p>
          {property.description && <p>{property.description}</p>}

          <div className="share-block">
            <span className="share-label">Ваша доля</span>
            <ShareBar share={property.ownership_share} />
          </div>

          {canEdit(property) && (
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
        </div>
      </div>
    </section>
  )
}

export default PropertyPage
