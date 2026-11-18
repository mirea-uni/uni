import { ApiError, getToken } from './client.ts'
import type { Page, Property, PropertyInput } from './properties.ts'

const KEY = 'mock_properties'
const MAX_PHOTO = 2 * 1024 * 1024

interface Stored extends PropertyInput {
  id: number
  owner: string
  photo_url: string | null
  archived: boolean
  // доли по email пользователя
  shares: Record<string, number>
}

function currentEmail(): string {
  const token = getToken()
  if (!token?.startsWith('mock.')) throw new ApiError(401, 'Сессия истекла')
  return atob(token.slice(5))
}

function load(): Stored[] {
  const raw = localStorage.getItem(KEY)
  if (raw) return JSON.parse(raw)
  // чтобы было что посмотреть: объект, где пользователь не владелец и редактировать не может
  return [
    {
      id: 1,
      owner: 'demo@kvity.ru',
      name: 'Дача в Подмосковье',
      address: 'Московская обл., СНТ «Берёзка», уч. 12',
      description: 'Дом и баня, летний сезон',
      photo_url: null,
      archived: false,
      shares: { 'demo@kvity.ru': 70, '*': 30 },
    },
  ]
}

function save(items: Stored[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

function toProperty(item: Stored, email: string): Property {
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    description: item.description,
    photo_url: item.photo_url,
    my_share: item.shares[email] ?? item.shares['*'] ?? 0,
    can_edit: item.owner === email,
  }
}

function visible(email: string): Stored[] {
  return load().filter((item) => !item.archived && (email in item.shares || '*' in item.shares))
}

function find(id: number, email: string): Stored {
  const item = visible(email).find((p) => p.id === id)
  if (!item) throw new ApiError(404, 'Объект не найден')
  return item
}

function checkEdit(item: Stored, email: string) {
  if (item.owner !== email) throw new ApiError(403, 'Недостаточно прав')
}

export async function listProperties(page: number, size: number): Promise<Page<Property>> {
  await delay()
  const email = currentEmail()
  const items = visible(email)
  const start = (page - 1) * size
  return {
    items: items.slice(start, start + size).map((item) => toProperty(item, email)),
    total: items.length,
    page,
    size,
  }
}

export async function getProperty(id: number): Promise<Property> {
  await delay()
  const email = currentEmail()
  return toProperty(find(id, email), email)
}

export async function createProperty(data: PropertyInput): Promise<Property> {
  await delay()
  const email = currentEmail()
  const items = load()
  const item: Stored = {
    ...data,
    id: Math.max(0, ...items.map((p) => p.id)) + 1,
    owner: email,
    photo_url: null,
    archived: false,
    shares: { [email]: 100 },
  }
  save([...items, item])
  return toProperty(item, email)
}

export async function updateProperty(id: number, data: PropertyInput): Promise<Property> {
  await delay()
  const email = currentEmail()
  checkEdit(find(id, email), email)
  const items = load().map((p) => (p.id === id ? { ...p, ...data } : p))
  save(items)
  return toProperty(find(id, email), email)
}

export async function uploadPhoto(id: number, file: File): Promise<Property> {
  await delay()
  const email = currentEmail()
  checkEdit(find(id, email), email)
  if (!file.type.startsWith('image/')) throw new ApiError(422, 'Можно загрузить только изображение')
  if (file.size > MAX_PHOTO) throw new ApiError(413, 'Фото слишком большое, максимум 2 МБ')
  const url = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
  save(load().map((p) => (p.id === id ? { ...p, photo_url: url } : p)))
  return toProperty(find(id, email), email)
}

export async function deletePhoto(id: number): Promise<Property> {
  await delay()
  const email = currentEmail()
  checkEdit(find(id, email), email)
  save(load().map((p) => (p.id === id ? { ...p, photo_url: null } : p)))
  return toProperty(find(id, email), email)
}

export async function archiveProperty(id: number): Promise<void> {
  await delay()
  const email = currentEmail()
  checkEdit(find(id, email), email)
  save(load().map((p) => (p.id === id ? { ...p, archived: true } : p)))
}
