import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/lib/i18n'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Exercises from '@/pages/Exercises'
import Routines from '@/pages/Routines'
import RoutineBuilder from '@/pages/RoutineBuilder'
import ActiveSession from '@/pages/ActiveSession'
import History from '@/pages/History'
import Progress from '@/pages/Progress'
import AISidebar from '@/features/ai-sidebar/AISidebar'
import { Dumbbell, Home, ClipboardList, LogOut, Clock, TrendingUp } from 'lucide-react'

type Page = 'dashboard' | 'exercises' | 'routines' | 'routine-builder' | 'active-session' | 'history' | 'progress'

export default function App() {
  const { user, loading, signOut, isPasswordRecovery, clearPasswordRecovery } = useAuth()
  const { lang, setLang, t } = useTranslation()
  const [page, setPage] = useState<Page>('dashboard')
  const [editRoutineId, setEditRoutineId] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-6 w-6 animate-pulse text-warm" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (isPasswordRecovery && user) {
    return (
      <ResetPassword
        onDone={() => {
          clearPasswordRecovery()
          window.history.replaceState(null, '', '/')
        }}
      />
    )
  }

  if (!user) return <Login />

  const navigate = (p: string) => setPage(p as Page)

  const startSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
    setPage('active-session')
  }

  const navItems: { page: Page | Page[]; icon: typeof Home; labelKey: string; target: Page }[] = [
    { page: ['dashboard'], icon: Home, labelKey: 'nav.home', target: 'dashboard' },
    { page: ['exercises'], icon: Dumbbell, labelKey: 'nav.exercises', target: 'exercises' },
    { page: ['routines', 'routine-builder'], icon: ClipboardList, labelKey: 'nav.routines', target: 'routines' },
    { page: ['history'], icon: Clock, labelKey: 'nav.history', target: 'history' },
    { page: ['progress'], icon: TrendingUp, labelKey: 'nav.progress', target: 'progress' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header — hide during active session for focus */}
      {page !== 'active-session' && (
        <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <button
              onClick={() => setPage('dashboard')}
              className="flex items-center gap-2.5 transition-colors hover:text-warm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm/10">
                <Dumbbell className="h-4 w-4 text-warm" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">
                {t('app.title')}
              </span>
            </button>

            <nav className="flex items-center gap-0.5">
              {navItems.map(({ page: pages, icon: Icon, labelKey, target }) => {
                const isActive = Array.isArray(pages)
                  ? pages.includes(page)
                  : page === pages
                return (
                  <button
                    key={target}
                    onClick={() => setPage(target)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-warm/10 text-warm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                  </button>
                )
              })}

              <div className="ml-1.5 h-5 w-px bg-border/50" />

              <button
                onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
                className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title={lang === 'en' ? 'Переключить на русский' : 'Switch to English'}
              >
                {lang === 'en' ? 'RU' : 'EN'}
              </button>

              <button
                onClick={signOut}
                className="flex items-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                title={t('nav.signOut')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {page === 'dashboard' && (
          <Dashboard onNavigate={navigate} onStartSession={startSession} />
        )}
        {page === 'exercises' && <Exercises />}
        {page === 'routines' && (
          <Routines
            onEdit={(id) => {
              setEditRoutineId(id)
              setPage('routine-builder')
            }}
            onNew={() => {
              setEditRoutineId(null)
              setPage('routine-builder')
            }}
          />
        )}
        {page === 'routine-builder' && (
          <RoutineBuilder
            routineId={editRoutineId}
            onBack={() => setPage('routines')}
          />
        )}
        {page === 'history' && (
          <History key={refreshKey} onStartSession={startSession} />
        )}
        {page === 'progress' && <Progress key={refreshKey} />}
        {page === 'active-session' && activeSessionId && (
          <ActiveSession
            sessionId={activeSessionId}
            onComplete={() => {
              setActiveSessionId(null)
              setPage('dashboard')
            }}
            onBack={() => {
              setActiveSessionId(null)
              setPage('dashboard')
            }}
          />
        )}
      </main>

      {/* AI Sidebar — available on all pages except active session */}
      {page !== 'active-session' && (
        <AISidebar
          onSessionCreated={startSession}
          onSessionDeleted={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
