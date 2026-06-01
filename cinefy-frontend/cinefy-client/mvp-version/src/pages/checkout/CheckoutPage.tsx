import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import { surchargeForSeats } from '@/data/hall'
import {
  formatLongDate,
  formatPrice,
  formatRuntime,
  getMovie,
  getShowtime,
} from '@/data/movies'

interface CheckoutState {
  movieId?: string
  showtimeId?: string
  seats?: string[]
  resumeBookingId?: string
}

const FEE_CENTS = 150

export function CheckoutPage() {
  const { state } = useLocation() as { state: CheckoutState | null }
  const navigate = useNavigate()
  const { bookings, addBooking } = useBookings()
  const [processing, setProcessing] = useState(false)

  const resume = state?.resumeBookingId
    ? bookings.find((b) => b.id === state.resumeBookingId)
    : undefined

  const movie = getMovie(resume?.movieId ?? state?.movieId)
  const showtime = resume
    ? movie?.showtimes.find((s) => s.id === resume.showtimeId)
    : getShowtime(movie, state?.showtimeId ?? null)
  const seats = resume?.seats ?? state?.seats ?? []

  if (!movie || !showtime || seats.length === 0) return <NoOrder />

  const seatsSubtotal =
    seats.length * showtime.priceCents + surchargeForSeats(seats)
  const fees = seats.length * FEE_CENTS
  const total = seatsSubtotal + fees

  const pay = () => {
    setProcessing(true)
    const id = resume?.id ?? `bk-${4000 + bookings.length}`
    const booking = {
      id,
      movieId: movie.id,
      showtimeId: showtime.id,
      movieTitle: movie.title,
      poster: movie.poster,
      time: showtime.time,
      hall: showtime.hall,
      format: showtime.format,
      date: 'Today',
      seats,
      priceCentsEach: showtime.priceCents,
      status: 'completed' as const,
    }
    if (!resume) addBooking(booking)
    navigate('/confirmation', { state: { bookingId: id, booking } })
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
        <Link to={`/movies/${movie.id}`}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* payment form */}
        <section className="reveal">
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 font-semibold">
              <CreditCard className="size-4 text-amber" />
              Payment details
            </h2>

            <div className="space-y-4">
              <Field label="Cardholder name" htmlFor="name">
                <Input id="name" placeholder="Alex Vance" autoComplete="off" />
              </Field>
              <Field label="Card number" htmlFor="card">
                <Input
                  id="card"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className="font-mono"
                  autoComplete="off"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry" htmlFor="exp">
                  <Input id="exp" placeholder="MM / YY" className="font-mono" />
                </Field>
                <Field label="CVC" htmlFor="cvc">
                  <Input id="cvc" placeholder="123" className="font-mono" />
                </Field>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-amber" />
              This is a design mock — no real payment is processed.
            </p>
          </div>
        </section>

        {/* order summary */}
        <aside className="reveal lg:sticky lg:top-20 lg:self-start" style={{ animationDelay: '90ms' }}>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <div className="flex gap-4 p-5">
              <Poster movie={movie} className="aspect-2/3 w-20 shrink-0 rounded-lg" />
              <div className="min-w-0 space-y-1">
                <p className="truncate font-semibold leading-tight">{movie.title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {showtime.hall} · {showtime.format}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatLongDate(showtime.date)} · {showtime.time}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatRuntime(movie.durationMins)}
                </p>
              </div>
            </div>

            <div className="border-t border-border/50" />

            <dl className="space-y-2 p-5 text-sm">
              <Row label={`Seats (${seats.length})`} value={seats.join(' · ')} />
              <Row label="Tickets" value={formatPrice(seatsSubtotal)} />
              <Row label="Booking fee" value={formatPrice(fees)} />
              <div className="my-1 border-t border-border/50" />
              <div className="flex items-center justify-between pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd className="font-mono text-amber">{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="p-5 pt-0">
              <Button
                size="lg"
                className="w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
                disabled={processing}
                onClick={pay}
              >
                <Lock className="size-4" />
                Pay {formatPrice(total)}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="font-mono text-foreground">{value}</dd>
    </div>
  )
}

function NoOrder() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-24">
      <p className="text-4xl font-bold">Nothing to check out</p>
      <p className="text-muted-foreground">
        Pick a movie, a showtime, and some seats first.
      </p>
      <Button asChild className="bg-amber text-primary-foreground hover:bg-amber/90">
        <Link to="/">Browse movies</Link>
      </Button>
    </div>
  )
}
