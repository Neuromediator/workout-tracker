import { apiFetch } from './client'

export interface ExerciseSet {
  id: string
  set_number: number
  reps: number
  weight: number
  notes: string
}

export interface SessionExercise {
  id: string
  exercise_id: string
  order: number
  sets: ExerciseSet[]
}

export interface WorkoutSession {
  id: string
  user_id: string
  routine_id: string | null
  started_at: string
  completed_at: string | null
  notes: string
  exercises: SessionExercise[]
}

export interface SessionCreate {
  routine_id?: string | null
  notes?: string
  exercises?: { exercise_id: string; order: number; sets?: { set_number: number; reps: number; weight: number }[] }[]
}

export function fetchSessions(): Promise<WorkoutSession[]> {
  return apiFetch<WorkoutSession[]>('/sessions')
}

export function fetchSession(id: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>('/sessions/' + id)
}

export function createSession(data: SessionCreate): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function addExerciseToSession(
  sessionId: string,
  exerciseId: string
): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>('/sessions/' + sessionId + '/exercises', {
    method: 'POST',
    body: JSON.stringify({ exercise_id: exerciseId }),
  })
}

export function logSet(
  sessionId: string,
  sessionExerciseId: string,
  data: { set_number: number; reps: number; weight: number; notes?: string }
): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>(
    '/sessions/' + sessionId + '/exercises/' + sessionExerciseId + '/sets',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export function completeSession(sessionId: string): Promise<WorkoutSession> {
  return apiFetch<WorkoutSession>('/sessions/' + sessionId + '/complete', {
    method: 'PUT',
  })
}

export function deleteSession(sessionId: string): Promise<void> {
  return apiFetch('/sessions/' + sessionId, { method: 'DELETE' })
}
