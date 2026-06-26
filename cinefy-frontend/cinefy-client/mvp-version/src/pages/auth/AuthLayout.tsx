import { type ReactNode } from 'react'
import { Link } from 'react-router'
import { Clapperboard } from 'lucide-react'

/**
 * Auth shell shared by every auth screen. A top-left Cinefy header sits above a
 * flex-centered column (stepper, heading, form), over a dark ambient background
 * with a soft breathing amber glow. Same three-band header/content layout the
 * management console uses. Identical at every breakpoint.
 */

interface AuthLayoutProps {
  /** the screen's headline */
  heading: ReactNode
  /** supporting copy under the heading */
  subheading: ReactNode
  /** optional icon shown above the heading; also centers the header block */
  icon?: ReactNode
  /** optional progress stepper shown below the wordmark, above the heading */
  stepper?: ReactNode
  /** the form + actions */
  children?: ReactNode
  /** the footer line under the card (sign-up / back-to-login links, etc.) */
  footer?: ReactNode
}

export function AuthLayout({
  heading,
  subheading,
  icon,
  stepper,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      {/* ── Ambient background ─────────────────────────────────────── */}
      {/* soft radial vignette + a low, breathing amber glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="auth-glow pointer-events-none absolute left-1/2 top-[-12rem] size-[36rem] -translate-x-1/2 rounded-full bg-amber/15 blur-[140px]" />
      <div className="auth-grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light" />

      {/* ── Top-left header ────────────────────────────────────────── */}
      <header className="relative z-10 px-6 py-6 sm:px-10">
        <Link
          to="/"
          className="group flex w-fit items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-amber/15 ring-1 ring-amber/30 transition-colors group-hover:bg-amber/20">
            <Clapperboard className="size-[18px] text-amber" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">Cinefy</span>
        </Link>
      </header>

      {/* ── Centered content ───────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-6">
        <div className="reveal w-full max-w-[26rem]">
          {stepper}

          <header
            className={`mb-8 space-y-2 ${icon ? 'flex flex-col items-center text-center' : ''}`}
          >
            {icon && <div className="mb-4">{icon}</div>}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{heading}</h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {subheading}
            </p>
          </header>

          {children}

          {footer && <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </main>
    </div>
  )
}
