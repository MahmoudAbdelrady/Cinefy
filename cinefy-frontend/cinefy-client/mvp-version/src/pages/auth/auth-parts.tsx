import { type ComponentProps, type ReactNode, useId, useState } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/* Shared form atoms for the auth screens — a labeled field with an optional
   leading icon and a trailing slot, plus a password field that owns its own
   show/hide toggle. Built on the existing shadcn Input/Label primitives so the
   focus-ring, sizing, and theming stay identical to the rest of the app. */

interface FieldProps extends ComponentProps<'input'> {
  label: string
  /** leading glyph rendered inside the field */
  icon?: LucideIcon
  /** optional element pinned to the field's top-right (e.g. "Forgot?") */
  action?: ReactNode
  /** validation / helper line under the field */
  hint?: ReactNode
}

export function Field({ label, icon: Icon, action, hint, className, id, ...props }: FieldProps) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={fieldId}
          className={cn('h-11', Icon && 'pl-9', className)}
          {...props}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface PasswordFieldProps extends Omit<FieldProps, 'type'> {}

export function PasswordField({
  label,
  icon: Icon,
  action,
  hint,
  className,
  id,
  ...props
}: PasswordFieldProps) {
  const generated = useId()
  const fieldId = id ?? generated
  const [shown, setShown] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={fieldId}
          type={shown ? 'text' : 'password'}
          className={cn('h-11 pr-10', Icon && 'pl-9', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Single requirement row used in the change-password checklist. */
export function Requirement({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-xs transition-colors',
        met ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
          met ? 'border-amber bg-amber/15 text-amber' : 'border-border text-transparent',
        )}
      >
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6.5 5 9l4.5-5" />
        </svg>
      </span>
      {children}
    </li>
  )
}

/** "or continue with" divider used between the primary submit and SSO. */
export function OrDivider({ children = 'or continue with' }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

/** A row of outline SSO buttons (Google / Apple) — visual only. */
export function SsoRow() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-input/20 text-sm font-medium text-foreground transition-colors hover:bg-input/40"
      >
        <GoogleGlyph />
        Google
      </button>
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-input/20 text-sm font-medium text-foreground transition-colors hover:bg-input/40"
      >
        <AppleGlyph />
        Apple
      </button>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-.96 2.6-2.05 3.4v2.8h3.3c1.94-1.8 3.05-4.4 3.05-7.6 0-.7-.07-1.4-.18-2z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.6-2.4l-3.3-2.6c-.9.6-2.05.95-3.3.95-2.55 0-4.7-1.7-5.47-4.05H3.13v2.6C4.78 19.98 8.13 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.53 13.9c-.2-.6-.31-1.25-.31-1.9s.11-1.3.31-1.9V7.5H3.13C2.4 8.85 2 10.4 2 12s.4 3.15 1.13 4.5z"
      />
      <path
        fill="#4285F4"
        d="M12 6.05c1.47 0 2.78.5 3.82 1.5l2.85-2.85C16.96 3.05 14.7 2 12 2 8.13 2 4.78 4.02 3.13 7.5l3.4 2.6C7.3 7.75 9.45 6.05 12 6.05z"
      />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M16.37 12.78c.02 2.3 2.02 3.06 2.04 3.07-.02.05-.32 1.1-1.05 2.18-.63.93-1.29 1.86-2.32 1.88-1.01.02-1.34-.6-2.5-.6s-1.52.58-2.48.62c-1 .04-1.76-1-2.4-1.93-1.3-1.9-2.3-5.36-.96-7.7.66-1.16 1.85-1.9 3.14-1.92.98-.02 1.9.66 2.5.66.6 0 1.72-.82 2.9-.7.5.02 1.9.2 2.78 1.5-.07.05-1.66.98-1.64 2.93zM14.6 5.6c.53-.65.9-1.55.8-2.45-.77.03-1.7.5-2.26 1.15-.5.57-.94 1.5-.82 2.38.86.06 1.74-.43 2.28-1.08z" />
    </svg>
  )
}
