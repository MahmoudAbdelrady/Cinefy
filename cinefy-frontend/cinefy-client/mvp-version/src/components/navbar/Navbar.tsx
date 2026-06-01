import { Link, NavLink } from 'react-router'
import { Clapperboard, Search, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBookings } from '@/app/BookingsProvider'

export function Navbar() {
  const { active, setTicketsOpen } = useBookings()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Clapperboard className="size-6 text-amber" />
            <span className="text-xl font-bold tracking-tight">Cinefy</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <HeaderLink to="/" label="Home" />
            <HeaderLink to="/profile" label="Profile" />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-foreground/60 hover:text-foreground">
            <Search className="size-5" />
          </Button>
          <Button
            onClick={() => setTicketsOpen(true)}
            className="relative gap-2 bg-amber font-medium text-primary-foreground hover:bg-amber/90"
          >
            <Ticket className="size-4" />
            <span className="hidden sm:inline">My Tickets</span>
            {active.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 min-w-5 place-items-center rounded-full bg-foreground px-1 font-mono text-[10px] font-bold leading-none text-background">
                {active.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeaderLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'transition-colors hover:text-foreground/80',
          isActive ? 'text-foreground' : 'text-foreground/60',
        )
      }
    >
      {label}
    </NavLink>
  )
}
