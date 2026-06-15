import { Component, computed, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CustomSelectComponent,
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { MoviesService } from '../../services';
import { ClapperboardIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from '../../shared/icons';

type Experience = 'Normal' | 'Imax' | '4DX' | 'Gold';

@Component({
  selector: 'movies-page',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    InputField,
    CustomSelectComponent,
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
  };

  private readonly moviesService = inject(MoviesService);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  private readonly movies = toSignal(this.moviesService.getNowShowing());

  protected readonly moviesLoading = computed(() => this.movies() === undefined);

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
    return (this.movies() ?? []).filter((movie) => {
      const matchesName = !query || movie.title.toLowerCase().includes(query);
      const matchesExperience =
        !experiences.length || experiences.some((e) => movie.experiences?.includes(e));
      const matchesGenre = !genres.length || genres.some((g) => movie.genres?.includes(g));
      const matchesContentRating =
        !contentRatings.length ||
        (movie.contentRating != null && contentRatings.includes(movie.contentRating));
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
