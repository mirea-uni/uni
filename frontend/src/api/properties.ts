import { apiFetch } from './client.ts'
import * as mock from './mockProperties.ts'

export interface Property {
  id: number
  name: string
  address: string
  description: string
  photo_url: string | null
  my_share: number
  can_edit: boolean
}

export interface PropertyInput {
  name: string
  address: string
  description: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// пока нет API имущества (UNI-42) работает на моке, как и авторизация
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

export const PAGE_SIZE = 10

export function listProperties(page: number): Promise<Page<Property>> {
  if (isMock) return mock.listProperties(page, PAGE_SIZE)
  return apiFetch<Page<Property>>(`/properties?page=${page}&size=${PAGE_SIZE}`)
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

export function uploadPhoto(id: number, file: File): Promise<Property> {
  if (isMock) return mock.uploadPhoto(id, file)
  const body = new FormData()
  body.append('file', file)
  return apiFetch<Property>(`/properties/${id}/photo`, { method: 'POST', body })
}

export function deletePhoto(id: number): Promise<Property> {
  if (isMock) return mock.deletePhoto(id)
  return apiFetch<Property>(`/properties/${id}/photo`, { method: 'DELETE' })
}

export function archiveProperty(id: number): Promise<void> {
  if (isMock) return mock.archiveProperty(id)
  return apiFetch<void>(`/properties/${id}/archive`, { method: 'POST' })
}
