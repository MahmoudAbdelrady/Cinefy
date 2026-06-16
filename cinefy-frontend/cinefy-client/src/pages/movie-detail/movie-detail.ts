import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { MediaImageComponent } from 'cinefy-ui/components';
import { DurationPipe } from 'cinefy-ui/pipes';
import { BookingSectionComponent, TrailerModalComponent } from '../../components';
import type { MovieDetail } from '../../shared/types';
import { ClockIcon, EyeIcon, PlayIcon, UserIcon } from '../../shared/icons';

interface CrewMember {
  name: string;
  role: string;
}

@Component({
  selector: 'movie-detail-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    NgpButton,
    NgpDialogTrigger,
    MediaImageComponent,
    DurationPipe,
    BookingSectionComponent,
    TrailerModalComponent,
  ],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetailPage {
  protected readonly icons = {
    ClockIcon,
    EyeIcon,
    PlayIcon,
    UserIcon,
  };

  protected readonly movie = signal<MovieDetail | undefined>(PLACEHOLDER_MOVIE);

  protected readonly bookingOpened = signal(true);

  protected readonly crew = computed<CrewMember[]>(() => {
    const credits = this.movie()?.credits;
    if (!credits) return [];
    const directors = credits.directors.map((member) => ({ name: member.name, role: 'Director' }));
    const cast = credits.cast.map((member) => ({ name: member.name, role: 'Cast' }));
    return [...directors, ...cast];
  });
}

const PLACEHOLDER_MOVIE: MovieDetail = {
  id: 1,
  title: 'Dune: Part Two',
  synopsis:
    'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
  genres: ['Sci-Fi', 'Adventure'],
  contentRating: 'PG-13',
  releaseDate: '2024-03-01',
  duration: 166,
  posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  backdropUrl: 'https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
  trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
  credits: {
    directors: [{ id: 1, name: 'Denis Villeneuve' }],
    cast: [
      { id: 2, name: 'Timothée Chalamet' },
      { id: 3, name: 'Zendaya' },
      { id: 4, name: 'Rebecca Ferguson' },
      { id: 5, name: 'Javier Bardem' },
    ],
  },
};
