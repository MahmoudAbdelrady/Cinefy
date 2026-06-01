export interface Movie {
  id: string
  title: string
  genre: string
  durationMins: number
  rating: number
  posterColor: string
  synopsis: string
}

export const MOVIES: Movie[] = [
  {
    id: 'dune-two',
    title: 'Dune: Part Two',
    genre: 'Sci-Fi',
    durationMins: 166,
    rating: 8.6,
    posterColor: 'oklch(0.55 0.12 60)',
    synopsis:
      'Paul Atreides unites with the Fremen to wage war against the House Harkonnen.',
  },
  {
    id: 'the-batman',
    title: 'The Batman',
    genre: 'Action',
    durationMins: 176,
    rating: 7.8,
    posterColor: 'oklch(0.4 0.05 280)',
    synopsis:
      'A vengeance-driven Batman hunts a sadistic killer leaving cryptic clues across Gotham.',
  },
  {
    id: 'past-lives',
    title: 'Past Lives',
    genre: 'Drama',
    durationMins: 106,
    rating: 8.0,
    posterColor: 'oklch(0.6 0.1 20)',
    synopsis:
      'Two childhood friends reunite decades later, confronting choices, fate, and longing.',
  },
  {
    id: 'spirited-away',
    title: 'Spirited Away',
    genre: 'Animation',
    durationMins: 125,
    rating: 8.6,
    posterColor: 'oklch(0.6 0.12 160)',
    synopsis:
      'A young girl wanders into a world of spirits and must find a way to free her parents.',
  },
]

export function getMovie(id: string | undefined): Movie | undefined {
  return MOVIES.find((m) => m.id === id)
}
