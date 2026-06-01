import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { SEED_BOOKINGS, type Booking } from '@/data/bookings'

interface BookingsContextValue {
  bookings: Booking[]
  active: Booking[]
  completed: Booking[]
  addBooking: (booking: Booking) => void
  ticketsOpen: boolean
  setTicketsOpen: (open: boolean) => void
}

const BookingsContext = createContext<BookingsContextValue | null>(null)

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS)
  const [ticketsOpen, setTicketsOpen] = useState(false)

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      active: bookings.filter((b) => b.status === 'active'),
      completed: bookings.filter((b) => b.status === 'completed'),
      addBooking: (booking) => setBookings((prev) => [booking, ...prev]),
      ticketsOpen,
      setTicketsOpen,
    }),
    [bookings, ticketsOpen],
  )

  return <BookingsContext value={value}>{children}</BookingsContext>
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
