import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { Field } from './auth-parts'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    navigate('/verify')
  }

  return (
    <AuthLayout
      heading="Forgot your password?"
      subheading="No worries — enter your email and we'll send a code to reset it."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          size="lg"
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Send reset code
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>
    </AuthLayout>
  )
}
