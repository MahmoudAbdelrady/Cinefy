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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, EMPTY, switchMap, tap } from 'rxjs';
import { NgpFormField } from 'ng-primitives/form-field';
import { NgpInput } from 'ng-primitives/input';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { LucideDynamicIcon } from '@lucide/angular';
import { ChevronRightIcon, ClapperboardIcon, SearchIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent, MediaImageComponent } from 'cinefy-ui/components';
import { MovieSearchResult } from '../../../shared/types';
import { SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '../../../shared/constants';
import { MoviesService } from '../../../services';

@Component({
  selector: 'movie-picker',
  imports: [
    FormsModule,
    NgpSearch,
    NgpSearchClear,
    NgpInput,
    NgpFormField,
    LucideDynamicIcon,
    LoadingSpinnerComponent,
    MediaImageComponent,
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
  };

  private readonly moviesService = inject(MoviesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly movieSelected = output<MovieSearchResult>();

  protected readonly movieSearchQuery = signal('');
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly movies = signal<MovieSearchResult[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly hasMore = computed(() => this.currentPage() < this.totalPages() - 1);

  private readonly movieSearchQuery$ = toObservable(this.movieSearchQuery);

  constructor() {
    afterNextRender(() => {
      this.movieSearchQuery$
        .pipe(
          debounceTime(SEARCH_DEBOUNCE_MS),
          distinctUntilChanged(),
          tap((query) => {
            this.currentPage.set(0);
            this.totalPages.set(0);
            if (query.length === 0) {
              this.movies.set([]);
              this.loading.set(false);
            } else {
              this.loading.set(true);
            }
          }),
          switchMap((query) => {
            if (query.length === 0) return EMPTY;
            return this.moviesService.searchMovies(query, {
              page: 0,
              size: DEFAULT_PAGE_SIZE,
            });
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
          error: () => this.loading.set(false),
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
