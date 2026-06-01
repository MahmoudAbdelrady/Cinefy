import { Link } from 'react-router'
import { Clapperboard, Search, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-6 text-primary" />
          <span className="text-lg tracking-tight">Cinefy</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Search className="size-5" />
          </Button>
          <Button>
            <Ticket className="size-4" />
            My Tickets
          </Button>
        </div>
      </nav>
    </header>
  )
}
