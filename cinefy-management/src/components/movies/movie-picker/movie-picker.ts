import { Component, computed, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpFormField } from 'ng-primitives/form-field';
import { NgpInput } from 'ng-primitives/input';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { ChevronRight, Film, LucideAngularModule, Search } from 'lucide-angular';
import { Movie } from '../../../shared/types';

@Component({
  selector: 'movie-picker',
  imports: [
    FormsModule,
    NgpButton,
    NgpSearch,
    NgpSearchClear,
    NgpInput,
    NgpFormField,
    LucideAngularModule,
    DatePipe,
  ],
  templateUrl: './movie-picker.html',
  styleUrl: './movie-picker.scss',
})
export class MoviePickerComponent {
  readonly movieSelected = output<Movie>();

  protected readonly SearchIcon = Search;
  protected readonly MovieIcon = Film;
  protected readonly ChevronRightIcon = ChevronRight;

  protected movieSearchQuery = signal('');

  protected readonly movies: Movie[] = [
    {
      id: 1,
      title: 'Dune: Part Two',
      genre: 'Sci-Fi',
      releaseDate: '2024-03-01',
      duration: 166,
      posterUrl: 'https://image.tmdb.org/t/p/w342/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg',
    },
    {
      id: 2,
      title: 'Oppenheimer',
      genre: 'Drama',
      releaseDate: '2023-07-21',
      duration: 180,
      posterUrl: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    },
    {
      id: 3,
      title: 'The Batman',
      genre: 'Action',
      releaseDate: '2022-03-04',
      duration: 176,
      posterUrl: 'https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    },
    {
      id: 4,
      title: 'Everything Everywhere All at Once',
      genre: 'Adventure',
      releaseDate: '2022-03-25',
      duration: 139,
      posterUrl: 'https://image.tmdb.org/t/p/w342/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    },
    {
      id: 5,
      title: 'Poor Things',
      genre: 'Comedy',
      releaseDate: '2023-12-08',
      duration: 141,
      posterUrl: 'https://image.tmdb.org/t/p/w342/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    },
    {
      id: 6,
      title: 'Interstellar',
      genre: 'Sci-Fi',
      releaseDate: '2014-11-07',
      duration: 169,
      posterUrl: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    },
    {
      id: 7,
      title: 'Parasite',
      genre: 'Thriller',
      releaseDate: '2019-05-30',
      duration: 132,
      posterUrl: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    },
    {
      id: 8,
      title: 'La La Land',
      genre: 'Musical',
      releaseDate: '2016-12-09',
      duration: 128,
      posterUrl: 'https://image.tmdb.org/t/p/w342/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    },
  ];

  protected readonly filteredMovies = computed(() =>
    this.movies.filter((movie) =>
      movie.title.toLocaleLowerCase().includes(this.movieSearchQuery().toLocaleLowerCase()),
    ),
  );

  protected onPick(movie: Movie) {
    this.movieSelected.emit(movie);
  }
}
