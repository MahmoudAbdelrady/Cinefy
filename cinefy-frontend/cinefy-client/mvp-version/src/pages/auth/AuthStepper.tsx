import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Horizontal progress stepper for the password-reset flow — Verify → New
 * password → Done. Ported from the management app's fp-progress-dots into the
 * client's amber/dark language: a dot (ring when active, check when done) above
 * an uppercase label, joined by connectors that fill as steps complete.
 */

const STEPS = ['Verify', 'New password', 'Done'] as const

interface AuthStepperProps {
  /** zero-based index of the active step */
  current: number
}

export function AuthStepper({ current }: AuthStepperProps) {
  return (
    <div className="mb-8 flex items-start justify-center gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        const lit = i <= current
        return (
          <div key={label} className="contents">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full text-[0px] transition-all duration-200',
                  done && 'bg-amber text-primary-foreground',
                  active && 'bg-amber ring-4 ring-amber/20',
                  !lit && 'bg-secondary',
                )}
              >
                {done && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  'font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200',
                  lit ? 'text-foreground' : 'text-muted-foreground/60',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mt-2.5 h-px w-10 transition-colors duration-200',
                  done ? 'bg-amber' : 'bg-secondary',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
