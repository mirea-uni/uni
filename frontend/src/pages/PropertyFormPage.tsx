import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import {
  createProperty,
  deletePhoto,
  getProperty,
  updateProperty,
  uploadPhoto,
  type Property,
  type PropertyInput,
} from '../api/properties.ts'
import FormField from '../components/FormField.tsx'

const EMPTY: PropertyInput = { name: '', address: '', description: '' }

function PropertyFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const [loaded, setLoaded] = useState<{ id: number; data?: Property; error?: string } | null>(null)

  useEffect(() => {
    if (id === null) return
    let cancelled = false
    getProperty(id).then(
      (data) => !cancelled && setLoaded({ id, data }),
      (err: unknown) => !cancelled && setLoaded({ id, error: errorMessage(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [id])

  if (id === null) return <PropertyForm />
  if (loaded?.id !== id) return <p>Загрузка...</p>
  if (!loaded.data) return <p className="form-error">{loaded.error}</p>
  if (!loaded.data.can_edit) return <p className="form-error">Недостаточно прав для редактирования</p>
  return <PropertyForm property={loaded.data} />
}

function PropertyForm({ property }: { property?: Property }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<PropertyInput>(
    property ? { name: property.name, address: property.address, description: property.description } : EMPTY,
  )
  const [photo, setPhoto] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [nameError, setNameError] = useState<string>()
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  function change(field: keyof PropertyInput) {
    return (value: string) => setValues((v) => ({ ...v, [field]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!values.name.trim()) {
      setNameError('Введите название')
      return
    }
    setNameError(undefined)
    setSaving(true)
    setServerError('')
    try {
      const data = { ...values, name: values.name.trim() }
      const saved = property ? await updateProperty(property.id, data) : await createProperty(data)
      if (photo) await uploadPhoto(saved.id, photo)
      else if (removePhoto) await deletePhoto(saved.id)
      // карточка заново загрузит объект с сервера, поэтому покажет актуальные данные
      navigate(`/properties/${saved.id}`)
    } catch (err) {
      setServerError(errorMessage(err, 'Не удалось сохранить объект'))
      setSaving(false)
    }
  }

  return (
    <section className="auth">
      <Link to={property ? `/properties/${property.id}` : '/properties'}>← Назад</Link>
      <h1>{property ? 'Редактирование объекта' : 'Новый объект'}</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Название" type="text" value={values.name} error={nameError} onChange={change('name')} />
        <FormField label="Адрес" type="text" value={values.address} onChange={change('address')} />
        <FormField label="Описание" type="text" value={values.description} onChange={change('description')} />
        {property?.photo_url && !removePhoto && (
          <div className="current-photo">
            <img src={property.photo_url} alt="" />
            <button type="button" className="button secondary" onClick={() => setRemovePhoto(true)}>
              Удалить фото
            </button>
          </div>
        )}
        {removePhoto && (
          <p className="empty">
            Фото будет удалено после сохранения.{' '}
            <button type="button" className="link-button" onClick={() => setRemovePhoto(false)}>
              Отменить
            </button>
          </p>
        )}
        <label className="field">
          <span>{property?.photo_url ? 'Новое фото' : 'Фото'}</span>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </form>
    </section>
  )
}

export default PropertyFormPage
