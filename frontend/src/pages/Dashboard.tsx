import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Workout Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome! Start a workout or browse your exercise library.
        </p>
      </main>
    </div>
  )
}
