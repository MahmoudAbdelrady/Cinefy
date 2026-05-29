import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CalendarIcon, ClockIcon } from '../../../shared/icons';
import { RouterLink } from '@angular/router';
import type { Movie } from '../../../shared/types';

@Component({
  selector: 'upcoming-movies-widget',
  imports: [DatePipe, LucideAngularModule, RouterLink],
  templateUrl: './upcoming-movies-widget.html',
  styleUrl: './upcoming-movies-widget.scss',
})
export class UpcomingMoviesWidgetComponent {
  protected readonly icons = {
    CalendarIcon,
    ClockIcon,
  };
  protected upcomingMovies: Movie[] = [
    {
      id: 101,
      title: 'The Dark Knight Returns',
      genre: 'Action',
      rating: 'PG-13',
      releaseDate: '2026-03-30',
      duration: 135,
      posterUrl:
        'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      id: 102,
      title: 'Interstellar Journey',
      genre: 'Sci-Fi',
      rating: 'PG-13',
      releaseDate: '2026-04-05',
      duration: 150,
      posterUrl:
        'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      id: 103,
      title: 'Eternal Horizon',
      genre: 'Drama',
      rating: 'PG-13',
      releaseDate: '2026-04-12',
      duration: 125,
      posterUrl:
        'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
  ];

  protected daysUntil(isoDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(isoDate);
    release.setHours(0, 0, 0, 0);
    const diffMs = release.getTime() - today.getTime();
    return Math.max(0, Math.round(diffMs / 86_400_000));
  }
}
