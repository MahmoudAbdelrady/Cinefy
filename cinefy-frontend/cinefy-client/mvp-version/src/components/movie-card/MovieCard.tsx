import { Link } from 'react-router'
import { Poster } from '@/components/poster/Poster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatReleaseDate, type Movie } from '@/data/movies'

export function MovieCard({ movie, index = 0 }: { movie: Movie; index?: number }) {
  const upcoming = movie.status === 'upcoming'
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="reveal group block h-full"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative mb-3 aspect-2/3 overflow-hidden rounded-xl">
        <Poster
          movie={movie}
          className="size-full"
          artClassName="transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {!upcoming && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button className="bg-amber text-primary-foreground hover:bg-amber/90">
              Get Tickets
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-amber">
            {movie.title}
          </h3>
          {movie.badge && (
            <Badge
              variant="outline"
              className="shrink-0 border-amber/40 px-1.5 py-0 font-mono text-[10px] font-semibold text-amber"
            >
              {movie.badge}
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {upcoming ? formatReleaseDate(movie.releaseDate) : movie.genres.join(', ')}
        </p>
      </div>
    </Link>
  )
}
