import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Check, KeyRound, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { AuthStepper } from './AuthStepper'
import { PasswordField, Requirement } from './auth-parts'

export function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  )

  const allMet = Object.values(checks).every(Boolean)
  const matches = confirm.length > 0 && confirm === password
  const canSubmit = allMet && matches

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout
        stepper={<AuthStepper current={2} />}
        icon={
          <span className="auth-glow grid size-16 place-items-center rounded-2xl bg-amber/15 text-amber ring-1 ring-amber/30">
            <Check className="size-8" strokeWidth={2.5} />
          </span>
        }
        heading="Password updated"
        subheading="Your password has been changed. You can now sign in with your new credentials."
      >
        <Button
          asChild
          size="lg"
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          <Link to="/login">
            Continue to sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      stepper={<AuthStepper current={1} />}
      heading="Set a new password"
      subheading="Choose a strong password you haven't used before."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <PasswordField
            label="New password"
            icon={KeyRound}
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border/50 bg-card/50 p-4">
          <Requirement met={checks.length}>At least 8 characters</Requirement>
          <Requirement met={checks.lowercase}>One lowercase letter</Requirement>
          <Requirement met={checks.uppercase}>One uppercase letter</Requirement>
          <Requirement met={checks.number}>One number</Requirement>
          <Requirement met={checks.symbol}>One special character</Requirement>
        </ul>

        <PasswordField
          label="Confirm password"
          icon={Lock}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          hint={
            confirm.length > 0 && !matches ? (
              <span className="text-destructive">Passwords don't match yet.</span>
            ) : matches ? (
              <span className="inline-flex items-center gap-1 text-amber">
                <Check className="size-3.5" /> Passwords match
              </span>
            ) : undefined
          }
        />

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Update password
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>
    </AuthLayout>
  )
}
