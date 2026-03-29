import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { fetchRoutines, deleteRoutine, type Routine } from '@/api/routines'
import { fetchExercises, type Exercise } from '@/api/exercises'
import { Plus, Trash2, ClipboardList, ChevronRight } from 'lucide-react'

interface RoutinesProps {
  onEdit: (routineId: string) => void
  onNew: () => void
}

export default function Routines({ onEdit, onNew }: RoutinesProps) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [routineData, exerciseData] = await Promise.all([
        fetchRoutines(),
        fetchExercises(),
      ])
      setRoutines(routineData)
      const map: Record<string, Exercise> = {}
      for (const e of exerciseData) map[e.id] = e
      setExercises(map)
    } catch (err) {
      console.error('Failed to load routines', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteRoutine(id)
      load()
    } catch (err) {
      console.error('Failed to delete routine', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ClipboardList className="h-6 w-6 animate-pulse text-warm" />
      </div>
    )
  }

  const templates = routines.filter((r) => r.is_template)
  const custom = routines.filter((r) => !r.is_template)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">My Routines</h2>
          <p className="text-sm text-muted-foreground">
            {custom.length} custom, {templates.length} templates
          </p>
        </div>
        <Button size="sm" onClick={onNew} className="bg-warm text-warm-foreground hover:bg-warm/90">
          <Plus className="mr-1 h-4 w-4" /> New Routine
        </Button>
      </div>

      {custom.length === 0 && templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-muted-foreground">
          <ClipboardList className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">No routines yet</p>
          <p className="mt-1 text-sm">Create one or use a template below</p>
        </div>
      ) : (
        <>
          {/* Custom routines */}
          {custom.length > 0 && (
            <div className="space-y-2.5">
              {custom.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  exercises={exercises}
                  onEdit={() => onEdit(routine.id)}
                  onDelete={() => handleDelete(routine.id)}
                />
              ))}
            </div>
          )}

          {/* Templates */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Templates
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="space-y-2.5">
                {templates.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    exercises={exercises}
                    onEdit={() => onEdit(routine.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RoutineCard({
  routine,
  exercises,
  onEdit,
  onDelete,
}: {
  routine: Routine
  exercises: Record<string, Exercise>
  onEdit: () => void
  onDelete?: () => void
}) {
  const sorted = [...routine.routine_exercises].sort((a, b) => a.order - b.order)

  return (
    <div className="group rounded-xl border border-border/50 bg-card transition-all hover:border-border hover:bg-card/80">
      <div className="flex items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold">{routine.name}</h3>
            {routine.is_template && (
              <span className="rounded-md bg-warm/10 px-1.5 py-0.5 text-[11px] font-medium text-warm ring-1 ring-inset ring-warm/20">
                Template
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {sorted.slice(0, 4).map((re) => {
              const ex = exercises[re.exercise_id]
              return (
                <span key={re.id} className="text-xs text-muted-foreground">
                  {ex?.name || 'Unknown'}{' '}
                  <span className="text-warm/60">{re.target_sets}x{re.target_reps}</span>
                </span>
              )
            })}
            {sorted.length > 4 && (
              <span className="text-xs text-muted-foreground/50">
                +{sorted.length - 4} more
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onDelete && (
            <button
              className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={onEdit}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
