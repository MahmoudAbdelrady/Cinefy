import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, ArrowUpRight, Check, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import { cn } from '@/lib/utils'
import { seatsByIds, tierLabel } from '@/data/hall'
import { PAYMENT_METHODS, subtypeChip, type PaymentMethod } from '@/data/bookings'
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
  const [savedMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS)
  const [selectedId, setSelectedId] = useState(savedMethods[0]?.id ?? '')
  const [processing, setProcessing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
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

  /* One priced line per seat, so the summary reads back exactly what each
     seat costs — the base showtime price plus its tier surcharge. */
  const seatLines = seatsByIds(seats).map((seat) => ({
    id: seat.id,
    tier: tierLabel[seat.tier],
    priceCents: showtime.priceCents + seat.surchargeCents,
  }))
  const seatsSubtotal = seatLines.reduce((sum, line) => sum + line.priceCents, 0)
  const fees = seats.length * FEE_CENTS
  const total = seatsSubtotal + fees

  const selected = savedMethods.find((m) => m.id === selectedId)
  const expired = secondsLeft <= 0
  const busy = processing || redirecting || expired

  const completeBooking = () => {
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

  const payWithSaved = () => {
    if (!selected) return
    setProcessing(true)
    completeBooking()
  }

  /* The real flow asks the backend for a redirect URL and sends the
     browser to the provider's page. The mock stands in for the hop. */
  const payWithNewCard = () => {
    setRedirecting(true)
    setTimeout(completeBooking, 900)
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
        <Link to={`/movies/${movie.id}`}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
          <span className="tabular-nums font-medium">
            {expired ? 'Hold expired' : formatCountdown(secondsLeft)}
          </span>
        </div>
      </header>

      <div className="reveal overflow-hidden rounded-2xl border border-border/50 bg-card">
        {/* what you're buying */}
        <div className="flex gap-4 p-5">
          <Poster movie={movie} className="aspect-2/3 w-16 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-semibold leading-tight">{movie.title}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {showtime.hall} · {showtime.format} · {formatRuntime(movie.durationMins)}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatLongDate(showtime.date)} · {showtime.time}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 text-sm">
          <p className="mb-2 font-semibold">
            Seats <span className="font-normal text-muted-foreground">({seats.length})</span>
          </p>

          <dl>
            <div className="scrollbar-thin max-h-40 space-y-2 overflow-y-auto">
              {seatLines.map((line) => (
                <div key={line.id} className="flex items-baseline justify-between gap-3 pr-1">
                  <dt className="min-w-0">
                    <span className="font-mono">{line.id}</span>{' '}
                    <span className="text-muted-foreground">({line.tier})</span>
                  </dt>
                  <dd className="shrink-0 font-mono">{formatPrice(line.priceCents)}</dd>
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-2 border-t border-border/50 pt-2">
              <Row label="Booking fee" value={formatPrice(fees)} />
              <div className="flex items-baseline justify-between pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd className="font-mono text-amber">{formatPrice(total)}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="ticket-tear">
          <span className="ticket-tear-rule" />
        </div>

        {/* how you'll pay */}
        <div className="p-5">
          {savedMethods.length > 0 ? (
            <SavedCardFork
              methods={savedMethods}
              selectedId={selectedId}
              onSelect={setSelectedId}
              selected={selected}
              total={total}
              busy={busy}
              processing={processing}
              redirecting={redirecting}
              onPaySaved={payWithSaved}
              onPayNew={payWithNewCard}
            />
          ) : (
            <FirstCard
              total={total}
              busy={busy}
              redirecting={redirecting}
              onPayNew={payWithNewCard}
            />
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 w-full gap-2 text-muted-foreground hover:text-destructive"
        disabled={processing || redirecting}
        onClick={() => setConfirmingCancel(true)}
      >
        <X className="size-4" />
        Cancel booking
      </Button>

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
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * The returning customer: pick a saved card and pay here, or leave for the
 * provider's page. Filled amber means "completes here"; the outline button
 * with the corner arrow means "you're leaving the site".
 */
function SavedCardFork({
  methods,
  selectedId,
  onSelect,
  selected,
  total,
  busy,
  processing,
  redirecting,
  onPaySaved,
  onPayNew,
}: {
  methods: PaymentMethod[]
  selectedId: string
  onSelect: (id: string) => void
  selected: PaymentMethod | undefined
  total: number
  busy: boolean
  processing: boolean
  redirecting: boolean
  onPaySaved: () => void
  onPayNew: () => void
}) {
  return (
    <>
      <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Pay with a saved card
      </h2>

      <div className="space-y-2" role="radiogroup">
        {methods.map((method) => (
          <SavedCardOption
            key={method.id}
            method={method}
            checked={method.id === selectedId}
            onSelect={() => onSelect(method.id)}
          />
        ))}
      </div>

      <Button
        size="lg"
        className="mt-4 w-full bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        disabled={busy || !selected}
        onClick={onPaySaved}
      >
        {processing ? 'Paying…' : `Pay ${formatPrice(total)}`}
      </Button>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border/60" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      <Button
        size="lg"
        variant="outline"
        className="w-full justify-between border-amber/30 text-foreground hover:border-amber/50 hover:bg-amber/5"
        disabled={busy}
        onClick={onPayNew}
      >
        {redirecting ? 'Opening secure page…' : 'Pay with another card'}
        <ArrowUpRight className="size-4 text-amber" />
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Opens your bank's secure page. Your seats stay held while you pay.
      </p>
    </>
  )
}

/**
 * No saved cards: there is no fork, so the redirect stops being the
 * secondary option and becomes the only — and primary — action.
 */
function FirstCard({
  total,
  busy,
  redirecting,
  onPayNew,
}: {
  total: number
  busy: boolean
  redirecting: boolean
  onPayNew: () => void
}) {
  return (
    <>
      <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Payment
      </h2>

      <Button
        size="lg"
        className="w-full justify-between bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
        disabled={busy}
        onClick={onPayNew}
      >
        {redirecting ? 'Opening secure page…' : `Pay ${formatPrice(total)}`}
        <ArrowUpRight className="size-4" />
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Opens your bank's secure page. Your seats stay held while you pay.
      </p>
    </>
  )
}

/**
 * The mask is dimmed and the last four sit at full weight — those are the
 * digits a person actually recognizes their own card by.
 */
function SavedCardOption({
  method,
  checked,
  onSelect,
}: {
  method: PaymentMethod
  checked: boolean
  onSelect: () => void
}) {
  const groups = method.masked_pan.split('-')
  const last = groups.length - 1

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
        checked
          ? 'border-amber/60 bg-amber/5'
          : 'border-border/50 hover:border-border hover:bg-secondary/30',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-card',
      )}
    >
      <input
        type="radio"
        name="saved-card"
        className="sr-only"
        checked={checked}
        onChange={onSelect}
      />

      <span className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-secondary font-mono text-[10px] font-semibold tracking-wider">
        {subtypeChip(method.card_subtype)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-mono text-sm tracking-[0.12em]">
          {groups.map((group, i) => (
            <span key={i} className={i === last ? 'text-foreground' : 'text-muted-foreground/50'}>
              {i === last ? group : '••••'}{' '}
            </span>
          ))}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{method.card_subtype}</span>
      </span>

      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
          checked ? 'border-amber bg-amber text-primary-foreground' : 'border-border',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </label>
  )
}

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
