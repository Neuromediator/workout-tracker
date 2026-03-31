import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell, Mail, ArrowLeft } from 'lucide-react'

export default function Login() {
  const { t, lang, setLang } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSignUpSuccess(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError(t('login.enterEmail'))
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  const langToggle = (
    <button
      onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
      className="fixed top-4 right-4 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
    >
      {lang === 'en' ? 'RU' : 'EN'}
    </button>
  )

  // Sign-up success screen
  if (signUpSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        {langToggle}
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Mail className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t('login.checkEmail')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('login.confirmationSent')} <span className="font-medium text-foreground">{email}</span>.
              {' '}{t('login.clickToActivate')}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSignUpSuccess(false)
              setIsSignUp(false)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('login.backToSignIn')}
          </Button>
        </div>
      </div>
    )
  }

  // Password reset sent screen
  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        {langToggle}
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
              <Mail className="h-7 w-7 text-warm" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t('login.checkEmail')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('login.resetSent')} <span className="font-medium text-foreground">{email}</span>.
              {' '}{t('login.clickToReset')}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResetSent(false)
              setForgotPassword(false)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('login.backToSignIn')}
          </Button>
        </div>
      </div>
    )
  }

  // Forgot password form
  if (forgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        {langToggle}
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
              <Dumbbell className="h-7 w-7 text-warm" />
            </div>
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {t('login.resetPassword')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('login.resetDescription')}
              </p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-3">
            <Input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('login.sending') : t('login.sendResetLink')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => {
                setForgotPassword(false)
                setError('')
              }}
              className="font-medium text-warm transition-colors hover:text-warm/80"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              {t('login.backToSignIn')}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {langToggle}
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
            <Dumbbell className="h-7 w-7 text-warm" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t('login.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? t('login.createAccount') : t('login.signInContinue')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(true)
                  setError('')
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-warm"
              >
                {t('login.forgotPassword')}
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loading') : isSignUp ? t('login.signUp') : t('login.signIn')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? t('login.alreadyHaveAccount') : t('login.dontHaveAccount')}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="font-medium text-warm transition-colors hover:text-warm/80"
          >
            {isSignUp ? t('login.signIn') : t('login.signUp')}
          </button>
        </p>
      </div>
    </div>
  )
}
