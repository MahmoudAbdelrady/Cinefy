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
  posterUrl?: string;
  is3D: boolean;
}

const EXPERIENCE_ORDER: Experience[] = ['Normal', 'Imax', '4DX', 'Gold'];

const PLACEHOLDER_MOVIES: MoviesPageMovie[] = [
  {
    id: 1,
    title: 'Dune: Part Two',
    genres: ['Sci-Fi', 'Adventure'],
    experience: 'Imax',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    is3D: true,
  },
  {
    id: 2,
    title: 'Oppenheimer',
    genres: ['Biography', 'Drama', 'History'],
    experience: 'Imax',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    is3D: false,
  },
  {
    id: 3,
    title: 'Furiosa: A Mad Max Saga',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    experience: '4DX',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    is3D: false,
  },
  {
    id: 4,
    title: 'Deadpool & Wolverine',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    experience: 'Gold',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    is3D: false,
  },
  {
    id: 5,
    title: 'Inside Out 2',
    genres: ['Animation', 'Adventure', 'Comedy'],
    experience: 'Normal',
    posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    is3D: false,
  },
  {
    id: 6,
    title: 'Kingdom of the Planet of the Apes',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    experience: 'Normal',
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
  protected readonly experience = signal<Experience[]>([]);
  protected readonly genre = signal<string[]>([]);

  protected readonly experiences = computed(() => {
    const present = new Set(this.movies().map((m) => m.experience));
    return EXPERIENCE_ORDER.filter((experience) => present.has(experience));
  });

  protected readonly genres = computed(() =>
    [...new Set(this.movies().flatMap((m) => m.genres))].sort(),
  );

  protected readonly filtered = computed(() => {
    const query = this.trimmedSearch().toLowerCase();
    const experiences = this.experience();
    const genres = this.genre();
    return this.movies().filter((movie) => {
      const matchesName = !query || movie.title.toLowerCase().includes(query);
      const matchesExperience = !experiences.length || experiences.includes(movie.experience);
      const matchesGenre = !genres.length || genres.some((g) => movie.genres.includes(g));
      return matchesName && matchesExperience && matchesGenre;
    });
  });

  protected readonly trimmedSearch = computed(() => this.search().trim());

  protected readonly hasFilters = computed(
    () => this.trimmedSearch() !== '' || this.experience().length > 0 || this.genre().length > 0,
  );

  protected readonly optionDisplayFn = (option: string): string => option;

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected onExperienceChange(values: Experience[]): void {
    this.experience.set(values);
  }

  protected onGenreChange(values: string[]): void {
    this.genre.set(values);
  }

  protected removeExperience(value: Experience): void {
    this.experience.update((values) => values.filter((v) => v !== value));
  }

  protected removeGenre(value: string): void {
    this.genre.update((values) => values.filter((v) => v !== value));
  }

  protected clearAll(): void {
    this.clearSearch();
    this.experience.set([]);
    this.genre.set([]);
  }
}
