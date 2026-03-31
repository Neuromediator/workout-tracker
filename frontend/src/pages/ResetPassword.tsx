import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell, CheckCircle2 } from 'lucide-react'

interface ResetPasswordProps {
  onDone: () => void
}

export default function ResetPassword({ onDone }: ResetPasswordProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError(t('reset.mismatch'))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t('reset.success')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('reset.successMessage')}
            </p>
          </div>
          <Button className="w-full" onClick={onDone}>
            {t('reset.continue')}
          </Button>
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
              {t('reset.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('reset.description')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder={t('reset.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            type="password"
            placeholder={t('reset.confirmPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('reset.updating') : t('reset.update')}
          </Button>
        </form>
      </div>
    </div>
  )
}
