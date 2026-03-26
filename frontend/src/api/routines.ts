import { apiFetch } from './client'

export interface RoutineExercise {
  id: string
  exercise_id: string
  order: number
  target_sets: number
  target_reps: number
}

export interface Routine {
  id: string
  user_id: string
  name: string
  is_template: boolean
  routine_exercises: RoutineExercise[]
}

export interface RoutineExerciseIn {
  exercise_id: string
  order: number
  target_sets: number
  target_reps: number
}

export interface RoutineCreate {
  name: string
  exercises: RoutineExerciseIn[]
}

export interface RoutineUpdate {
  name?: string
  exercises?: RoutineExerciseIn[]
}

export function fetchRoutines(): Promise<Routine[]> {
  return apiFetch<Routine[]>('/routines')
}

export function fetchRoutine(id: string): Promise<Routine> {
  return apiFetch<Routine>('/routines/' + id)
}

export function createRoutine(data: RoutineCreate): Promise<Routine> {
  return apiFetch<Routine>('/routines', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRoutine(id: string, data: RoutineUpdate): Promise<Routine> {
  return apiFetch<Routine>('/routines/' + id, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteRoutine(id: string): Promise<void> {
  return apiFetch('/routines/' + id, { method: 'DELETE' })
}
