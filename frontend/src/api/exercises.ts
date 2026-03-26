import { apiFetch } from './client'

export interface Exercise {
  id: string
  name: string
  description: string
  muscle_group: string
  tags: string[]
  is_custom: boolean
  user_id: string | null
}

export interface ExerciseCreate {
  name: string
  description?: string
  muscle_group: string
  tags?: string[]
}

export function fetchExercises(params?: {
  muscle_group?: string
  search?: string
  tag?: string
}): Promise<Exercise[]> {
  const query = new URLSearchParams()
  if (params?.muscle_group) query.set('muscle_group', params.muscle_group)
  if (params?.search) query.set('search', params.search)
  if (params?.tag) query.set('tag', params.tag)
  const qs = query.toString()
  return apiFetch<Exercise[]>(`/exercises${qs ? `?${qs}` : ''}`)
}

export function createExercise(data: ExerciseCreate): Promise<Exercise> {
  return apiFetch<Exercise>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteExercise(id: string): Promise<void> {
  return apiFetch('/exercises/' + id, { method: 'DELETE' })
}
