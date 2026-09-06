import { Component, signal, viewChild } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { Carousel } from 'primeng/carousel';
import { ChevronLeftIcon, ChevronRightIcon } from '../../shared/icons';

interface TestSlide {
  title: string;
  genre: string;
  rating: string;
}

const SLIDES: TestSlide[] = [
  { title: 'Dune: Part Three', genre: 'Sci-Fi', rating: 'PG-13' },
  { title: 'The Long Night', genre: 'Thriller', rating: 'R' },
  { title: 'Paper Cities', genre: 'Drama', rating: 'PG' },
  { title: 'Neon Harbour', genre: 'Action', rating: 'PG-13' },
  { title: 'Static Bloom', genre: 'Horror', rating: 'R' },
];

@Component({
  selector: 'test-page',
  imports: [Carousel, LucideDynamicIcon],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly icons = {
    ChevronLeftIcon,
    ChevronRightIcon,
  };

  private readonly carousel = viewChild.required(Carousel);

  protected readonly slides = SLIDES;

  protected readonly page = signal(0);

  protected prev(event: MouseEvent): void {
    this.carousel().navBackward(event);
  }

  protected next(event: MouseEvent): void {
    this.carousel().navForward(event);
  }
}
