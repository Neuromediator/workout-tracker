import { apiFetch } from './client'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface SessionExerciseData {
  exercise_name: string
  sets: number
  reps: number
  weight: number
}

export interface SessionData {
  routine_name: string | null
  exercises: SessionExerciseData[]
  notes: string
}

export interface AIAction {
  type: 'create_session' | 'edit_session' | 'delete_session' | 'info'
  requires_confirmation: boolean
  session_id: string | null
  session_data: SessionData | null
}

export interface ChatResponse {
  response: string
  action: AIAction | null
  result: { success: boolean; message: string; session_id?: string } | null
}

export interface AISettings {
  ai_enabled: boolean
}

export function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export function confirmAction(action: string, sessionId: string | null): Promise<{ success: boolean; message: string }> {
  return apiFetch('/ai/confirm', {
    method: 'POST',
    body: JSON.stringify({ action, session_id: sessionId }),
  })
}

export function fetchAISettings(): Promise<AISettings> {
  return apiFetch<AISettings>('/ai/settings')
}

export function updateAISettings(aiEnabled: boolean): Promise<AISettings> {
  return apiFetch<AISettings>('/ai/settings', {
    method: 'PUT',
    body: JSON.stringify({ ai_enabled: aiEnabled }),
  })
}
