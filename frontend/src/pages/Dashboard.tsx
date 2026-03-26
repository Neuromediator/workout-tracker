import { useAuth } from '@/hooks/useAuth'
import { Dumbbell, ClipboardList, ArrowRight, Flame } from 'lucide-react'

interface DashboardProps {
  onNavigate: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Ready to train
          <Flame className="ml-2 inline-block h-6 w-6 text-warm" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email}
        </p>
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
            <h3 className="mt-4 font-heading text-lg font-semibold">Exercise Library</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse, search, and add exercises
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              Browse exercises
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
            <h3 className="mt-4 font-heading text-lg font-semibold">My Routines</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage workout routines
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-warm">
              View routines
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
