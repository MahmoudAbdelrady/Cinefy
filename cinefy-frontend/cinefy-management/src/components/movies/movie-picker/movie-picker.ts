import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, EMPTY, startWith, switchMap, tap } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChevronRightIcon, ClapperboardIcon, SearchIcon, WarningIcon } from '../../../shared/icons';
import {
  CinefyEmptyState,
  CinefyInput,
  CinefyLoadingSpinner,
  CinefyMediaImage,
} from 'cinefy-ui/components';
import { MovieSearchResult } from '../../../shared/types';
import { SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '../../../shared/constants';
import { skipServerErrorToast } from '../../../app/core/interceptors';
import { MoviesService } from '../../../services';

@Component({
  selector: 'movie-picker',
  imports: [
    CinefyInput,
    LucideDynamicIcon,
    CinefyLoadingSpinner,
    CinefyEmptyState,
    CinefyMediaImage,
    DatePipe,
  ],
  templateUrl: './movie-picker.html',
  styleUrl: './movie-picker.scss',
})
export class MoviePickerComponent {
  protected readonly icons = {
    ChevronRightIcon,
    ClapperboardIcon,
    SearchIcon,
    WarningIcon,
  };

  private readonly moviesService = inject(MoviesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly movieSelected = output<MovieSearchResult>();

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });

  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly movies = signal<MovieSearchResult[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly movieSearchQuery = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
    { initialValue: '' },
  );

  protected readonly hasMore = computed(() => this.currentPage() < this.totalPages() - 1);

  constructor() {
    afterNextRender(() => {
      this.searchControl.valueChanges
        .pipe(
          startWith(this.searchControl.value),
          debounceTime(SEARCH_DEBOUNCE_MS),
          distinctUntilChanged(),
          tap((query) => {
            this.currentPage.set(0);
            this.totalPages.set(0);
            this.failed.set(false);
            if (query.length === 0) {
              this.movies.set([]);
              this.loading.set(false);
            } else {
              this.loading.set(true);
            }
          }),
          switchMap((query) => {
            if (query.length === 0) return EMPTY;
            return this.moviesService.searchMovies(
              query,
              { page: 0, size: DEFAULT_PAGE_SIZE },
              skipServerErrorToast(),
            );
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            this.movies.set(response.content);
            this.currentPage.set(response.page.number);
            this.totalPages.set(response.page.totalPages);
            this.loading.set(false);
          },
          error: () => {
            this.failed.set(true);
            this.loading.set(false);
          },
        });
    });
  }

  protected loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    this.moviesService
      .searchMovies(this.movieSearchQuery(), {
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.movies.update((prev) => [...prev, ...response.content]);
          this.currentPage.set(response.page.number);
          this.totalPages.set(response.page.totalPages);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  protected onPick(movie: MovieSearchResult) {
    this.movieSelected.emit(movie);
  }
}
