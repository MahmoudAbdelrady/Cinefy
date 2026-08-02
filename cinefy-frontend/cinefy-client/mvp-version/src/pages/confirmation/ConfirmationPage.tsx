import { useState } from 'react'
import { Link } from 'react-router'
import {
  CalendarDays,
  Check,
  Clock,
  Home,
  Loader2,
  MapPin,
  RotateCcw,
  Ticket,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QrStub } from '@/components/qr-stub/QrStub'
import { SEED_BOOKINGS, bookingTotalCents } from '@/data/bookings'
import { formatPrice, getMovie } from '@/data/movies'

type PaymentState = 'success' | 'pending' | 'failed'

const HEADINGS: Record<PaymentState, { title: string; note: (seats: number) => string }> = {
  success: {
    title: 'Booking confirmed',
    note: (seats) => `Ticket${seats > 1 ? 's' : ''} confirmed — see you at the show.`,
  },
  pending: {
    title: 'Payment processing',
    note: () => 'Hang tight — we’re waiting for your bank to confirm the charge.',
  },
  failed: {
    title: 'Payment failed',
    note: () => 'Your card was not charged. You can try again with another card.',
  },
}

/* Static preview: the page renders a seed booking and a state switcher so the
   three payment outcomes can be eyeballed without going through checkout. */
export function ConfirmationPage() {
  const [paymentState, setPaymentState] = useState<PaymentState>('success')

  const booking = SEED_BOOKINGS[0]

  if (!booking) return <NoBooking />

  const [from, to] = booking.poster
  const backdrop = getMovie(booking.movieId)?.backdropUrl
  const total = bookingTotalCents(booking)
  const heading = HEADINGS[paymentState]

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12">
      <div className="mb-8 flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
        {(['success', 'pending', 'failed'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPaymentState(option)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              paymentState === option
                ? 'bg-amber text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="reveal mb-6 flex flex-col items-center text-center">
        <StateBadge state={paymentState} />
        <h1 className="text-3xl font-bold tracking-tight">{heading.title}</h1>
        <p className="mt-1 text-muted-foreground">{heading.note(booking.seats.length)}</p>
      </div>

      <div
        className="reveal w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
        style={{ animationDelay: '120ms' }}
      >
        <div
          className="relative flex h-40 items-end p-6 pb-5"
          style={{ background: `linear-gradient(125deg, ${from}, ${to})` }}
        >
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="relative">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Admit {booking.seats.length}
            </p>
            <h2 className="text-3xl font-bold leading-tight text-white drop-shadow">
              {booking.movieTitle}
            </h2>
          </div>
        </div>

        <div className="border-t border-dashed border-border/60" />

        <div className="flex items-center gap-6 p-6">
          <dl className="flex-1 space-y-3 text-sm">
            <Detail icon={CalendarDays} label="Date" value={booking.date} />
            <Detail icon={Clock} label="Time" value={`${booking.time} · ${booking.format}`} />
            <Detail icon={MapPin} label="Hall" value={booking.hall} />
            <Detail icon={Ticket} label="Seats" value={booking.seats.join(' · ')} />
          </dl>

          {paymentState === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <QrStub seed={booking.id} className="w-28" />
              <span className="font-mono text-[11px] text-muted-foreground">
                #{booking.id.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 bg-secondary/30 px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {paymentState === 'success' ? 'Paid' : 'Total'}
          </span>
          <span
            className={`font-mono text-lg font-semibold ${
              paymentState === 'failed' ? 'text-muted-foreground line-through' : 'text-amber'
            }`}
          >
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {paymentState === 'pending' && (
        <p
          className="reveal mt-6 text-center text-sm text-muted-foreground"
          style={{ animationDelay: '160ms' }}
        >
          This page updates on its own — no need to pay again.
        </p>
      )}

      <div className="reveal mt-8 flex gap-3" style={{ animationDelay: '200ms' }}>
        {paymentState === 'failed' ? (
          <>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <Home className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-amber text-primary-foreground hover:bg-amber/90">
              <Link to="/checkout">
                <RotateCcw className="size-4" />
                Try again
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link to="/profile">View my bookings</Link>
            </Button>
            <Button asChild className="gap-2 bg-amber text-primary-foreground hover:bg-amber/90">
              <Link to="/">
                <Home className="size-4" />
                Back to home
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: PaymentState }) {
  if (state === 'pending') {
    return (
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-secondary text-muted-foreground ring-4 ring-border/40">
        <Loader2 className="size-8 animate-spin" strokeWidth={2.5} />
      </span>
    )
  }

  if (state === 'failed') {
    return (
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-destructive/15 text-destructive ring-4 ring-destructive/10">
        <X className="size-8" strokeWidth={3} />
      </span>
    )
  }

  return (
    <span className="mb-4 grid size-16 place-items-center rounded-full bg-amber/15 text-amber ring-4 ring-amber/10">
      <Check className="size-8" strokeWidth={3} />
    </span>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-1 items-baseline justify-between gap-3">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-mono font-medium">{value}</dd>
      </div>
    </div>
  )
}

function NoBooking() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-4xl font-bold">No ticket here</p>
      <p className="text-muted-foreground">
        This page shows a confirmation right after you book.
      </p>
      <Button asChild className="bg-amber text-primary-foreground hover:bg-amber/90">
        <Link to="/">Browse movies</Link>
      </Button>
    </div>
  )
}
