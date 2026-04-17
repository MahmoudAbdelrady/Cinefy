import { Component } from '@angular/core';
import { ShowtimeSummary } from '../../../shared/types';
import { Plus, Trash2, LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';

@Component({
  selector: 'current-showtimes',
  imports: [NgpButton, LucideAngularModule],
  templateUrl: './current-showtimes.html',
  styleUrl: './current-showtimes.scss',
})
export class CurrentShowtimesComponent {
  protected readonly PlusIcon = Plus;
  protected readonly DeleteIcon = Trash2;

  protected readonly showtimesSummaries: ShowtimeSummary[] = [
    {
      id: '1',
      movie: {
        id: 1,
        title: 'The Matrix Resurrections',
        genre: 'Sci-Fi',
        releaseDate: '2021-12-22',
        duration: 148,
        posterUrl: 'https://image.tmdb.org/t/p/w500/8c4a8kE7PizaGQQnditMmI1xbRp.jpg',
      },
      totalShowtimes: 8,
      totalDraftShowtimes: 2,
    },
    {
      id: '2',
      movie: {
        id: 2,
        title: 'Dune: Part Two',
        genre: 'Adventure',
        releaseDate: '2024-03-01',
        duration: 166,
        posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      },
      totalShowtimes: 6,
      totalDraftShowtimes: 1,
    },
    {
      id: '3',
      movie: {
        id: 3,
        title: 'Spider-Man: No Way Home',
        genre: 'Action',
        releaseDate: '2021-12-17',
        duration: 148,
        posterUrl: 'https://image.tmdb.org/t/p/w500/x8AOx0zIfpNKZ1eVW4fhmUiZNqU.jpg',
      },
      totalShowtimes: 10,
      totalDraftShowtimes: 0,
    },
    {
      id: '4',
      movie: {
        id: 4,
        title: 'Avatar: The Way of Water',
        genre: 'Fantasy',
        releaseDate: '2022-12-16',
        duration: 192,
        posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
      },
      totalShowtimes: 7,
      totalDraftShowtimes: 3,
    },
    {
      id: '5',
      movie: {
        id: 5,
        title: 'Inception',
        genre: 'Thriller',
        releaseDate: '2010-07-16',
        duration: 148,
        posterUrl: 'https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
      },
      totalShowtimes: 5,
      totalDraftShowtimes: 0,
    },
  ];
}
