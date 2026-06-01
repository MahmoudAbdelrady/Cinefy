import { Link, useLocation } from 'react-router'
import { CalendarDays, Check, Clock, Home, MapPin, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QrStub } from '@/components/qr-stub/QrStub'
import { type Booking, bookingTotalCents } from '@/data/bookings'
import { formatPrice, getMovie } from '@/data/movies'

export function ConfirmationPage() {
  const { state } = useLocation() as {
    state: { bookingId?: string; booking?: Booking } | null
  }
  const booking = state?.booking

  if (!booking) return <NoBooking />

  const [from, to] = booking.poster
  const backdrop = getMovie(booking.movieId)?.backdropUrl
  const total = bookingTotalCents(booking)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12">
      <div className="reveal mb-6 flex flex-col items-center text-center">
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-amber/15 text-amber ring-4 ring-amber/10">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Booking confirmed</h1>
        <p className="mt-1 text-muted-foreground">
          Ticket{booking.seats.length > 1 ? 's' : ''} confirmed — see you at the show.
        </p>
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

          <div className="flex flex-col items-center gap-2">
            <QrStub seed={booking.id} className="w-28" />
            <span className="font-mono text-[11px] text-muted-foreground">
              #{booking.id.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 bg-secondary/30 px-6 py-4">
          <span className="text-sm text-muted-foreground">Paid</span>
          <span className="font-mono text-lg font-semibold text-amber">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      <div className="reveal mt-8 flex gap-3" style={{ animationDelay: '200ms' }}>
        <Button asChild variant="outline">
          <Link to="/profile">View my bookings</Link>
        </Button>
        <Button asChild className="gap-2 bg-amber text-primary-foreground hover:bg-amber/90">
          <Link to="/">
            <Home className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
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
