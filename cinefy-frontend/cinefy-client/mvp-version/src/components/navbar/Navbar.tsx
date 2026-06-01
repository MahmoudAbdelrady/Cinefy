import { Link, NavLink, useNavigate } from 'react-router'
import { Clapperboard, LogOut, Ticket, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBookings } from '@/app/BookingsProvider'

export function Navbar() {
  const { active, setTicketsOpen } = useBookings()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Clapperboard className="size-6 text-amber" />
            <span className="text-xl font-bold tracking-tight">Cinefy</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/movies"
              end
              className={({ isActive }) =>
                cn(
                  'transition-colors hover:text-foreground/80',
                  isActive ? 'text-foreground' : 'text-foreground/60',
                )
              }
            >
              Movies
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-foreground/70 hover:text-foreground"
              >
                <UserRound className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserRound className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/')}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
