import { Outlet, ScrollRestoration } from 'react-router'
import { BookingsProvider } from './BookingsProvider'
import { Navbar } from '@/components/navbar/Navbar'
import { MyTicketsOverlay } from '@/components/my-tickets/MyTicketsOverlay'
import { Footer } from '@/components/footer/Footer'

export function RootLayout() {
  return (
    <BookingsProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <MyTicketsOverlay />
        <ScrollRestoration />
      </div>
    </BookingsProvider>
  )
}
