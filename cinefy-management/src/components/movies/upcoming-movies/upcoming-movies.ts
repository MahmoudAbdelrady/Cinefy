import { Component, signal } from '@angular/core';
import { Calendar, LucideAngularModule } from 'lucide-angular';
import type { Movie, Showtime } from '../../../shared/types';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
import { NgpToggleGroup, NgpToggleGroupItem } from 'ng-primitives/toggle-group';
import { ManageShowtimeModalComponent } from '../manage-showtime-modal/manage-showtime-modal';

type UpcomingWindow = 'two_weeks' | 'one_month' | 'three_months';

@Component({
  selector: 'upcoming-movies',
  imports: [
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    NgpToggleGroup,
    NgpToggleGroupItem,
    ManageShowtimeModalComponent,
  ],
  templateUrl: './upcoming-movies.html',
  styleUrl: './upcoming-movies.scss',
})
export class UpcomingMoviesComponent {
  protected readonly CalendarIcon = Calendar;

  protected readonly selectedWindow = signal<UpcomingWindow>('two_weeks');

  protected onWindowChange([next]: string[]): void {
    this.selectedWindow.set(next as UpcomingWindow);
  }

  protected onShowtimeCreated(showtime: Showtime): void {
    console.log('Showtime created', showtime);
  }

  private readonly today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  protected isComingSoon(releaseDate: string): boolean {
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    const diffDays = Math.round((release.getTime() - this.today.getTime()) / 86_400_000);
    return diffDays >= 0 && diffDays <= 10;
  }

  protected readonly movies: Movie[] = [
    {
      id: 201,
      title: 'The Dark Knight Returns',
      genre: 'Action',
      rating: 'PG-13',
      releaseDate: '2026-04-24',
      duration: 135,
      posterUrl: 'https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    },
    {
      id: 202,
      title: 'Interstellar Journey',
      genre: 'Sci-Fi',
      rating: 'PG-13',
      releaseDate: '2026-04-30',
      duration: 150,
      posterUrl: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    },
    {
      id: 203,
      title: 'Eternal Horizon',
      genre: 'Drama',
      rating: 'PG-13',
      releaseDate: '2026-05-08',
      duration: 125,
      posterUrl: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    },
    {
      id: 204,
      title: 'Whispers of the Sea',
      genre: 'Fantasy',
      rating: 'PG',
      releaseDate: '2026-05-15',
      duration: 118,
      posterUrl: 'https://image.tmdb.org/t/p/w342/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg',
    },
    {
      id: 205,
      title: 'Midnight Protocol',
      genre: 'Thriller',
      rating: 'R',
      releaseDate: '2026-05-29',
      duration: 142,
      posterUrl: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    },
    {
      id: 206,
      title: 'The Last Symphony',
      genre: 'Musical',
      rating: 'PG-13',
      releaseDate: '2026-06-12',
      duration: 128,
      posterUrl: 'https://image.tmdb.org/t/p/w342/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    },
    {
      id: 207,
      title: 'Paper Cities',
      genre: 'Comedy',
      rating: 'PG-13',
      releaseDate: '2026-07-03',
      duration: 112,
      posterUrl: 'https://image.tmdb.org/t/p/w342/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    },
  ];
}
