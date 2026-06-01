import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MovieCard } from '@/components/movie-card/MovieCard'
import {
  nowShowing,
  nowShowingGenres,
  nowShowingLanguages,
} from '@/data/movies'

const ALL = 'all'

export function MoviesPage() {
  const movies = nowShowing()
  const languages = nowShowingLanguages()
  const genres = nowShowingGenres()

  const [name, setName] = useState('')
  const [language, setLanguage] = useState(ALL)
  const [genre, setGenre] = useState(ALL)

  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase()
    return movies.filter((m) => {
      const matchesName = !q || m.title.toLowerCase().includes(q)
      const matchesLang = language === ALL || m.language === language
      const matchesGenre = genre === ALL || m.genres.includes(genre)
      return matchesName && matchesLang && matchesGenre
    })
  }, [movies, name, language, genre])

  const hasFilters = name.trim() !== '' || language !== ALL || genre !== ALL
  const clearAll = () => {
    setName('')
    setLanguage(ALL)
    setGenre(ALL)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="reveal mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
        <p className="mt-1 text-muted-foreground">
          Browse everything showing in our cinemas right now.
        </p>
      </header>

      {/* Filter bar */}
      <div className="reveal mb-6 flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 sm:flex-row sm:items-center" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by title…"
            className="pl-9"
          />
        </div>

        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All genres</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearAll}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter chips + result count */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
        {hasFilters && <span className="text-border">·</span>}
        {name.trim() && (
          <FilterChip label={`“${name.trim()}”`} onClear={() => setName('')} />
        )}
        {language !== ALL && (
          <FilterChip label={language} onClear={() => setLanguage(ALL)} />
        )}
        {genre !== ALL && (
          <FilterChip label={genre} onClear={() => setGenre(ALL)} />
        )}
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <EmptyState onClear={clearAll} />
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-secondary pr-1 font-normal text-secondary-foreground"
    >
      {label}
      <button
        onClick={onClear}
        className="grid size-4 place-items-center rounded-full hover:bg-foreground/10"
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card py-20 text-center">
      <SlidersHorizontal className="size-8 text-muted-foreground opacity-40" />
      <div>
        <p className="font-medium">No movies match your filters</p>
        <p className="text-sm text-muted-foreground">
          Try a different search, language, or genre.
        </p>
      </div>
      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}
