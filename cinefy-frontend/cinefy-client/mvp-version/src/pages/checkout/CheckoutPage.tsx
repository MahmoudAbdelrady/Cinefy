import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, Clock, CreditCard, Lock, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import { cn } from '@/lib/utils'
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
const HOLD_SECONDS = 10 * 60

export function CheckoutPage() {
  const { state } = useLocation() as { state: CheckoutState | null }
  const navigate = useNavigate()
  const { bookings, addBooking } = useBookings()
  const [processing, setProcessing] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS)

  useEffect(() => {
    if (cancelled || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft, cancelled])

  const resume = state?.resumeBookingId
    ? bookings.find((b) => b.id === state.resumeBookingId)
    : undefined

  const movie = getMovie(resume?.movieId ?? state?.movieId)
  const showtime = resume
    ? movie?.showtimes.find((s) => s.id === resume.showtimeId)
    : getShowtime(movie, state?.showtimeId ?? null)
  const seats = resume?.seats ?? state?.seats ?? []

  if (!movie || !showtime || seats.length === 0) return <NoOrder />
  if (cancelled) return <Cancelled movieId={movie.id} />

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

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

        <div
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm',
            secondsLeft <= 60
              ? 'border-destructive/60 bg-destructive/10 text-destructive'
              : 'border-border/50 bg-card text-foreground',
          )}
        >
          <Clock className="size-4" />
          <span className="tabular-nums font-medium">{formatCountdown(secondsLeft)}</span>
        </div>
      </div>

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

            <div className="space-y-2 p-5 pt-0">
              <Button
                size="lg"
                className="w-full gap-2 bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
                disabled={processing}
                onClick={pay}
              >
                <Lock className="size-4" />
                Pay {formatPrice(total)}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
                disabled={processing}
                onClick={() => setConfirmingCancel(true)}
              >
                <X className="size-4" />
                Cancel Booking
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
        <DialogContent className="border-border/50 bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              Your held seats will be released and you'll lose your place in the queue. This can't be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
              Keep booking
            </Button>
            <Button
              className="gap-2 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirmingCancel(false)
                setCancelled(true)
              }}
            >
              <X className="size-4" />
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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

function Cancelled({ movieId }: { movieId: string }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12">
      <div className="reveal flex flex-col items-center text-center">
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-destructive/15 text-destructive ring-4 ring-destructive/10">
          <X className="size-8" strokeWidth={3} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Booking cancelled</h1>
        <p className="mt-1 text-muted-foreground">
          Your booking has been cancelled and your seats have been released.
        </p>
      </div>

      <div className="reveal mt-8 flex gap-3" style={{ animationDelay: '120ms' }}>
        <Button asChild variant="outline">
          <Link to={`/movies/${movieId}`}>Back to movie</Link>
        </Button>
        <Button asChild className="bg-amber text-primary-foreground hover:bg-amber/90">
          <Link to="/">Browse movies</Link>
        </Button>
      </div>
    </div>
  )
}
