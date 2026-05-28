import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, EMPTY, switchMap, tap } from 'rxjs';
import { NgpButton } from 'ng-primitives/button';
import { NgpFormField } from 'ng-primitives/form-field';
import { NgpInput } from 'ng-primitives/input';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRightIcon, FilmIcon, SearchIcon } from '../../../shared/icons';
import { LoadingSpinnerComponent } from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { MovieSearchResult } from '../../../shared/types';
import { MoviesService } from '../../../services';

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
    LoadingSpinnerComponent,
    DatePipe,
  ],
  templateUrl: './movie-picker.html',
  styleUrl: './movie-picker.scss',
})
export class MoviePickerComponent {
  protected readonly icons = {
    ChevronRightIcon,
    FilmIcon,
    SearchIcon,
  };

  private readonly moviesService = inject(MoviesService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly PAGE_SIZE = 20;

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
          debounceTime(300),
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
              size: MoviePickerComponent.PAGE_SIZE,
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
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to search movies');
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
        size: MoviePickerComponent.PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.movies.update((prev) => [...prev, ...response.content]);
          this.currentPage.set(response.page.number);
          this.totalPages.set(response.page.totalPages);
          this.loadingMore.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loadingMore.set(false);
          this.toastService.error(err.error?.message ?? 'Failed to load more movies');
        },
      });
  }

  protected onPick(movie: MovieSearchResult) {
    this.movieSelected.emit(movie);
  }
}
