import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell, Mail, ArrowLeft } from 'lucide-react'

export default function Login() {
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
      setError('Please enter your email address')
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

  // Sign-up success screen
  if (signUpSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Mail className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to activate your account.
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
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Password reset sent screen
  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
              <Mail className="h-7 w-7 text-warm" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to set a new password.
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
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Forgot password form
  if (forgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
              <Dumbbell className="h-7 w-7 text-warm" />
            </div>
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Reset password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
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
              {loading ? 'Sending...' : 'Send Reset Link'}
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
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm/10 ring-1 ring-warm/20">
            <Dumbbell className="h-7 w-7 text-warm" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Workout Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
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
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="font-medium text-warm transition-colors hover:text-warm/80"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
