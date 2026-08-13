import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { cn } from '@/lib/utils'

/**
 * OAuth2 redirect target — the URL a provider (Google, Apple, …) sends the user
 * back to after they approve. It carries no form and takes no input: it reads
 * the provider's query params, hands them to the backend for validation, and
 * waits. The backend owns the code-for-token exchange; this screen owns only
 * the waiting and the two exits (into the app, or back to /login).
 *
 * Static preview: there is no backend in the mock, so the exchange is faked on
 * a timer. Land on /auth/callback with no params to watch the happy path, or
 * add ?error=access_denied (any provider error) to see the failure state.
 */

type Phase = 'verifying' | 'success' | 'failed'

/** Provider slug → display name, for the "Continuing with …" line. */
const PROVIDERS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
}

/** Mocked exchange duration, and the pause on the success tick before leaving. */
const EXCHANGE_MS = 2200
const HANDOFF_MS = 900

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const code = params.get('code')
  const state = params.get('state')
  const providerError = params.get('error')
  const provider = PROVIDERS[params.get('provider') ?? ''] ?? 'your provider'
  /** where the user was headed before they were bounced to the provider */
  const returnTo = params.get('redirect') ?? '/'

  const [phase, setPhase] = useState<Phase>('verifying')

  /* The params are read once, on mount — a provider redirect is a one-shot
     event, and re-running the exchange on a re-render would double-spend the
     authorization code. Kept in a ref so the effect can stay dependency-free. */
  const request = useRef({ code, state, providerError })

  useEffect(() => {
    const { code, providerError } = request.current

    if (providerError) {
      setPhase('failed')
      return
    }

    // In the real app: POST { code, state } to the backend, which validates the
    // state, exchanges the code, sets the session cookie, and returns the user.
    const id = setTimeout(() => setPhase(code === 'fail' ? 'failed' : 'success'), EXCHANGE_MS)

    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (phase !== 'success') return
    const id = setTimeout(() => navigate(returnTo, { replace: true }), HANDOFF_MS)
    return () => clearTimeout(id)
  }, [phase, navigate, returnTo])

  if (phase === 'failed') {
    return (
      <AuthLayout
        icon={
          <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/25">
            <TriangleAlert className="size-6 text-destructive" />
          </span>
        }
        heading="Sign-in failed"
        subheading="We couldn't complete your sign-in. Please try again."
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
        <Button
          asChild
          size="lg"
          className="group w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          <Link to="/login">
            Try again
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </AuthLayout>
    )
  }

  const done = phase === 'success'

  return (
    <AuthLayout
      icon={
        <span
          className={cn(
            'grid size-14 place-items-center rounded-2xl ring-1 transition-colors duration-300',
            done ? 'bg-amber/15 ring-amber/30' : 'bg-secondary/60 ring-border',
          )}
        >
          {done ? (
            <Check className="size-6 text-amber" strokeWidth={2.5} />
          ) : (
            <Loader2 className="size-6 animate-spin text-amber" />
          )}
        </span>
      }
      heading={done ? "You're signed in" : 'Signing you in'}
      subheading={
        done
          ? 'Taking you back to where you left off.'
          : `Continuing with ${provider} — hold on while we verify this sign-in.`
      }
    >
      <div className="space-y-6">
        <ProgressTrack done={done} />

        <p className="flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Verified by Cinefy
        </p>
      </div>
    </AuthLayout>
  )
}

/** Indeterminate amber sweep while waiting; fills solid once the backend answers. */
function ProgressTrack({ done }: { done: boolean }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          'h-full rounded-full bg-amber',
          done ? 'w-full transition-[width] duration-500 ease-out' : 'auth-sweep w-2/5',
        )}
      />
    </div>
  )
}
