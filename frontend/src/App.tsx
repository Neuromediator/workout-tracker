import { useAuth } from '@/hooks/useAuth'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
