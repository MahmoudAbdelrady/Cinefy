import { afterNextRender, Component, computed, OnDestroy, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  ClockIcon,
  RatingIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../shared/icons';
import { HighlightedMovie } from '../../../shared/types';

@Component({
  selector: 'featured-carousel',
  imports: [LucideAngularModule],
  templateUrl: './featured-carousel.html',
  styleUrl: './featured-carousel.scss',
})
export class FeaturedCarouselComponent implements OnDestroy {
  protected readonly icons = {
    ClockIcon,
    RatingIcon,
    PlayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
  };

  protected readonly slides: HighlightedMovie[] = [
    {
      bookingOpened: true,
      movieDetails: {
        id: 693134,
        title: 'Dune: Part Two',
        synopsis:
          'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
        genre: 'Sci-Fi, Adventure',
        contentRating: 'PG-13',
        releaseDate: '2024-02-27',
        duration: 166,
        posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
      },
    },
    {
      bookingOpened: true,
      movieDetails: {
        id: 872585,
        title: 'Oppenheimer',
        synopsis:
          'The story of J. Robert Oppenheimer, the American theoretical physicist credited with being the father of the atomic bomb for his role in the Manhattan Project, the World War II undertaking that developed the first nuclear weapons.',
        genre: 'Biography, Drama, History',
        contentRating: 'R',
        releaseDate: '2023-07-21',
        duration: 181,
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      },
    },
    {
      bookingOpened: false,
      movieDetails: {
        id: 786892,
        title: 'Furiosa: A Mad Max Saga',
        synopsis:
          'As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde led by the Warlord Dementus. Sweeping through the Wasteland, they come across the Citadel presided over by The Immortan Joe.',
        genre: 'Action, Adventure, Sci-Fi',
        contentRating: 'R',
        releaseDate: '2024-05-22',
        duration: 148,
        posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/jBNuxFsHySrHl4VWHjMtUvgPFcq.jpg',
      },
    },
    {
      bookingOpened: true,
      movieDetails: {
        id: 533535,
        title: 'Deadpool & Wolverine',
        synopsis:
          'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
        genre: 'Action, Comedy, Sci-Fi',
        contentRating: 'R',
        releaseDate: '2024-07-24',
        duration: 128,
        posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
      },
    },
  ];

  protected readonly currentIndex = signal(0);

  protected readonly currentSlide = computed(() => this.slides[this.currentIndex()]);

  protected readonly runtimeLabel = computed(() =>
    this.formatRuntime(this.currentSlide().movieDetails.duration),
  );

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    afterNextRender(() => this.startAutoAdvance());
  }

  public ngOnDestroy(): void {
    this.stopAutoAdvance();
  }

  protected next(): void {
    this.goTo((this.currentIndex() + 1) % this.slides.length);
  }

  protected previous(): void {
    this.goTo((this.currentIndex() - 1 + this.slides.length) % this.slides.length);
  }

  protected goTo(index: number): void {
    this.currentIndex.set(index);
    this.restartAutoAdvance();
  }

  private startAutoAdvance(): void {
    this.intervalId = setInterval(
      () => this.currentIndex.update((index) => (index + 1) % this.slides.length),
      5000,
    );
  }

  private restartAutoAdvance(): void {
    this.stopAutoAdvance();
    this.startAutoAdvance();
  }

  private stopAutoAdvance(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private formatRuntime(minutes?: number): string | undefined {
    if (minutes === undefined || minutes === null) return undefined;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
