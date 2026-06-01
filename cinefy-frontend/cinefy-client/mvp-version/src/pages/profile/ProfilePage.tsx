import { useNavigate } from 'react-router'
import {
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Ticket,
  UserRound,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import {
  bookingTotalCents,
  PAYMENT_METHODS,
  type Booking,
  type PaymentMethod,
} from '@/data/bookings'
import { formatPrice, getMovie } from '@/data/movies'

const USER = {
  name: 'Alex Vance',
  email: 'alex.vance@example.com',
  phone: '+1 415 555 0148',
  city: 'San Francisco',
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

      <Tabs defaultValue="account" className="reveal" style={{ animationDelay: '90ms' }}>
        <TabsList className="mb-6">
          <TabsTrigger value="account">
            <UserRound className="size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="size-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="history">
            <Ticket className="size-4" />
            Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountPanel />
        </TabsContent>
        <TabsContent value="billing">
          <BillingPanel />
        </TabsContent>
        <TabsContent value="history">
          <HistoryPanel active={active} completed={completed} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AccountPanel() {
  return (
    <div className="space-y-4">
      {/* single container holding all account info rows */}
      <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/50 bg-card">
        <InfoRow icon={UserRound} label="Full name" value={USER.name} />
        <InfoRow icon={Mail} label="Email" value={USER.email} />
        <InfoRow icon={Phone} label="Phone" value={USER.phone} />
        <InfoRow icon={MapPin} label="City" value={USER.city} />
      </div>
      <Button variant="outline">Edit profile</Button>
    </div>
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
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
      <span className="grid h-10 w-14 shrink-0 place-items-center rounded-md bg-secondary font-mono text-xs font-semibold">
        {method.brand === 'Mastercard' ? 'MC' : method.brand === 'Amex' ? 'AMEX' : 'VISA'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {method.brand} •••• {method.last4}
        </p>
        <p className="font-mono text-xs text-muted-foreground">Expires {method.expiry}</p>
      </div>
      {method.primary && (
        <Badge className="border-amber/20 bg-amber/10 text-amber hover:bg-amber/20">
          Primary
        </Badge>
      )}
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
        Edit
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
