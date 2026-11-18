import { ApiError, getToken } from './client.ts'
import type { Property, PropertyInput } from './properties.ts'

const KEY = 'mock_properties'

interface Stored extends PropertyInput {
  id: number
  archived: boolean
  // доли по email пользователя, '*' — для любого вошедшего (демо-объект)
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
  return [
    {
      id: 1,
      name: 'Дача в Подмосковье',
      description: 'Дом и баня, летний сезон',
      property_type: 'Дача',
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

function share(item: Stored, email: string): number | undefined {
  return item.shares[email] ?? item.shares['*']
}

function toProperty(item: Stored, email: string): Property {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    property_type: item.property_type,
    photo_url: item.photo_url,
    ownership_share: share(item, email) ?? 0,
  }
}

function find(id: number, email: string): Stored {
  const item = load().find((p) => p.id === id && !p.archived)
  if (!item) throw new ApiError(404, 'Объект не найден')
  if (share(item, email) === undefined) throw new ApiError(403, 'Нет доступа к объекту')
  return item
}

export async function listProperties(offset: number, limit: number): Promise<Property[]> {
  await delay()
  const email = currentEmail()
  return load()
    .filter((item) => !item.archived && share(item, email) !== undefined)
    .slice(offset, offset + limit)
    .map((item) => toProperty(item, email))
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
    archived: false,
    shares: { [email]: 100 },
  }
  save([...items, item])
  return toProperty(item, email)
}

export async function updateProperty(id: number, data: PropertyInput): Promise<Property> {
  await delay()
  const email = currentEmail()
  find(id, email)
  save(load().map((p) => (p.id === id ? { ...p, ...data } : p)))
  return toProperty(find(id, email), email)
}

export async function archiveProperty(id: number): Promise<void> {
  await delay()
  const email = currentEmail()
  find(id, email)
  save(load().map((p) => (p.id === id ? { ...p, archived: true } : p)))
}
