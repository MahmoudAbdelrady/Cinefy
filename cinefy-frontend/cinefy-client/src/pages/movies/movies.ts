import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  CuiSelect,
  EmptyStateComponent,
  InputField,
  LoadingSpinnerComponent,
  MediaImageComponent,
} from 'cinefy-ui/components';
import { HallsService, MoviesService } from '../../services';
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
    ReactiveFormsModule,
    InputField,
    CuiSelect,
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

  protected readonly filterForm = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true }),
    hallTypes: new FormControl<string[]>([], { nonNullable: true }),
    genres: new FormControl<string[]>([], { nonNullable: true }),
    contentRatings: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly movies = rxResource({
    stream: () => this.moviesService.getNowShowing(),
  });

  private readonly hallTypes = rxResource({
    stream: () => this.hallsService.getHallTypes(),
  });

  private readonly search = toSignal(this.filterForm.controls.search.valueChanges, {
    initialValue: this.filterForm.controls.search.value,
  });
  protected readonly selectedHallTypes = toSignal(this.filterForm.controls.hallTypes.valueChanges, {
    initialValue: this.filterForm.controls.hallTypes.value,
  });

  protected readonly selectedGenres = toSignal(this.filterForm.controls.genres.valueChanges, {
    initialValue: this.filterForm.controls.genres.value,
  });
  protected readonly selectedContentRatings = toSignal(
    this.filterForm.controls.contentRatings.valueChanges,
    { initialValue: this.filterForm.controls.contentRatings.value },
  );

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

  protected readonly genreEntries = this.genres.map((value) => ({ value, label: value }));
  protected readonly contentRatingEntries = this.contentRatings.map((value) => ({
    value,
    label: value,
  }));

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
        selectedHallTypes.some((id) => movie.hallTypes?.includes(this.hallTypeLabel(id)));

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

  protected readonly hallTypeEntries = computed(() =>
    (this.hallTypes.hasValue() ? this.hallTypes.value() : []).map((type) => ({
      value: type.id,
      label: type.name,
    })),
  );

  protected hallTypeLabel(id: string): string {
    return this.hallTypeEntries().find((entry) => entry.value === id)?.label ?? '';
  }

  protected clearSearch(): void {
    this.filterForm.controls.search.setValue('');
  }

  protected removeHallType(value: string): void {
    const control = this.filterForm.controls.hallTypes;
    control.setValue(control.value.filter((v) => v !== value));
  }

  protected removeGenre(value: string): void {
    const control = this.filterForm.controls.genres;
    control.setValue(control.value.filter((v) => v !== value));
  }

  protected removeContentRating(value: string): void {
    const control = this.filterForm.controls.contentRatings;
    control.setValue(control.value.filter((v) => v !== value));
  }

  protected clearAll(): void {
    this.filterForm.reset();
  }
}
