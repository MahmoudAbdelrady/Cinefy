import { Link, useParams } from 'react-router'
import { ArrowLeft, Clock, Star } from 'lucide-react'
import { getMovie } from '@/data/movies'

const SHOWTIMES = ['11:30', '14:15', '17:00', '19:45', '22:30']

export function MovieDetailPage() {
  const { movieId } = useParams()
  const movie = getMovie(movieId)

  if (!movie) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground">That movie doesn’t exist.</p>
        <Link to="/" className="text-primary underline-offset-4 hover:underline">
          Back to all movies
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="grid gap-8 sm:grid-cols-[260px_1fr]">
        <div
          className="aspect-2/3 w-full rounded-xl"
          style={{ background: movie.posterColor }}
        />

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {movie.genre}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {movie.durationMins} min
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-current text-amber-500" />
              {movie.rating.toFixed(1)}
            </span>
          </div>
          <p className="max-w-prose leading-relaxed text-muted-foreground">
            {movie.synopsis}
          </p>

          <div className="mt-2 flex flex-col gap-3">
            <h2 className="font-semibold">Showtimes today</h2>
            <div className="flex flex-wrap gap-2">
              {SHOWTIMES.map((time) => (
                <button
                  key={time}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
