import { useNavigate } from 'react-router'
import { ArrowRight, Clock, MapPin, Ticket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Poster } from '@/components/poster/Poster'
import { useBookings } from '@/app/BookingsProvider'
import { bookingTotalCents, type Booking } from '@/data/bookings'
import { formatPrice, getMovie } from '@/data/movies'

export function MyTicketsOverlay() {
  const { active, ticketsOpen, setTicketsOpen } = useBookings()

  return (
    <Dialog open={ticketsOpen} onOpenChange={setTicketsOpen}>
      <DialogContent
        showCloseButton
        className="max-h-[85vh] gap-0 overflow-hidden border-border/50 bg-popover p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b border-border/40 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Ticket className="size-5 text-amber" />
            My Tickets
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {active.length
              ? `${active.length} booking${active.length > 1 ? 's' : ''} to complete`
              : 'No bookings in progress'}
          </p>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {active.length === 0 ? (
            <EmptyTickets />
          ) : (
            active.map((b) => <ActiveTicketRow key={b.id} booking={b} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActiveTicketRow({ booking }: { booking: Booking }) {
  const navigate = useNavigate()
  const { setTicketsOpen } = useBookings()
  const movie = getMovie(booking.movieId)

  const proceed = () => {
    setTicketsOpen(false)
    navigate('/checkout', { state: { resumeBookingId: booking.id } })
  }

  return (
    <div className="flex overflow-hidden rounded-xl border border-border/50 bg-card">
      {movie && <Poster movie={movie} className="w-16 shrink-0" />}

      <div className="flex flex-1 items-center gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate font-semibold leading-tight">{booking.movieTitle}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="size-3" />
              {booking.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {booking.hall} · {booking.format}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs font-medium text-amber">
              {booking.seats.join(' · ')}
            </span>
            <span className="font-mono text-xs font-semibold">
              {formatPrice(bookingTotalCents(booking))}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={proceed}
          className="shrink-0 gap-1 bg-amber text-primary-foreground hover:bg-amber/90"
        >
          Proceed
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyTickets() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Ticket className="size-10 text-muted-foreground opacity-40" />
      <p className="text-sm text-muted-foreground">
        Bookings you start will wait here until you complete them.
      </p>
    </div>
  )
}
