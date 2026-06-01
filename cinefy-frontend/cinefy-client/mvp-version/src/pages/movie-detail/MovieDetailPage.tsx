import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Calendar, Clock, Info, Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Poster } from '@/components/poster/Poster'
import {
  dateWindow,
  dayLabel,
  dayNumber,
  formatReleaseDate,
  formatRuntime,
  formatTime12h,
  getMovie,
  monthShort,
  type Movie,
  type Showtime,
} from '@/data/movies'

export function MovieDetailPage() {
  const { movieId } = useParams()
  const movie = getMovie(movieId)

  if (!movie) return <NotFound />

  return (
    <div className="pb-20">
      <Backdrop movie={movie} />

      <div className="relative z-10 mx-auto -mt-32 w-full max-w-6xl px-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="reveal mx-auto w-48 shrink-0 md:mx-0 md:w-64">
            <Poster
              movie={movie}
              className="aspect-2/3 rounded-xl border border-border/50 shadow-2xl"
            />
          </div>

          <div className="reveal flex-1 space-y-6 pt-4 text-center md:pt-32 md:text-left" style={{ animationDelay: '90ms' }}>
            <div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
                <Badge variant="secondary" className="bg-secondary/50">
                  {movie.certificate}
                </Badge>
                <span>{movie.genres.join(', ')}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> {formatRuntime(movie.durationMins)}
                </span>
                {movie.status === 'now-showing' && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-1 font-medium text-amber">
                      <Star className="size-4 fill-amber" /> {movie.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
                <Play className="size-4" /> Watch Trailer
              </Button>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Synopsis</h3>
              <p className="max-w-3xl leading-relaxed text-muted-foreground">
                {movie.synopsis}
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Cast &amp; Crew</h3>
              <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
                <CrewMember name={movie.director} role="Director" />
                <div className="h-10 w-px shrink-0 bg-border" />
                {movie.cast.map((name) => (
                  <CrewMember key={name} name={name} role="Cast" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <BookingSection movie={movie} />
      </div>
    </div>
  )
}

function Backdrop({ movie }: { movie: Movie }) {
  const [from, to] = movie.poster
  return (
    <div className="relative h-[50vh] min-h-[400px] w-full">
      {movie.backdropUrl ? (
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(125deg, ${from}, ${to})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  )
}

function CrewMember({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="grid size-12 place-items-center rounded-full border border-border bg-secondary text-sm font-semibold">
        {initials}
      </span>
      <div className="text-left">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  )
}

function BookingSection({ movie }: { movie: Movie }) {
  const dates = dateWindow(7)
  const [selectedDate, setSelectedDate] = useState(dates[0])

  const dayShowtimes = movie.showtimes.filter((s) => s.date === selectedDate)
  const byFormat = dayShowtimes.reduce<Record<string, Showtime[]>>((acc, s) => {
    ;(acc[s.format] ??= []).push(s)
    return acc
  }, {})

  return (
    <section className="mt-16 border-t border-border/40 pt-16">
      <h2 className="mb-8 text-2xl font-bold">Book Tickets</h2>

      {movie.status === 'upcoming' ? (
        <ComingSoon movie={movie} />
      ) : (
        <>
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((date) => {
              const active = date === selectedDate
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded-xl border transition-all ${
                    active
                      ? 'border-amber bg-amber/10 text-amber'
                      : 'border-border bg-card hover:border-amber/50 hover:bg-accent'
                  }`}
                >
                  <span className="mb-1 text-xs font-medium uppercase">
                    {monthShort(date)}
                  </span>
                  <span className={`text-2xl font-bold ${active ? 'text-amber' : 'text-foreground'}`}>
                    {dayNumber(date)}
                  </span>
                  <span className="mt-1 text-xs">{dayLabel(date)}</span>
                </button>
              )
            })}
          </div>

          {dayShowtimes.length === 0 ? (
            <EmptyShowtimes />
          ) : (
            <div className="space-y-8">
              {Object.entries(byFormat).map(([format, times]) => (
                <FormatGroup key={format} format={format} times={times} movieId={movie.id} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function FormatGroup({
  format,
  times,
  movieId,
}: {
  format: string
  times: Showtime[]
  movieId: string
}) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-xl font-bold">{format}</h3>
        <Badge variant="outline" className="text-xs font-normal">
          English
        </Badge>
      </div>
      <div className="flex flex-wrap gap-4">
        {times.map((st) => (
          <Button
            key={st.id}
            variant="outline"
            onClick={() => navigate(`/movies/${movieId}/seats?showtime=${st.id}`)}
            className="h-auto border-border/50 px-4 py-3 font-mono text-base font-semibold hover:border-amber hover:text-amber"
          >
            {formatTime12h(st.time)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ movie }: { movie: Movie }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 py-12 text-center">
      <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">Tickets not yet available</h3>
      <p className="text-muted-foreground">
        Releasing on {formatReleaseDate(movie.releaseDate)}
      </p>
    </div>
  )
}

function EmptyShowtimes() {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 py-12 text-center">
      <Info className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">No showtimes available</h3>
      <p className="text-muted-foreground">Try selecting a different date.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-24">
      <p className="text-4xl font-bold">Movie not found</p>
      <p className="text-muted-foreground">That movie isn’t in our catalogue.</p>
      <Button asChild className="bg-amber text-primary-foreground hover:bg-amber/90">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
