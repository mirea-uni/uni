import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { errorMessage } from '../api/client.ts'
import {
  canEdit,
  createProperty,
  getProperty,
  PROPERTY_TYPES,
  updateProperty,
  type Property,
} from '../api/properties.ts'
import FormField from '../components/FormField.tsx'

interface FormValues {
  name: string
  property_type: string
  description: string
  photo_url: string
}

const EMPTY: FormValues = { name: '', property_type: '', description: '', photo_url: '' }

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
  if (!canEdit(loaded.data)) return <p className="form-error">Недостаточно прав для редактирования</p>
  return <PropertyForm property={loaded.data} />
}

function PropertyForm({ property }: { property?: Property }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>(
    property
      ? {
          name: property.name,
          property_type: property.property_type,
          description: property.description ?? '',
          photo_url: property.photo_url ?? '',
        }
      : EMPTY,
  )
  const [nameError, setNameError] = useState<string>()
  const [typeError, setTypeError] = useState<string>()
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  function change(field: keyof FormValues) {
    return (value: string) => {
      setValues((v) => ({ ...v, [field]: value }))
      if (field === 'name') setNameError(undefined)
      if (field === 'property_type') setTypeError(undefined)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = values.name.trim()
    setNameError(name ? undefined : 'Введите название')
    setTypeError(values.property_type ? undefined : 'Выберите тип')
    if (!name || !values.property_type) return
    setSaving(true)
    setServerError('')
    try {
      const data = {
        name,
        property_type: values.property_type,
        description: values.description.trim() || null,
        photo_url: values.photo_url.trim() || null,
      }
      const saved = property ? await updateProperty(property.id, data) : await createProperty(data)
      navigate(`/properties/${saved.id}`)
    } catch (err) {
      setServerError(errorMessage(err, 'Не удалось сохранить объект'))
      setSaving(false)
    }
  }

  return (
    <section className="auth">
      <Link className="back" to={property ? `/properties/${property.id}` : '/properties'}>
        {property ? 'К объекту' : 'К списку объектов'}
      </Link>
      <h1>{property ? 'Редактирование объекта' : 'Новый объект'}</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Название" type="text" value={values.name} error={nameError} onChange={change('name')} />
        <label className="field">
          <span>Тип</span>
          <select
            value={values.property_type}
            onChange={(e) => change('property_type')(e.target.value)}
            aria-invalid={Boolean(typeError)}
          >
            <option value="">Выберите тип</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
            {values.property_type && !PROPERTY_TYPES.includes(values.property_type) && (
              <option>{values.property_type}</option>
            )}
          </select>
          {typeError && <span className="field-error">{typeError}</span>}
        </label>
        <FormField label="Описание" type="text" value={values.description} onChange={change('description')} />
        <FormField label="Ссылка на фото" type="url" value={values.photo_url} onChange={change('photo_url')} />
        {values.photo_url.trim() && (
          <div className="current-photo">
            <img src={values.photo_url.trim()} alt="" />
            <button type="button" className="button secondary" onClick={() => change('photo_url')('')}>
              Удалить фото
            </button>
          </div>
        )}
        {serverError && <p className="form-error">{serverError}</p>}
        <button type="submit" disabled={saving}>
          {saving ? 'Сохраняем...' : property ? 'Сохранить изменения' : 'Добавить объект'}
        </button>
      </form>
    </section>
  )
}

export default PropertyFormPage
