import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Carousel, CarouselContent, CarouselItem } from 'primeng/carousel';
import {
  ClockIcon,
  EyeIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../shared/icons';
import { CinefyMediaImage } from 'cinefy-ui/components';
import { DurationPipe } from 'cinefy-ui/pipes';
import { HighlightedMovie } from '../../../shared/types';
import { TrailerModalComponent } from '../../movies/trailer-modal/trailer-modal';

const AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds

@Component({
  selector: 'featured-carousel',
  imports: [
    RouterLink,
    LucideDynamicIcon,
    Carousel,
    CarouselContent,
    CarouselItem,
    TrailerModalComponent,
    CinefyMediaImage,
    DurationPipe,
  ],
  templateUrl: './featured-carousel.html',
  styleUrl: './featured-carousel.scss',
})
export class FeaturedCarouselComponent {
  protected readonly icons = {
    ClockIcon,
    EyeIcon,
    PlayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  private readonly carousel = viewChild.required(Carousel);

  readonly slides = input.required<HighlightedMovie[]>();

  protected readonly currentIndex = signal(0);

  protected readonly trailerSlide = signal<HighlightedMovie | null>(null);

  protected readonly hasMultipleSlides = computed(() => this.slides().length > 1);

  private autoAdvanceTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => this.startAutoAdvance());
    this.destroyRef.onDestroy(() => this.stopAutoAdvance());
  }

  protected previous(): void {
    this.carousel().prev();
    this.startAutoAdvance();
  }

  protected next(): void {
    this.carousel().next();
    this.startAutoAdvance();
  }

  protected goTo(index: number): void {
    this.carousel().scrollToPage(index);
    this.startAutoAdvance();
  }

  protected openTrailer(slide: HighlightedMovie): void {
    this.stopAutoAdvance();
    this.trailerSlide.set(slide);
  }

  protected closeTrailer(): void {
    this.trailerSlide.set(null);
    this.startAutoAdvance();
  }

  private startAutoAdvance(): void {
    if (!this.hasMultipleSlides()) return;

    this.stopAutoAdvance();
    this.autoAdvanceTimer = setInterval(() => this.carousel().next(), AUTO_ADVANCE_INTERVAL);
  }

  private stopAutoAdvance(): void {
    if (!this.autoAdvanceTimer) return;

    clearInterval(this.autoAdvanceTimer);
    this.autoAdvanceTimer = null;
  }
}
