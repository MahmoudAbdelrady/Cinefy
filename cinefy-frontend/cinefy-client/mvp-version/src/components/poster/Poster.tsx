import { cn } from '@/lib/utils'
import type { Movie } from '@/data/movies'

interface PosterProps {
  movie: Movie
  className?: string
  /** overlay the title onto the artwork (used where there's no caption beneath) */
  showTitle?: boolean
  /** extra classes for the inner artwork layer (e.g. group-hover:scale-105) */
  artClassName?: string
}

/**
 * Renders a movie's poster image. The artwork lives on an inner layer so it can
 * be scaled (zoomed) under the frame's `overflow-hidden`, like v2's <img> hover.
 * Falls back to a gradient duotone when the movie has no posterUrl.
 */
export function Poster({ movie, className, showTitle = false, artClassName }: PosterProps) {
  const [from, to] = movie.poster
  return (
    <div className={cn('relative isolate overflow-hidden bg-muted', className)}>
      {/* artwork layer — this is what scales on hover */}
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className={cn('absolute inset-0 z-0 size-full object-cover', artClassName)}
        />
      ) : (
        <div
          className={cn('absolute inset-0 z-0', artClassName)}
          style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
        >
          <div
            className="absolute -right-1/4 -top-1/4 h-2/3 w-2/3 rounded-full blur-2xl"
            style={{ background: movie.accent, opacity: 0.4 }}
          />
        </div>
      )}

      {/* scrim stays fixed above the artwork (only when overlaying a title) */}
      {showTitle && (
        <>
          <div className="absolute inset-0 z-10 bg-[radial-gradient(130%_130%_at_50%_0%,transparent_45%,rgba(0,0,0,0.5))]" />
          <div className="absolute inset-x-0 bottom-0 z-20 p-4">
            <h3 className="text-xl font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {movie.title}
            </h3>
          </div>
        </>
      )}
    </div>
  )
}
