import { Component, computed, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CustomSelectComponent,
  EmptyStateComponent,
  InputField,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { ClapperboardIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from '../../shared/icons';

type Experience = 'Normal' | 'Imax' | '4DX' | 'Gold';

interface MoviesPageMovie {
  id: number;
  title: string;
  genres: string[];
  experience: Experience;
  contentRating: string;
  posterUrl?: string;
  is3D: boolean;
}

const PLACEHOLDER_MOVIES: MoviesPageMovie[] = [
  {
    id: 1,
    title: 'Dune: Part Two',
    genres: ['Sci-Fi', 'Adventure'],
    experience: 'Imax',
    contentRating: 'PG-13',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    is3D: true,
  },
  {
    id: 2,
    title: 'Oppenheimer',
    genres: ['Biography', 'Drama', 'History'],
    experience: 'Imax',
    contentRating: 'R',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    is3D: false,
  },
  {
    id: 3,
    title: 'Furiosa: A Mad Max Saga',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    experience: '4DX',
    contentRating: 'R',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    is3D: false,
  },
  {
    id: 4,
    title: 'Deadpool & Wolverine',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    experience: 'Gold',
    contentRating: 'R',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    is3D: false,
  },
  {
    id: 5,
    title: 'Inside Out 2',
    genres: ['Animation', 'Adventure', 'Comedy'],
    experience: 'Normal',
    contentRating: 'PG',
    posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    is3D: false,
  },
  {
    id: 6,
    title: 'Kingdom of the Planet of the Apes',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    experience: 'Normal',
    contentRating: 'PG-13',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    is3D: false,
  },
];

@Component({
  selector: 'movies-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    InputField,
    CustomSelectComponent,
    MediaImageComponent,
    EmptyStateComponent,
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.scss',
})
export class MoviesPage {
  protected readonly icons = {
    SearchIcon,
    SlidersHorizontalIcon,
    XIcon,
    ClapperboardIcon,
  };

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly movies = signal<MoviesPageMovie[]>(PLACEHOLDER_MOVIES);

  private readonly search = toSignal(this.searchControl.valueChanges, {
    initialValue: this.searchControl.value,
  });
  protected readonly selectedExperiences = signal<Experience[]>([]);
  protected readonly selectedGenres = signal<string[]>([]);
  protected readonly selectedContentRatings = signal<string[]>([]);

  protected readonly experiences: Experience[] = ['Normal', 'Imax', '4DX', 'Gold'];

  protected readonly genres = [
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'History',
    'Horror',
    'Music',
    'Mystery',
    'Romance',
    'Science Fiction',
    'TV Movie',
    'Thriller',
    'War',
    'Western',
  ];

  protected readonly contentRatings = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

  protected readonly filtered = computed(() => {
    const query = this.trimmedSearch().toLowerCase();
    const experiences = this.selectedExperiences();
    const genres = this.selectedGenres();
    const contentRatings = this.selectedContentRatings();
    return this.movies().filter((movie) => {
      const matchesName = !query || movie.title.toLowerCase().includes(query);
      const matchesExperience = !experiences.length || experiences.includes(movie.experience);
      const matchesGenre = !genres.length || genres.some((g) => movie.genres.includes(g));
      const matchesContentRating =
        !contentRatings.length || contentRatings.includes(movie.contentRating);
      return matchesName && matchesExperience && matchesGenre && matchesContentRating;
    });
  });

  protected readonly trimmedSearch = computed(() => this.search().trim());

  protected readonly hasFilters = computed(
    () =>
      this.trimmedSearch() !== '' ||
      this.selectedExperiences().length > 0 ||
      this.selectedGenres().length > 0 ||
      this.selectedContentRatings().length > 0,
  );

  protected readonly optionDisplayFn = (option: string): string => option;

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected onExperienceChange(values: Experience[]): void {
    this.selectedExperiences.set(values);
  }

  protected onGenreChange(values: string[]): void {
    this.selectedGenres.set(values);
  }

  protected onContentRatingChange(values: string[]): void {
    this.selectedContentRatings.set(values);
  }

  protected removeExperience(value: Experience): void {
    this.selectedExperiences.update((values) => values.filter((v) => v !== value));
  }

  protected removeGenre(value: string): void {
    this.selectedGenres.update((values) => values.filter((v) => v !== value));
  }

  protected removeContentRating(value: string): void {
    this.selectedContentRatings.update((values) => values.filter((v) => v !== value));
  }

  protected clearAll(): void {
    this.clearSearch();
    this.selectedExperiences.set([]);
    this.selectedGenres.set([]);
    this.selectedContentRatings.set([]);
  }
}
