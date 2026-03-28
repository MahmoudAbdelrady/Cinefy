import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  LucideAngularModule,
  Calendar,
  Clock,
} from 'lucide-angular';
import { RouterLink } from '@angular/router';

interface UpcomingMovie {
  poster: string;
  title: string;
  genre: string;
  releaseDate: string;
}

@Component({
  selector: 'upcoming-movies-component',
  imports: [DatePipe, LucideAngularModule, RouterLink],
  templateUrl: './upcoming-movies.html',
  styleUrl: './upcoming-movies.scss',
})
export class UpcomingMoviesComponent {
  protected CalendarIcon = Calendar;
  protected ClockIcon = Clock;
  protected upcomingMovies: UpcomingMovie[] = [
    {
      poster:
        'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'The Dark Knight Returns',
      genre: 'Action',
      releaseDate: 'March 30, 2026',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1758232589376-9f3db5aa371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Interstellar Journey',
      genre: 'Sci-Fi',
      releaseDate: 'April 5, 2026',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Eternal Horizon',
      genre: 'Drama',
      releaseDate: 'April 12, 2026',
    },
  ];
}
