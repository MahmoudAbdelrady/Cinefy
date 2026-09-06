import { Component, computed, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Carousel } from 'primeng/carousel';
import {
  ClockIcon,
  EyeIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../shared/icons';
import { MediaImageComponent } from 'cinefy-ui/components';
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
    TrailerModalComponent,
    MediaImageComponent,
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

  private readonly carousel = viewChild.required(Carousel);

  protected readonly autoAdvanceInterval = AUTO_ADVANCE_INTERVAL;

  readonly slides = input.required<HighlightedMovie[]>();

  protected readonly currentIndex = signal(0);

  protected readonly trailerSlide = signal<HighlightedMovie | null>(null);

  protected readonly hasMultipleSlides = computed(() => this.slides().length > 1);

  protected previous(event: MouseEvent): void {
    this.carousel().navBackward(event);
    this.restartAutoAdvance();
  }

  protected next(event: MouseEvent): void {
    this.carousel().navForward(event);
    this.restartAutoAdvance();
  }

  protected goTo(event: MouseEvent, index: number): void {
    this.carousel().onDotClick(event, index);
    this.restartAutoAdvance();
  }

  protected openTrailer(slide: HighlightedMovie): void {
    this.carousel().stopAutoplay();
    this.trailerSlide.set(slide);
  }

  protected closeTrailer(): void {
    this.trailerSlide.set(null);
    this.carousel().startAutoplay();
  }

  private restartAutoAdvance(): void {
    this.carousel().stopAutoplay();
    this.carousel().startAutoplay();
  }
}
