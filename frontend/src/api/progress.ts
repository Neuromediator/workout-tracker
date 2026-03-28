import { apiFetch } from './client'

export interface ProgressSummary {
  total_sessions: number
  this_week: number
  this_month: number
  total_sets: number
  total_volume: number
}

export interface WeeklyCount {
  week: string
  count: number
}

export interface PersonalBest {
  exercise_id: string
  exercise_name: string
  muscle_group: string
  weight: number
  reps: number
  date: string
}

export interface ExerciseTrendPoint {
  date: string
  max_weight: number
  best_reps: number
  total_volume: number
  sets: number
}

export function fetchProgressSummary(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>('/progress/summary')
}

export function fetchWeeklyCounts(weeks = 12): Promise<WeeklyCount[]> {
  return apiFetch<WeeklyCount[]>(`/progress/weekly?weeks=${weeks}`)
}

export function fetchPersonalBests(): Promise<PersonalBest[]> {
  return apiFetch<PersonalBest[]>('/progress/personal-bests')
}

export function fetchExerciseTrend(exerciseId: string): Promise<ExerciseTrendPoint[]> {
  return apiFetch<ExerciseTrendPoint[]>(`/progress/exercise/${exerciseId}`)
}
