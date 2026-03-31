import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  fetchRoutine,
  createRoutine,
  updateRoutine,
  type RoutineExerciseIn,
} from '@/api/routines'
import { useTranslation } from '@/lib/i18n'
import { Plus, ChevronUp, ChevronDown, Trash2, ArrowLeft, Search } from 'lucide-react'

interface RoutineBuilderProps {
  routineId?: string | null
  onBack: () => void
}

interface RoutineExerciseRow {
  exercise_id: string
  exercise_name: string
  target_sets: number
  target_reps: number
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

export default function RoutineBuilder({ routineId, onBack }: RoutineBuilderProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [rows, setRows] = useState<RoutineExerciseRow[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerMuscle, setPickerMuscle] = useState('all')
  const [isTemplate, setIsTemplate] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const exerciseList = await fetchExercises()
        setExercises(exerciseList)

        if (routineId) {
          const routine = await fetchRoutine(routineId)
          setName(routine.name)
          setIsTemplate(routine.is_template)
          const nameMap: Record<string, string> = {}
          for (const e of exerciseList) nameMap[e.id] = e.name
          setRows(
            [...routine.routine_exercises]
              .sort((a, b) => a.order - b.order)
              .map((re) => ({
                exercise_id: re.exercise_id,
                exercise_name: nameMap[re.exercise_id] || t('session.unknown'),
                target_sets: re.target_sets,
                target_reps: re.target_reps,
              }))
          )
        }
      } catch (err) {
        console.error('Failed to load', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [routineId])

  const addExercise = (exercise: Exercise) => {
    setRows((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        target_sets: 3,
        target_reps: 10,
      },
    ])
    setPickerOpen(false)
    setPickerSearch('')
    setPickerMuscle('all')
  }

  const removeExercise = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= rows.length) return
    setRows((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next
    })
  }

  const updateRow = (index: number, field: 'target_sets' | 'target_reps', value: number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const handleSave = async () => {
    if (!name.trim() || rows.length === 0) return
    setSaving(true)
    try {
      const exerciseData: RoutineExerciseIn[] = rows.map((row, i) => ({
        exercise_id: row.exercise_id,
        order: i,
        target_sets: row.target_sets,
        target_reps: row.target_reps,
      }))

      if (routineId && !isTemplate) {
        await updateRoutine(routineId, { name, exercises: exerciseData })
      } else {
        await createRoutine({ name: isTemplate ? `${name} (Copy)` : name, exercises: exerciseData })
      }
      onBack()
    } catch (err) {
      console.error('Failed to save routine', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredExercises = exercises.filter((e) => {
    if (pickerMuscle !== 'all' && e.muscle_group !== pickerMuscle) return false
    if (pickerSearch && !e.name.toLowerCase().includes(pickerSearch.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-pulse rounded-full bg-warm/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          {routineId ? (isTemplate ? t('builder.useTemplate') : t('builder.editRoutine')) : t('builder.newRoutine')}
        </h2>
      </div>

      {/* Routine Name */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('builder.routineName')}
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('builder.namePlaceholder')}
          className="text-base"
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('builder.exercisesCount')} ({rows.length})
          </Label>
          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="border-warm/30 text-warm hover:bg-warm/10 hover:text-warm"
            >
              <Plus className="mr-1 h-4 w-4" /> {t('add')}
            </Button>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('builder.addExercise')}</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('builder.searchExercises')}
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
                      onClick={() => addExercise(exercise)}
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
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 py-12 text-muted-foreground">
            <p className="text-sm">{t('builder.addExercisesPrompt')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={`${row.exercise_id}-${index}`}
                className="group rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-border"
              >
                <div className="flex items-center gap-3">
                  {/* Order controls */}
                  <div className="flex shrink-0 flex-col gap-px">
                    <button
                      onClick={() => moveExercise(index, -1)}
                      disabled={index === 0}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveExercise(index, 1)}
                      disabled={index === rows.length - 1}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Exercise info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-warm/60">
                        {index + 1}.
                      </span>
                      <p className="text-sm font-medium">{row.exercise_name}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('builder.setsLabel')}</span>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={row.target_sets}
                          onChange={(e) => updateRow(index, 'target_sets', parseInt(e.target.value) || 1)}
                          className="h-7 w-14 text-center text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('builder.repsLabel')}</span>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={row.target_reps}
                          onChange={(e) => updateRow(index, 'target_reps', parseInt(e.target.value) || 1)}
                          className="h-7 w-14 text-center text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={!name.trim() || rows.length === 0 || saving}
        className="w-full bg-warm text-warm-foreground hover:bg-warm/90 disabled:bg-warm/30"
      >
        {saving ? t('builder.saving') : routineId && !isTemplate ? t('builder.updateRoutine') : t('builder.createRoutine')}
      </Button>
    </div>
  )
}
