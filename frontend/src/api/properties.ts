import { apiFetch } from './client.ts'
import * as mock from './mockProperties.ts'

// поля как в PropertyResponse на бэке (app/api/properties.py)
export interface Property {
  id: number
  name: string
  description: string | null
  property_type: string
  photo_url: string | null
  ownership_share: number
  can_edit?: boolean
}

export interface PropertyInput {
  name: string
  description: string | null
  property_type: string
  photo_url: string | null
}

export interface PropertyPage {
  items: Property[]
  hasNext: boolean
}

export const PAGE_SIZE = 10

export const PROPERTY_TYPES = ['Квартира', 'Дом', 'Дача', 'Автомобиль', 'Другое']

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

// бэк пока не отдаёт права (замечание в PR #13), до этого кнопки видят все совладельцы
export function canEdit(property: Property): boolean {
  return property.can_edit ?? true
}

export async function listProperties(page: number): Promise<PropertyPage> {
  const offset = (page - 1) * PAGE_SIZE
  // бэк не отдаёт общее количество, поэтому просим на один объект больше, чтобы понять, есть ли следующая страница
  const items = isMock
    ? await mock.listProperties(offset, PAGE_SIZE + 1)
    : await apiFetch<Property[]>(`/properties?offset=${offset}&limit=${PAGE_SIZE + 1}`)
  return { items: items.slice(0, PAGE_SIZE), hasNext: items.length > PAGE_SIZE }
}

export function getProperty(id: number): Promise<Property> {
  if (isMock) return mock.getProperty(id)
  return apiFetch<Property>(`/properties/${id}`)
}

export function createProperty(data: PropertyInput): Promise<Property> {
  if (isMock) return mock.createProperty(data)
  return apiFetch<Property>('/properties', { method: 'POST', body: JSON.stringify(data) })
}

export function updateProperty(id: number, data: PropertyInput): Promise<Property> {
  if (isMock) return mock.updateProperty(id, data)
  return apiFetch<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function archiveProperty(id: number): Promise<void> {
  if (isMock) return mock.archiveProperty(id)
  return apiFetch<void>(`/properties/${id}`, { method: 'DELETE' })
}
