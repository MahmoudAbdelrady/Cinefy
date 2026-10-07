import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { format, isFuture, isToday, isTomorrow, parseISO } from 'date-fns';
import { CinefyEmptyState, CinefyErrorState, CinefyLoadingSpinner } from 'cinefy-ui/components';
import { Time12hPipe } from 'cinefy-ui/pipes';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { BookingService } from '../../../services';
import type { HallTypeShowtimes } from '../../../shared/types';
import { CalendarIcon } from '../../../shared/icons';

interface DateOption {
  date: string;
  month: string;
  day: number;
  label: string;
}

@Component({
  selector: 'booking-section',
  imports: [
    RouterLink,
    DatePipe,
    LucideDynamicIcon,
    Time12hPipe,
    CinefyEmptyState,
    CinefyErrorState,
    CinefyLoadingSpinner,
  ],
  templateUrl: './booking-section.html',
  styleUrl: './booking-section.scss',
})
export class BookingSectionComponent {
  protected readonly icons = {
    CalendarIcon,
  };

  private readonly bookingService = inject(BookingService);

  readonly movieId = input.required<number>();

  readonly releaseDate = input<string>();

  protected readonly releaseInFuture = computed(() => {
    const releaseDate = this.releaseDate();
    return releaseDate !== undefined && isFuture(parseISO(releaseDate));
  });

  protected readonly datesResource = rxResource({
    params: () => this.movieId(),
    stream: ({ params: movieId }) =>
      this.bookingService.getBookableDates(movieId, skipServerErrorToast()),
  });

  protected readonly dates = computed<DateOption[]>(() =>
    (this.datesResource.value() ?? []).map((date) => this.buildDateOption(date)),
  );

  protected readonly activeDate = linkedSignal(() => this.datesResource.value()?.[0]);

  protected readonly showtimesResource = rxResource({
    params: () => {
      const date = this.activeDate();
      return date ? { movieId: this.movieId(), date } : undefined;
    },
    stream: ({ params }) =>
      this.bookingService.getBookableShowtimes(params.movieId, params.date, skipServerErrorToast()),
  });

  protected readonly dayShowtimes = computed<HallTypeShowtimes[]>(
    () => this.showtimesResource.value() ?? [],
  );

  protected selectDate(date: string): void {
    this.activeDate.set(date);
  }

  private buildDateOption(date: string): DateOption {
    const parsed = parseISO(date);
    return {
      date,
      month: format(parsed, 'MMM'),
      day: parsed.getDate(),
      label: this.dayLabel(parsed),
    };
  }

  private dayLabel(date: Date): string {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  }
}
