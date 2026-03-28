import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { fetchSessions, createSession, deleteSession, type WorkoutSession } from '@/api/sessions'
import { fetchExercises, type Exercise } from '@/api/exercises'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Dumbbell,
  Calendar,
  Trash2,
} from 'lucide-react'

interface HistoryProps {
  onStartSession: (sessionId: string) => void
}

export default function History({ onStartSession }: HistoryProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reusing, setReusing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchSessions(), fetchExercises()])
      .then(([sessionData, exerciseData]) => {
        // Only completed sessions
        setSessions(sessionData.filter((s) => s.completed_at))
        const map: Record<string, Exercise> = {}
        for (const e of exerciseData) map[e.id] = e
        setExercises(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this workout from history?')) return
    setDeleting(sessionId)
    try {
      await deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setExpandedId(null)
    } catch (err) {
      console.error('Failed to delete session', err)
    } finally {
      setDeleting(null)
    }
  }

  const handleReuse = async (session: WorkoutSession) => {
    setReusing(session.id)
    try {
      const newSession = await createSession({
        routine_id: session.routine_id,
        exercises: session.exercises.map((se) => ({
          exercise_id: se.exercise_id,
          order: se.order,
          sets: se.sets.map((s) => ({
            set_number: s.set_number,
            reps: 0,
            weight: s.weight, // pre-fill last weight
          })),
        })),
      })
      onStartSession(newSession.id)
    } catch (err) {
      console.error('Failed to reuse session', err)
    } finally {
      setReusing(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z')
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z')
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const getDuration = (start: string, end: string | null) => {
    if (!end) return '—'
    const s = new Date(start.endsWith('Z') || start.includes('+') ? start : start + 'Z').getTime()
    const e = new Date(end.endsWith('Z') || end.includes('+') ? end : end + 'Z').getTime()
    const mins = Math.round((e - s) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-pulse rounded-full bg-warm/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Workout History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sessions.length} completed workout{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No completed workouts yet. Finish a session to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const isExpanded = expandedId === s.id
            const totalSets = s.exercises.reduce(
              (acc, ex) => acc + ex.sets.filter((set) => set.reps > 0).length,
              0
            )
            const totalExercises = s.exercises.length

            return (
              <div
                key={s.id}
                className="rounded-xl border border-border/50 bg-card transition-all"
              >
                {/* Session header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm/10">
                    <Calendar className="h-5 w-5 text-warm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatDate(s.completed_at!)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatTime(s.started_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDuration(s.started_at, s.completed_at)}
                      </span>
                      <span>{totalExercises} exercises</span>
                      <span>{totalSets} sets</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-4">
                    <div className="space-y-3">
                      {s.exercises
                        .sort((a, b) => a.order - b.order)
                        .map((se) => {
                          const exercise = exercises[se.exercise_id]
                          const loggedSets = se.sets
                            .filter((set) => set.reps > 0)
                            .sort((a, b) => a.set_number - b.set_number)

                          return (
                            <div key={se.id}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {exercise?.name || 'Unknown'}
                                </p>
                                {exercise && (
                                  <span className="text-xs text-muted-foreground">
                                    {exercise.muscle_group}
                                  </span>
                                )}
                              </div>
                              {loggedSets.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {loggedSets.map((set) => (
                                    <span
                                      key={set.id}
                                      className="rounded-md bg-warm/10 px-2 py-0.5 text-xs font-medium text-warm"
                                    >
                                      {set.weight > 0 ? `${set.weight}kg × ` : ''}
                                      {set.reps} reps
                                      {set.rest_seconds > 0 ? ` · ${set.rest_seconds}s rest` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  No sets logged
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>

                    {s.notes && (
                      <p className="mt-3 text-xs text-muted-foreground italic">
                        {s.notes}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-warm/20 text-warm hover:bg-warm/10 hover:text-warm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReuse(s)
                        }}
                        disabled={reusing === s.id}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        {reusing === s.id ? 'Starting...' : 'Repeat This Workout'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(s.id)
                        }}
                        disabled={deleting === s.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
