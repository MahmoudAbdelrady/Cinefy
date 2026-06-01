import { MovieCard } from '@/components/movie-card/MovieCard'
import { MOVIES } from '@/data/movies'

export function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Now Showing</h1>
        <p className="text-muted-foreground">
          Pick a film, choose your seats, and book in seconds.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {MOVIES.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </section>
    </div>
  )
}
