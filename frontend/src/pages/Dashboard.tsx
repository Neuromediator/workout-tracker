import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchRoutines, type Routine } from '@/api/routines'
import { createSession } from '@/api/sessions'
import { Dumbbell, ClipboardList, ArrowRight, Flame, Play, Zap, Clock, TrendingUp } from 'lucide-react'

interface DashboardProps {
  onNavigate: (page: string) => void
  onStartSession: (sessionId: string) => void
}

export default function Dashboard({ onNavigate, onStartSession }: DashboardProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchRoutines().then(setRoutines).catch(console.error)
  }, [])

  const handleStartAdHoc = async () => {
    setStarting(true)
    try {
      const session = await createSession({})
      onStartSession(session.id)
    } catch (err) {
      console.error('Failed to start session', err)
    } finally {
      setStarting(false)
    }
  }

  const handleStartFromRoutine = async (routineId: string) => {
    setStarting(true)
    try {
      const session = await createSession({ routine_id: routineId })
      setRoutinePickerOpen(false)
      onStartSession(session.id)
    } catch (err) {
      console.error('Failed to start session', err)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t('dashboard.readyToTrain')}
          <Flame className="ml-2 inline-block h-6 w-6 text-warm" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email}
        </p>
      </div>

      {/* Start Workout */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setRoutinePickerOpen(true)}
          disabled={starting}
          className="group relative overflow-hidden rounded-xl border border-warm/20 bg-warm/5 p-6 text-left transition-all hover:border-warm/40 hover:bg-warm/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/15">
              <Play className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.startWorkout')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.pickRoutine')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.chooseRoutine')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        <button
          onClick={handleStartAdHoc}
          disabled={starting}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-left transition-all hover:border-warm/30 hover:bg-card/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
              <Zap className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.quickStart')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.emptySession')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.startEmpty')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onNavigate('exercises')}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-left transition-all hover:border-warm/30 hover:bg-card/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
              <Dumbbell className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.exerciseLibrary')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.browseExercises')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.browseExercisesBtn')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('routines')}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-left transition-all hover:border-warm/30 hover:bg-card/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
              <ClipboardList className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.myRoutines')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.createManageRoutines')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.viewRoutines')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-left transition-all hover:border-warm/30 hover:bg-card/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
              <Clock className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.history')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.viewPastWorkouts')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.viewHistory')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('progress')}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 text-left transition-all hover:border-warm/30 hover:bg-card/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warm/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/10">
              <TrendingUp className="h-5 w-5 text-warm" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{t('dashboard.progress')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.chartsTrends')}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              {t('dashboard.viewProgress')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>

      {/* Routine picker dialog */}
      <Dialog open={routinePickerOpen} onOpenChange={setRoutinePickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.chooseRoutineTitle')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[350px]">
            <div className="space-y-1">
              {routines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('dashboard.noRoutinesYet')}
                </p>
              ) : (
                routines.map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => handleStartFromRoutine(routine.id)}
                    disabled={starting}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{routine.name}</p>
                        {routine.is_template && (
                          <span className="rounded-md bg-warm/10 px-1.5 py-0.5 text-[11px] font-medium text-warm ring-1 ring-inset ring-warm/20">
                            {t('template')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {routine.routine_exercises.length} {t('exercises')}
                      </p>
                    </div>
                    <Play className="h-4 w-4 text-warm" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
