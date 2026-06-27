import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Clock, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AISLE_AFTER_COLS,
  buildHall,
  tierLabel,
  type Seat,
} from '@/data/hall'
import {
  formatLongDate,
  formatPrice,
  getMovie,
  getShowtime,
} from '@/data/movies'

const FEE_CENTS = 150
const HOLD_SECONDS = 10 * 60

export function SeatSelectionPage() {
  const { movieId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const movie = getMovie(movieId)
  const showtime = getShowtime(movie, params.get('showtime'))
  const hall = useMemo(() => buildHall(), [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (cancelled || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft, cancelled])

  if (!movie || !showtime) return <Missing movieId={movieId} />
  if (cancelled) return <Cancelled movieId={movie.id} />

  const toggle = (seat: Seat) => {
    if (seat.taken) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(seat.id) ? next.delete(seat.id) : next.add(seat.id)
      return next
    })
  }

  const seatById = new Map(hall.flat().map((s) => [s.id, s]))
  const selectedSeats = [...selected]
    .map((id) => seatById.get(id)!)
    .sort((a, b) => a.id.localeCompare(b.id))
  const seatsSubtotal = selectedSeats.reduce(
    (sum, s) => sum + showtime.priceCents + s.surchargeCents,
    0,
  )
  const fees = selectedSeats.length * FEE_CENTS
  const total = seatsSubtotal + fees

  const proceed = () =>
    navigate('/checkout', {
      state: {
        movieId: movie.id,
        showtimeId: showtime.id,
        seats: selectedSeats.map((s) => s.id),
      },
    })

  return (
    <div className="flex min-h-screen flex-col">
      {/* sub-header */}
      <div className="sticky top-16 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/movies/${movie.id}`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold leading-tight">{movie.title}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {formatLongDate(showtime.date)} • {showtime.time} • {showtime.hall} ({showtime.format})
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="size-2 animate-pulse rounded-full bg-amber" />
                Reservation active
              </span>
              <span className="text-xs text-muted-foreground">
                Seats held for a limited time
              </span>
            </div>

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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingCancel(true)}
              className="gap-2 text-muted-foreground hover:border-destructive/60 hover:text-destructive"
            >
              <X className="size-4" />
              <span className="hidden sm:inline">Cancel Booking</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row">
        {/* seat map */}
        <div className="flex flex-1 flex-col items-center">
          {/* screen */}
          <div className="relative mb-16 w-full max-w-3xl">
            <div className="absolute top-0 h-2 w-full bg-gradient-to-r from-transparent via-amber/50 to-transparent blur-sm" />
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-transparent via-amber to-transparent" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Screen
            </div>
          </div>

          {/* grid */}
          <div className="w-full overflow-x-auto pb-8 scrollbar-hide">
            <div className="mx-auto flex min-w-max flex-col gap-3">
              {hall.map((row) => (
                <div key={row[0].row} className="flex items-center justify-center gap-4">
                  <RowLabel label={row[0].row} />
                  <div className="flex gap-2">
                    {row.map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        selected={selected.has(seat.id)}
                        onToggle={() => toggle(seat)}
                        aisle={AISLE_AFTER_COLS.includes(seat.number)}
                      />
                    ))}
                  </div>
                  <RowLabel label={row[0].row} />
                </div>
              ))}
            </div>
          </div>

          <Legend />
        </div>

        {/* summary sidebar */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="sticky top-36 rounded-xl border border-border/50 bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Booking Summary</h3>

            {selectedSeats.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <Info className="size-8 opacity-50" />
                <p className="text-sm">Please select your seats to proceed.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-h-48 space-y-3 overflow-y-auto pr-2">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-amber">{seat.id}</span>
                        <span className="capitalize text-muted-foreground">
                          ({tierLabel[seat.tier]})
                        </span>
                      </div>
                      <span className="font-mono">
                        {formatPrice(showtime.priceCents + seat.surchargeCents)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-border/50 pt-4">
                  <SummaryRow
                    label={`Tickets (${selectedSeats.length})`}
                    value={formatPrice(seatsSubtotal)}
                  />
                  <SummaryRow label="Convenience Fee" value={formatPrice(fees)} />
                  <div className="flex items-center justify-between pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="font-mono">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={proceed}
                  className="w-full bg-amber font-semibold text-primary-foreground hover:bg-amber/90"
                >
                  Proceed to Payment
                </Button>
              </div>
            )}
          </div>
        </div>
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

function SeatButton({
  seat,
  selected,
  onToggle,
  aisle,
}: {
  seat: Seat
  selected: boolean
  onToggle: () => void
  aisle: boolean
}) {
  const tierClass =
    seat.tier === 'premium'
      ? 'bg-seat-recliner/40 border-seat-recliner/60 hover:border-purple-400'
      : 'bg-seat-premium/40 border-seat-premium/60 hover:border-blue-400'

  return (
    <button
      onClick={onToggle}
      disabled={seat.taken}
      title={`${seat.id} · ${tierLabel[seat.tier]}`}
      className={cn(
        'flex size-8 items-center justify-center rounded-t-lg rounded-b-sm border text-[10px] font-medium transition-all duration-200',
        aisle && 'mr-6',
        seat.taken && 'cursor-not-allowed border-zinc-700 bg-zinc-800 opacity-50',
        !seat.taken && !selected && tierClass,
        selected && 'border-amber bg-amber text-primary-foreground',
      )}
    >
      {selected ? seat.number : ''}
    </button>
  )
}

function RowLabel({ label }: { label: string }) {
  return (
    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
      {label}
    </span>
  )
}

function Legend() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-full border border-border/50 bg-card/50 px-6 py-4 text-sm text-muted-foreground">
      <LegendItem className="border-seat-premium/60 bg-seat-premium/40" label="Normal" />
      <LegendItem className="border-seat-recliner/60 bg-seat-recliner/40" label="Premium" />
      <LegendItem className="border-amber bg-amber" label="Selected" />
      <LegendItem className="border-zinc-700 bg-zinc-800 opacity-50" label="Taken" />
    </div>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn('size-4 rounded-t border', className)} />
      {label}
    </span>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

function Missing({ movieId }: { movieId?: string }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-24">
      <p className="text-4xl font-bold">Showtime not found</p>
      <p className="text-muted-foreground">
        Pick a showtime from the movie page to choose seats.
      </p>
      <Button asChild className="bg-amber text-primary-foreground hover:bg-amber/90">
        <Link to={movieId ? `/movies/${movieId}` : '/'}>Back</Link>
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
