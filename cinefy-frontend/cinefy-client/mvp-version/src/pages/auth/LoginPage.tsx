import { Link, useNavigate } from 'react-router'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { Field, OrDivider, PasswordField, SsoRow } from './auth-parts'

export function LoginPage() {
  const navigate = useNavigate()

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <AuthLayout
      heading="Sign in to Cinefy"
      subheading="Sign in to access your bookings and book tickets."
      footer={
        <>
          New to Cinefy?{' '}
          <Link to="/signup" className="font-medium text-amber transition-colors hover:text-amber/80">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <PasswordField
          label="Password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="current-password"
          action={
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-amber transition-colors hover:text-amber/80"
            >
              Forgot?
            </Link>
          }
        />

        <Button
          type="submit"
          size="lg"
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Sign in
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <OrDivider />
        <SsoRow />
      </form>
    </AuthLayout>
  )
}
