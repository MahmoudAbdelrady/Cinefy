import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Check,
  Clock,
  CreditCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Ticket,
  UserRound,
} from 'lucide-react'
import { PasswordField, Requirement } from '@/pages/auth/auth-parts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import {
  bookingTotalCents,
  PAYMENT_METHODS,
  subtypeChip,
  type Booking,
  type PaymentMethod,
} from '@/data/bookings'
import { formatPrice, getMovie } from '@/data/movies'

const USER = {
  name: 'Alex Vance',
  email: 'alex.vance@example.com',
  phone: '+1 415 555 0148',
  initials: 'AV',
}

export function ProfilePage() {
  const { active, completed } = useBookings()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="reveal mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-amber to-amber/50 text-3xl font-bold text-primary-foreground">
          {USER.initials}
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{USER.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Member · {active.length + completed.length} bookings
          </p>
        </div>
      </header>

      <Tabs
        defaultValue="account"
        orientation="vertical"
        className="reveal flex-col gap-6 sm:flex-row sm:gap-8"
        style={{ animationDelay: '90ms' }}
      >
        <TabsList className="h-fit w-full shrink-0 flex-col gap-1 rounded-xl border border-border/50 bg-card p-2 sm:w-52">
          <TabsTrigger value="account" className="justify-start px-3 py-2">
            <UserRound className="size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="justify-start px-3 py-2">
            <CreditCard className="size-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="history" className="justify-start px-3 py-2">
            <Ticket className="size-4" />
            Bookings
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="account" className="mt-0">
            <AccountPanel />
          </TabsContent>
          <TabsContent value="billing" className="mt-0">
            <BillingPanel />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <HistoryPanel active={active} completed={completed} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function AccountPanel() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Personal details</h2>
            <p className="text-sm text-muted-foreground">
              The contact details tied to your bookings.
            </p>
          </div>
          <Button variant="outline" className="shrink-0">
            Edit profile
          </Button>
        </div>

        {/* single container holding all account info rows */}
        <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/50 bg-card">
          <InfoRow icon={UserRound} label="Full name" value={USER.name} />
          <InfoRow icon={Mail} label="Email" value={USER.email} />
          <InfoRow icon={Phone} label="Phone" value={USER.phone} />
        </div>
      </section>

      <PasswordPanel />
    </div>
  )
}

function PasswordPanel() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

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
  const canSubmit = current.length > 0 && allMet && matches

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setCurrent('')
    setPassword('')
    setConfirm('')
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Password</h2>
        <p className="text-sm text-muted-foreground">
          Choose a strong password you haven't used before.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-xl border border-border/50 bg-card p-4 sm:p-6"
      >
        <PasswordField
          label="Current password"
          icon={Lock}
          placeholder="Enter your current password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />

        <PasswordField
          label="New password"
          icon={KeyRound}
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <ul className="grid gap-x-4 gap-y-2 rounded-xl border border-border/50 bg-card/50 p-4 sm:grid-cols-2">
          <Requirement met={checks.length}>At least 8 characters</Requirement>
          <Requirement met={checks.lowercase}>One lowercase letter</Requirement>
          <Requirement met={checks.uppercase}>One uppercase letter</Requirement>
          <Requirement met={checks.number}>One number</Requirement>
          <Requirement met={checks.symbol}>One special character</Requirement>
        </ul>

        <PasswordField
          label="Confirm new password"
          icon={Lock}
          placeholder="Re-enter your new password"
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
          disabled={!canSubmit}
          className="bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        >
          Update password
        </Button>
      </form>
    </section>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-amber">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  )
}

function BillingPanel() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {PAYMENT_METHODS.map((pm) => (
          <PaymentMethodRow key={pm.id} method={pm} />
        ))}
      </div>
      <Button variant="outline" className="gap-2">
        <Plus className="size-4" />
        Add payment method
      </Button>
    </div>
  )
}

function PaymentMethodRow({ method }: { method: PaymentMethod }) {
  const groups = method.masked_pan.split('-')
  const last = groups.length - 1

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
      <span className="grid h-10 w-14 shrink-0 place-items-center rounded-md bg-secondary font-mono text-xs font-semibold">
        {subtypeChip(method.card_subtype)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm tracking-[0.12em]">
          {groups.map((group, i) => (
            <span key={i} className={i === last ? 'text-foreground' : 'text-muted-foreground/50'}>
              {i === last ? group : '••••'}{' '}
            </span>
          ))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{method.card_subtype}</p>
      </div>
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
        Remove
      </Button>
    </div>
  )
}

function HistoryPanel({
  active,
  completed,
}: {
  active: Booking[]
  completed: Booking[]
}) {
  if (active.length + completed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card py-16 text-center">
        <Ticket className="size-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <Group title="In progress">
          {active.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </Group>
      )}
      {completed.length > 0 && (
        <Group title="Past bookings">
          {completed.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </Group>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const navigate = useNavigate()
  const movie = getMovie(booking.movieId)
  const isActive = booking.status === 'active'

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border/50 bg-card">
      {movie && <Poster movie={movie} className="w-16 shrink-0" />}
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{booking.movieTitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {booking.date} · {booking.time}
            </span>
            <span>{booking.hall} · {booking.format}</span>
            <span className="text-amber">{booking.seats.join(' · ')}</span>
          </div>
        </div>

        <span className="font-mono text-sm font-semibold">
          {formatPrice(bookingTotalCents(booking))}
        </span>

        {isActive ? (
          <Button
            size="sm"
            onClick={() => navigate('/checkout', { state: { resumeBookingId: booking.id } })}
            className="bg-amber text-primary-foreground hover:bg-amber/90"
          >
            Complete
          </Button>
        ) : (
          <Badge variant="secondary" className="bg-secondary text-muted-foreground">
            Booked
          </Badge>
        )}
      </div>
    </div>
  )
}
