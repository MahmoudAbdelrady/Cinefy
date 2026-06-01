import { Link } from 'react-router'
import { Clock, Star } from 'lucide-react'
import type { Movie } from '@/data/movies'

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div
        className="aspect-2/3 w-full"
        style={{ background: movie.posterColor }}
      />
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold leading-tight group-hover:text-primary">
            {movie.title}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3.5 fill-current text-amber-500" />
            {movie.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{movie.genre}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {movie.durationMins}m
          </span>
        </div>
      </div>
    </Link>
  )
}
