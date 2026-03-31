import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchExercises, type Exercise } from '@/api/exercises'
import {
  fetchSession,
  logSet,
  addExerciseToSession,
  completeSession,
  type WorkoutSession,
} from '@/api/sessions'
import { useTranslation } from '@/lib/i18n'
import {
  Plus,
  Check,
  ArrowLeft,
  Search,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ActiveSessionProps {
  sessionId: string
  onComplete: () => void
  onBack: () => void
}

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core']

const MUSCLE_GROUP_KEYS: Record<string, string> = {
  all: 'exercises.all',
  chest: 'exercises.chest',
  back: 'exercises.back',
  legs: 'exercises.legs',
  shoulders: 'exercises.shoulders',
  arms: 'exercises.arms',
  core: 'exercises.core',
}

export default function ActiveSession({ sessionId, onComplete, onBack }: ActiveSessionProps) {
  const { t } = useTranslation()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerMuscle, setPickerMuscle] = useState('all')
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    try {
      const [sessionData, exerciseList] = await Promise.all([
        fetchSession(sessionId),
        fetchExercises(),
      ])
      setSession(sessionData)
      setAllExercises(exerciseList)
      const map: Record<string, Exercise> = {}
      for (const e of exerciseList) map[e.id] = e
      setExercises(map)
      // Auto-expand first exercise
      if (sessionData.exercises.length > 0 && !expandedExercise) {
        setExpandedExercise(sessionData.exercises[0].id)
      }
    } catch (err) {
      console.error('Failed to load session', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Timer
  useEffect(() => {
    if (!session) return
    const raw = session.started_at
    const startTime = new Date(raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z').getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [session?.started_at])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleLogSet = async (
    sessionExerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    restSeconds: number
  ) => {
    try {
      const updated = await logSet(sessionId, sessionExerciseId, {
        set_number: setNumber,
        reps,
        weight,
        rest_seconds: restSeconds,
      })
      setSession(updated)
    } catch (err) {
      console.error('Failed to log set', err)
    }
  }

  const handleAddExercise = async (exercise: Exercise) => {
    try {
      const updated = await addExerciseToSession(sessionId, exercise.id)
      setSession(updated)
      setPickerOpen(false)
      setPickerSearch('')
      setPickerMuscle('all')
      const newEx = updated.exercises[updated.exercises.length - 1]
      if (newEx) setExpandedExercise(newEx.id)
    } catch (err) {
      console.error('Failed to add exercise', err)
    }
  }

  const handleAddSet = async (sessionExerciseId: string, currentSetsCount: number) => {
    try {
      const updated = await logSet(sessionId, sessionExerciseId, {
        set_number: currentSetsCount + 1,
        reps: 0,
        weight: 0,
      })
      setSession(updated)
    } catch (err) {
      console.error('Failed to add set', err)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await completeSession(sessionId)
      onComplete()
    } catch (err) {
      console.error('Failed to complete session', err)
    } finally {
      setCompleting(false)
    }
  }

  const filteredExercises = allExercises.filter((e) => {
    if (pickerMuscle !== 'all' && e.muscle_group !== pickerMuscle) return false
    if (pickerSearch && !e.name.toLowerCase().includes(pickerSearch.toLowerCase())) return false
    return true
  })

  const completedSetsCount = session?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.reps > 0).length,
    0
  ) ?? 0

  const totalSetsCount = session?.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  ) ?? 0

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-pulse rounded-full bg-warm/30" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold tracking-tight">{t('session.activeWorkout')}</h2>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-warm" />
          <span className="font-mono text-sm font-medium text-warm">{formatTime(elapsed)}</span>
        </div>
        <div className="h-4 w-px bg-border/50" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{completedSetsCount}</span>
          <span className="text-muted-foreground">/{totalSetsCount} {t('sets')}</span>
        </div>
        <div className="h-4 w-px bg-border/50" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{session.exercises.length}</span>
          {' '}{t('exercises')}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-2">
        {session.exercises
          .sort((a, b) => a.order - b.order)
          .map((se) => {
            const exercise = exercises[se.exercise_id]
            const isExpanded = expandedExercise === se.id
            const sortedSets = [...se.sets].sort((a, b) => a.set_number - b.set_number)
            const filledSets = sortedSets.filter((s) => s.reps > 0).length

            return (
              <div
                key={se.id}
                className="rounded-xl border border-border/50 bg-card transition-all"
              >
                {/* Exercise header */}
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : se.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{exercise?.name || t('session.unknown')}</p>
                      <span className="text-xs text-muted-foreground">
                        {filledSets}/{sortedSets.length}
                      </span>
                    </div>
                    {exercise && (
                      <p className="text-xs text-muted-foreground">{exercise.muscle_group}</p>
                    )}
                  </div>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-1">
                    {sortedSets.map((s) => (
                      <div
                        key={s.id}
                        className={`h-2 w-2 rounded-full ${
                          s.reps > 0 ? 'bg-warm' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded sets */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-3">
                    {/* Header row */}
                    <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 px-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('session.set')}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('session.weight')}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('session.reps')}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t('session.rest')}
                      </span>
                      <span />
                    </div>

                    {/* Set rows */}
                    <div className="space-y-1.5">
                      {sortedSets.map((s) => (
                        <SetRow
                          key={s.id}
                          setNumber={s.set_number}
                          initialWeight={s.weight}
                          initialReps={s.reps}
                          initialRest={s.rest_seconds}
                          isLogged={s.reps > 0}
                          onLog={(reps, weight, restSeconds) =>
                            handleLogSet(se.id, s.set_number, reps, weight, restSeconds)
                          }
                        />
                      ))}
                    </div>

                    {/* Add set */}
                    <button
                      onClick={() => handleAddSet(se.id, sortedSets.length)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" /> {t('session.addSet')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Add exercise button */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <Button
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="w-full border-dashed border-border/50 text-muted-foreground hover:border-warm/30 hover:text-warm"
        >
          <Plus className="mr-1 h-4 w-4" /> {t('session.addExercise')}
        </Button>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('session.addExercise')}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('session.searchExercises')}
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={pickerMuscle} onValueChange={(v) => v && setPickerMuscle(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {t(MUSCLE_GROUP_KEYS[g])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-0.5">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleAddExercise(exercise)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div>
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.muscle_group}</p>
                  </div>
                  <Plus className="h-4 w-4 text-warm" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Complete workout */}
      <Button
        onClick={handleComplete}
        disabled={completing}
        className="w-full bg-warm text-warm-foreground hover:bg-warm/90"
      >
        {completing ? t('session.finishing') : (
          <>
            <Check className="mr-1 h-4 w-4" /> {t('session.finishWorkout')}
          </>
        )}
      </Button>
    </div>
  )
}

// --- SetRow component ---

function SetRow({
  setNumber,
  initialWeight,
  initialReps,
  initialRest,
  isLogged,
  onLog,
}: {
  setNumber: number
  initialWeight: number
  initialReps: number
  initialRest: number
  isLogged: boolean
  onLog: (reps: number, weight: number, restSeconds: number) => void
}) {
  const { t } = useTranslation()
  const [weight, setWeight] = useState(initialWeight.toString())
  const [reps, setReps] = useState(initialReps.toString())
  const [rest, setRest] = useState(initialRest > 0 ? initialRest.toString() : '')
  const [saved, setSaved] = useState(isLogged)

  const handleSave = () => {
    const r = parseInt(reps) || 0
    const w = parseFloat(weight) || 0
    const rs = parseInt(rest) || 0
    if (r <= 0) return
    onLog(r, w, rs)
    setSaved(true)
  }

  return (
    <div
      className={`grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] items-center gap-2 rounded-lg px-1 py-1 ${
        saved ? 'bg-warm/5' : ''
      }`}
    >
      <span
        className={`text-center text-sm font-medium ${
          saved ? 'text-warm' : 'text-muted-foreground'
        }`}
      >
        {setNumber}
      </span>
      <Input
        type="number"
        min={0}
        step={0.5}
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value)
          setSaved(false)
        }}
        placeholder={t('kg')}
        className="h-8 text-center text-sm"
      />
      <Input
        type="number"
        min={0}
        value={reps}
        onChange={(e) => {
          setReps(e.target.value)
          setSaved(false)
        }}
        placeholder="0"
        className="h-8 text-center text-sm"
      />
      <Input
        type="number"
        min={0}
        value={rest}
        onChange={(e) => {
          setRest(e.target.value)
          setSaved(false)
        }}
        placeholder={t('sec')}
        className="h-8 text-center text-sm"
      />
      <button
        onClick={handleSave}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          saved
            ? 'bg-warm/15 text-warm'
            : 'bg-secondary text-muted-foreground hover:bg-warm/15 hover:text-warm'
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
