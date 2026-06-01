export type MovieStatus = 'now-showing' | 'upcoming'

export interface Showtime {
  id: string
  /** ISO date (YYYY-MM-DD) this showing runs on */
  date: string
  time: string
  hall: string
  format: '2D' | '3D' | 'IMAX' | '70mm'
  priceCents: number
}

export interface Movie {
  id: string
  title: string
  tagline: string
  genres: string[]
  durationMins: number
  rating: number
  certificate: string
  language: string
  year: number
  status: MovieStatus
  releaseDate: string
  /** optional short tag shown next to the card title (e.g. "3D", "IMAX") */
  badge?: string
  /** real poster image (TMDB). When absent, the gradient below is used. */
  posterUrl?: string
  /** real backdrop image (TMDB) for hero/detail headers. */
  backdropUrl?: string
  /** oklch gradient stops — fallback artwork + ambient accent glows. */
  poster: [string, string]
  accent: string
  synopsis: string
  director: string
  cast: string[]
  showtimes: Showtime[]
}

/** The platform's "today". Showtimes are spread across the following days. */
export const TODAY = '2026-06-01'

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/** Build a 7-day window of dates starting today, for the date picker. */
export function dateWindow(days = 7): string[] {
  return Array.from({ length: days }, (_, i) => addDays(TODAY, i))
}

/** spec tuple: [dayOffset, time, format, hall, priceCents] */
const showtimes = (
  specs: Array<[number, string, Showtime['format'], string, number]>,
): Showtime[] =>
  specs.map(([dayOffset, time, format, hall, priceCents], i) => ({
    id: `st-${dayOffset}-${time.replace(':', '')}-${i}`,
    date: addDays(TODAY, dayOffset),
    time,
    hall,
    format,
    priceCents,
  }))

const TMDB = 'https://image.tmdb.org/t/p'
const poster = (path: string) => `${TMDB}/w500${path}`
const backdrop = (path: string) => `${TMDB}/original${path}`

export const MOVIES: Movie[] = [
  {
    id: 'dune-part-two',
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters',
    genres: ['Sci-Fi', 'Adventure'],
    durationMins: 166,
    rating: 8.8,
    certificate: 'PG-13',
    language: 'English',
    year: 2024,
    status: 'now-showing',
    releaseDate: '2024-03-01',
    badge: '3D',
    posterUrl: poster('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'),
    backdropUrl: backdrop('/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg'),
    poster: ['oklch(0.55 0.13 65)', 'oklch(0.28 0.06 45)'],
    accent: 'oklch(0.78 0.14 70)',
    synopsis:
      'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    showtimes: showtimes([
      [0, '11:30', 'IMAX', 'Hall 1', 1900],
      [0, '14:45', '2D', 'Hall 3', 1400],
      [0, '18:00', 'IMAX', 'Hall 1', 1900],
      [0, '21:15', '2D', 'Hall 2', 1400],
      [1, '13:00', '2D', 'Hall 3', 1400],
      [1, '16:45', 'IMAX', 'Hall 1', 1900],
      [1, '20:30', 'IMAX', 'Hall 1', 1900],
      [2, '15:00', '2D', 'Hall 2', 1400],
      [2, '19:15', 'IMAX', 'Hall 1', 1900],
    ]),
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    tagline: 'The world forever changes',
    genres: ['Biography', 'Drama', 'History'],
    durationMins: 180,
    rating: 8.4,
    certificate: 'R',
    language: 'English',
    year: 2023,
    status: 'now-showing',
    releaseDate: '2023-07-21',
    posterUrl: poster('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'),
    backdropUrl: backdrop('/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg'),
    poster: ['oklch(0.5 0.06 50)', 'oklch(0.24 0.03 40)'],
    accent: 'oklch(0.74 0.13 55)',
    synopsis:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb — a chronicle of genius, ambition, and the terrible weight of consequence.',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.', 'Matt Damon'],
    showtimes: showtimes([
      [0, '15:00', '70mm', 'Hall 4', 2500],
      [0, '19:30', '70mm', 'Hall 4', 2500],
      [1, '14:30', '70mm', 'Hall 4', 2500],
      [1, '18:45', '2D', 'Hall 2', 1500],
      [2, '16:00', '70mm', 'Hall 4', 2500],
    ]),
  },
  {
    id: 'furiosa',
    title: 'Furiosa: A Mad Max Saga',
    tagline: 'Fury is born',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    durationMins: 148,
    rating: 7.9,
    certificate: 'R',
    language: 'Spanish',
    year: 2024,
    status: 'now-showing',
    releaseDate: '2024-05-24',
    posterUrl: poster('/iADOJ8Zymht2JPMoy3R7xceZprc.jpg'),
    backdropUrl: backdrop('/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg'),
    poster: ['oklch(0.55 0.13 50)', 'oklch(0.26 0.06 35)'],
    accent: 'oklch(0.76 0.15 55)',
    synopsis:
      'As the world falls, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great biker horde. Sweeping through the Wasteland, she must survive and find her way home.',
    director: 'George Miller',
    cast: ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tom Burke'],
    showtimes: showtimes([
      [0, '13:15', '2D', 'Hall 2', 1400],
      [0, '16:30', '3D', 'Hall 5', 1700],
      [0, '20:45', '3D', 'Hall 5', 1700],
      [1, '15:00', '3D', 'Hall 5', 1700],
      [1, '19:00', '2D', 'Hall 2', 1400],
      [2, '17:45', '3D', 'Hall 5', 1700],
    ]),
  },
  {
    id: 'deadpool-wolverine',
    title: 'Deadpool & Wolverine',
    tagline: 'Come together',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    durationMins: 127,
    rating: 8.2,
    certificate: 'R',
    language: 'English',
    year: 2024,
    status: 'now-showing',
    releaseDate: '2024-07-26',
    posterUrl: poster('/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'),
    backdropUrl: backdrop('/SPnB1qiCkYfirS2it3hZORwGVn.jpg'),
    poster: ['oklch(0.5 0.13 25)', 'oklch(0.24 0.06 20)'],
    accent: 'oklch(0.7 0.16 28)',
    synopsis:
      'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy — and reluctantly save the multiverse along the way.',
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    showtimes: showtimes([
      [0, '12:00', '2D', 'Hall 3', 1400],
      [0, '14:30', '3D', 'Hall 5', 1700],
      [0, '17:15', '2D', 'Hall 3', 1400],
      [0, '20:00', '3D', 'Hall 5', 1700],
      [1, '13:45', '3D', 'Hall 5', 1700],
      [1, '18:30', '2D', 'Hall 3', 1400],
      [2, '16:15', '3D', 'Hall 5', 1700],
      [2, '21:00', '2D', 'Hall 3', 1400],
    ]),
  },
  {
    id: 'inside-out-2',
    title: 'Inside Out 2',
    tagline: 'Make room for new emotions',
    genres: ['Animation', 'Adventure', 'Comedy'],
    durationMins: 96,
    rating: 8.0,
    certificate: 'PG',
    language: 'French',
    year: 2024,
    status: 'now-showing',
    releaseDate: '2024-06-14',
    posterUrl: poster('/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'),
    backdropUrl: backdrop('/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg'),
    poster: ['oklch(0.6 0.13 280)', 'oklch(0.3 0.06 285)'],
    accent: 'oklch(0.75 0.14 300)',
    synopsis:
      'Riley enters her teenage years, and Headquarters is undergoing a sudden demolition to make room for something entirely unexpected: brand-new emotions led by the anxious, well-meaning Anxiety.',
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Phyllis Smith'],
    showtimes: showtimes([
      [0, '10:30', '2D', 'Hall 6', 1200],
      [0, '13:00', '2D', 'Hall 6', 1200],
      [0, '15:30', '2D', 'Hall 6', 1200],
      [1, '11:00', '2D', 'Hall 6', 1200],
      [1, '14:15', '3D', 'Hall 5', 1500],
      [2, '12:30', '2D', 'Hall 6', 1200],
    ]),
  },
  {
    id: 'kingdom-apes',
    title: 'Kingdom of the Planet of the Apes',
    tagline: 'No one can stop the reign',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    durationMins: 145,
    rating: 7.2,
    certificate: 'PG-13',
    language: 'English',
    year: 2024,
    status: 'now-showing',
    releaseDate: '2024-05-10',
    posterUrl: poster('/gKkl37BQuKTanygYQG1pyYgLVgf.jpg'),
    backdropUrl: backdrop('/fqv8v6AycXKsivp1T5yKtLbGXce.jpg'),
    poster: ['oklch(0.52 0.1 145)', 'oklch(0.26 0.05 155)'],
    accent: 'oklch(0.74 0.13 150)',
    synopsis:
      'Many years after the reign of Caesar, a young ape goes on a journey that will lead him to question everything he has been taught about the past — and make choices that will define a future for apes and humans alike.',
    director: 'Wes Ball',
    cast: ['Owen Teague', 'Freya Allan', 'Kevin Durand'],
    showtimes: showtimes([
      [0, '12:45', '2D', 'Hall 2', 1400],
      [0, '16:00', '3D', 'Hall 5', 1700],
      [0, '19:45', '2D', 'Hall 2', 1400],
      [1, '14:00', '3D', 'Hall 5', 1700],
      [1, '18:15', '2D', 'Hall 2', 1400],
      [2, '15:30', '3D', 'Hall 5', 1700],
    ]),
  },
  {
    id: 'gladiator-ii',
    title: 'Gladiator II',
    tagline: 'The dream that was Rome',
    genres: ['Action', 'Adventure', 'Drama'],
    durationMins: 150,
    rating: 0,
    certificate: 'R',
    language: 'English',
    year: 2024,
    status: 'upcoming',
    releaseDate: '2026-08-14',
    posterUrl: poster('/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg'),
    backdropUrl: backdrop('/euYIwmwkmz95mnXvufEmbL6ovhZ.jpg'),
    poster: ['oklch(0.55 0.1 70)', 'oklch(0.26 0.05 55)'],
    accent: 'oklch(0.78 0.13 75)',
    synopsis:
      'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius is forced to enter the Colosseum after his home is conquered — and must look to his past to find strength to return Rome to its glory.',
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington'],
    showtimes: [],
  },
  {
    id: 'wicked',
    title: 'Wicked',
    tagline: 'Everyone deserves the chance to fly',
    genres: ['Fantasy', 'Musical', 'Romance'],
    durationMins: 160,
    rating: 0,
    certificate: 'PG',
    language: 'English',
    year: 2024,
    status: 'upcoming',
    releaseDate: '2026-07-03',
    posterUrl: poster('/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg'),
    backdropUrl: backdrop('/uKb22E0nlzr914bA9KyA5CVCOlV.jpg'),
    poster: ['oklch(0.55 0.13 155)', 'oklch(0.26 0.06 165)'],
    accent: 'oklch(0.76 0.14 150)',
    synopsis:
      'The untold story of the witches of Oz. Elphaba, a young woman misunderstood because of her green skin, and Glinda, a popular girl gilded by privilege, forge an unlikely friendship that will define who they become.',
    director: 'Jon M. Chu',
    cast: ['Cynthia Erivo', 'Ariana Grande', 'Jeff Goldblum'],
    showtimes: [],
  },
]

export function getMovie(id: string | undefined): Movie | undefined {
  return MOVIES.find((m) => m.id === id)
}

export function getShowtime(movie: Movie | undefined, showtimeId: string | null) {
  return movie?.showtimes.find((s) => s.id === showtimeId)
}

export const nowShowing = () => MOVIES.filter((m) => m.status === 'now-showing')
export const upcoming = () => MOVIES.filter((m) => m.status === 'upcoming')
export const featured = () => MOVIES[0]

/** Distinct languages across now-showing movies, sorted, for the filter dropdown. */
export const nowShowingLanguages = (): string[] =>
  [...new Set(nowShowing().map((m) => m.language))].sort()

/** Distinct genres across now-showing movies, sorted, for the filter dropdown. */
export const nowShowingGenres = (): string[] =>
  [...new Set(nowShowing().flatMap((m) => m.genres))].sort()

export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

export const formatRuntime = (mins: number) =>
  `${Math.floor(mins / 60)}h ${mins % 60}m`

/** "18:00" → "6:00 PM" */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

export const formatReleaseDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

/** "Today" / "Tomorrow" / weekday label for a date relative to TODAY. */
export function dayLabel(iso: string): string {
  const offset = Math.round(
    (new Date(iso + 'T00:00:00').getTime() -
      new Date(TODAY + 'T00:00:00').getTime()) /
      86_400_000,
  )
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
  })
}

export const dayNumber = (iso: string) => new Date(iso + 'T00:00:00').getDate()

export const monthShort = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })

export const formatLongDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
