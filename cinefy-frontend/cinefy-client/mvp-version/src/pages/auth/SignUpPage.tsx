import { Link, useNavigate } from 'react-router'
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { Field, OrDivider, PasswordField, SsoRow } from './auth-parts'

export function SignUpPage() {
  const navigate = useNavigate()

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    navigate('/verify')
  }

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Create an account to book tickets and manage your bookings."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-amber transition-colors hover:text-amber/80">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Full name"
          icon={UserRound}
          type="text"
          placeholder="Alex Vance"
          autoComplete="name"
          required
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          size="lg"
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Create account
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <OrDivider children="or sign up with" />
        <SsoRow />
      </form>
    </AuthLayout>
  )
}
