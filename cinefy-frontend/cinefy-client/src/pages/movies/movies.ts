import { Component, computed, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  AsyncSelectComponent,
  CustomSelectComponent,
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { HallsService, MoviesService } from '../../services';
import type { HallType } from '../../shared/types';
import {
  ClapperboardIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
  TriangleAlertIcon,
} from '../../shared/icons';

@Component({
  selector: 'movies-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    InputField,
    CustomSelectComponent,
    AsyncSelectComponent,
    MediaImageComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
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
    TriangleAlertIcon,
  };

  private readonly moviesService = inject(MoviesService);
  private readonly hallsService = inject(HallsService);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  protected readonly movies = rxResource({
    stream: () => this.moviesService.getNowShowing(),
  });

  private readonly search = toSignal(this.searchControl.valueChanges, {
    initialValue: this.searchControl.value,
  });
  protected readonly selectedHallTypes = signal<HallType[]>([]);
  protected readonly selectedGenres = signal<string[]>([]);
  protected readonly selectedContentRatings = signal<string[]>([]);

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

  protected readonly filteredMovies = computed(() => {
    const searchedTitle = this.trimmedSearch().toLowerCase();
    const selectedHallTypes = this.selectedHallTypes();
    const selectedGenres = this.selectedGenres();
    const selectedContentRatings = this.selectedContentRatings();
    const moviesList = this.movies.hasValue() ? this.movies.value() : [];
    return moviesList.filter((movie) => {
      const matchesName = !searchedTitle || movie.title.toLowerCase().includes(searchedTitle);

      const matchesHallType =
        !selectedHallTypes.length ||
        selectedHallTypes.some((t) => movie.hallTypes?.includes(t.name));

      const matchesGenre =
        !selectedGenres.length || selectedGenres.some((g) => movie.genres?.includes(g));

      const matchesContentRating =
        !selectedContentRatings.length ||
        (movie.contentRating != null && selectedContentRatings.includes(movie.contentRating));

      return matchesName && matchesHallType && matchesGenre && matchesContentRating;
    });
  });

  protected readonly trimmedSearch = computed(() => this.search().trim());

  protected readonly hasFilters = computed(
    () =>
      this.trimmedSearch() !== '' ||
      this.selectedHallTypes().length > 0 ||
      this.selectedGenres().length > 0 ||
      this.selectedContentRatings().length > 0,
  );

  protected readonly optionDisplayFn = (option: string): string => option;

  protected readonly fetchHallTypes = () => this.hallsService.getHallTypes();

  protected readonly hallTypeDisplayFn = (type: HallType): string => type.name;

  protected readonly hallTypeValueFn = (type: HallType): string => type.id;

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected onHallTypeChange(values: HallType[]): void {
    this.selectedHallTypes.set(values);
  }

  protected onGenreChange(values: string[]): void {
    this.selectedGenres.set(values);
  }

  protected onContentRatingChange(values: string[]): void {
    this.selectedContentRatings.set(values);
  }

  protected removeHallType(value: HallType): void {
    this.selectedHallTypes.update((values) => values.filter((v) => v.id !== value.id));
  }

  protected removeGenre(value: string): void {
    this.selectedGenres.update((values) => values.filter((v) => v !== value));
  }

  protected removeContentRating(value: string): void {
    this.selectedContentRatings.update((values) => values.filter((v) => v !== value));
  }

  protected clearAll(): void {
    this.clearSearch();
    this.selectedHallTypes.set([]);
    this.selectedGenres.set([]);
    this.selectedContentRatings.set([]);
  }
}
