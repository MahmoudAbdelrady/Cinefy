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
  Ticket,
  Trash2,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { Field, PasswordField, Requirement } from '@/pages/auth/auth-parts'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
}

export function ProfilePage() {
  const { active, completed } = useBookings()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Tabs
        defaultValue="account"
        orientation="vertical"
        className="reveal flex-col gap-6 sm:flex-row sm:gap-8"
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
      <PersonalDetailsPanel />
      <PasswordPanel />
    </div>
  )
}

function PersonalDetailsPanel() {
  const [editing, setEditing] = useState(false)
  const [details, setDetails] = useState({ name: USER.name, phone: USER.phone })
  const [name, setName] = useState(details.name)
  const [phone, setPhone] = useState(details.phone)

  const dirty = name.trim() !== details.name || phone.trim() !== details.phone
  const canSave = name.trim().length > 0 && phone.trim().length > 0 && dirty

  const save = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSave) return
    setDetails({ name: name.trim(), phone: phone.trim() })
    setEditing(false)
  }

  const cancel = () => {
    setName(details.name)
    setPhone(details.phone)
    setEditing(false)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Personal details</h2>
          <p className="text-sm text-muted-foreground">
            The contact details tied to your bookings.
          </p>
        </div>
        {!editing && (
          <Button variant="outline" className="shrink-0" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-5 rounded-xl border border-border/50 bg-card p-4 sm:p-6">
          <Field
            label="Full name"
            icon={UserRound}
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Field
            label="Phone"
            icon={Phone}
            type="tel"
            placeholder="Your phone number"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              className="bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
            >
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        /* single container holding all account info rows */
        <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/50 bg-card">
          <InfoRow icon={UserRound} label="Full name" value={details.name} />
          <InfoRow icon={Mail} label="Email" value={USER.email} />
          <InfoRow icon={Phone} label="Phone" value={details.phone} />
        </div>
      )}
    </section>
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

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
          >
            Update password
          </Button>
        </div>
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
    <div className="space-y-3">
      {PAYMENT_METHODS.map((pm) => (
        <PaymentMethodRow key={pm.id} method={pm} />
      ))}
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
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <TriangleAlert className="size-6" />
            </span>
            <DialogTitle>Remove this card?</DialogTitle>
            <DialogDescription>
              {method.card_subtype} ending in {groups[last]} will be removed from your account. You
              can save it again the next time you pay.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="size-4" />
                Remove card
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
