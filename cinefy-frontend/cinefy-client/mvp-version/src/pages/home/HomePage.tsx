import { Link } from 'react-router'
import { Clock, Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MovieCard } from '@/components/movie-card/MovieCard'
import { SectionHeading } from '@/components/section-heading/SectionHeading'
import {
  featured,
  formatRuntime,
  nowShowing,
  upcoming,
  type Movie,
} from '@/data/movies'

export function HomePage() {
  return (
    <div className="pb-20">
      <Hero movie={featured()} />

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <SectionHeading title="Now Showing" action="View All" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {nowShowing().map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <SectionHeading title="Coming Soon" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {upcoming().map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Hero({ movie }: { movie: Movie }) {
  const [from, to] = movie.poster
  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0">
        {movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="size-full"
            style={{ background: `linear-gradient(125deg, ${from}, ${to})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-end px-4 pb-16">
        <div className="reveal max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-sm font-medium text-amber">
            <Badge
              variant="outline"
              className="border-amber bg-amber/10 text-amber"
            >
              Now Showing
            </Badge>
            <span className="flex items-center gap-1 font-mono">
              <Star className="size-4 fill-amber" /> {movie.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="size-4" /> {formatRuntime(movie.durationMins)}
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            {movie.title}
          </h1>

          <p className="max-w-xl text-lg text-gray-300 line-clamp-3">
            {movie.synopsis}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="bg-amber px-8 font-semibold text-primary-foreground hover:bg-amber/90"
            >
              <Link to={`/movies/${movie.id}`}>Book Tickets</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 bg-background/20 backdrop-blur-sm hover:bg-white/10"
            >
              <Play className="size-4" /> Watch Trailer
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
