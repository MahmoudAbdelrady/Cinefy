import { afterNextRender, Component, computed, input, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpDialogTrigger } from 'ng-primitives/dialog';
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

@Component({
  selector: 'featured-carousel',
  imports: [
    RouterLink,
    LucideAngularModule,
    NgpButton,
    NgpDialogTrigger,
    TrailerModalComponent,
    MediaImageComponent,
    DurationPipe,
  ],
  templateUrl: './featured-carousel.html',
  styleUrl: './featured-carousel.scss',
})
export class FeaturedCarouselComponent implements OnDestroy {
  protected readonly icons = {
    ClockIcon,
    EyeIcon,
    PlayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
  };

  private static readonly AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds
  private static readonly SWIPE_THRESHOLD = 20; // 20 pixels

  readonly slides = input.required<HighlightedMovie[]>();

  protected readonly currentIndex = signal(0);

  protected readonly currentSlide = computed(() => this.slides()[this.currentIndex()]);

  private intervalId?: ReturnType<typeof setInterval>;

  private touchStartX?: number;

  constructor() {
    afterNextRender(() => this.startAutoAdvance());
  }

  public ngOnDestroy(): void {
    this.stopAutoAdvance();
  }

  protected next(): void {
    this.goTo((this.currentIndex() + 1) % this.slides().length);
  }

  protected previous(): void {
    this.goTo((this.currentIndex() - 1 + this.slides().length) % this.slides().length);
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === undefined) return;
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = undefined;
    if (Math.abs(deltaX) < FeaturedCarouselComponent.SWIPE_THRESHOLD) return; // if distance is less than threshold pixels, ignore it
    if (deltaX < 0) this.next();
    else this.previous();
  }

  protected goTo(index: number): void {
    this.currentIndex.set(index);
    this.restartAutoAdvance();
  }

  private startAutoAdvance(): void {
    this.intervalId = setInterval(
      () => this.currentIndex.update((index) => (index + 1) % this.slides().length),
      FeaturedCarouselComponent.AUTO_ADVANCE_INTERVAL,
    );
  }

  protected restartAutoAdvance(): void {
    this.stopAutoAdvance();
    this.startAutoAdvance();
  }

  protected stopAutoAdvance(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
