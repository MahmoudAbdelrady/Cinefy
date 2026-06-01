import { Link } from 'react-router'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-28 text-center">
      <p className="text-8xl font-bold leading-none text-amber">404</p>
      <p className="text-2xl font-bold tracking-tight">Page not found</p>
      <p className="max-w-sm text-muted-foreground">
        This screen rolled off the reel. Let’s get you back to the lobby.
      </p>
      <Button asChild className="mt-2 gap-2 bg-amber text-primary-foreground hover:bg-amber/90">
        <Link to="/">
          <Home className="size-4" />
          Back to home
        </Link>
      </Button>
    </div>
  )
}
