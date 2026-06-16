import { Component, computed, input, linkedSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { addDays, format, isFuture, isToday, isTomorrow, parseISO } from 'date-fns';
import { Time12hPipe } from 'cinefy-ui/pipes';
import { CalendarIcon } from '../../../shared/icons';

interface ShowtimeSlot {
  id: string;
  time: string;
  is3D: boolean;
}

interface ExperienceShowtimes {
  experience: string;
  showtimes: ShowtimeSlot[];
}

interface DateOption {
  date: string;
  month: string;
  day: number;
  label: string;
}

const PLACEHOLDER_DATES: string[] = Array.from({ length: 3 }, (_, offset) =>
  format(addDays(new Date(), offset), 'yyyy-MM-dd'),
);

const PLACEHOLDER_SHOWTIMES_BY_DATE: Record<string, ExperienceShowtimes[]> = {
  [PLACEHOLDER_DATES[0]]: [
    {
      experience: 'IMAX',
      showtimes: [
        { id: 'st-0-1130', time: '11:30', is3D: true },
        { id: 'st-0-1800', time: '18:00', is3D: true },
      ],
    },
    {
      experience: 'Standard',
      showtimes: [
        { id: 'st-0-1445', time: '14:45', is3D: false },
        { id: 'st-0-2115', time: '21:15', is3D: false },
      ],
    },
  ],
  [PLACEHOLDER_DATES[1]]: [
    {
      experience: 'IMAX',
      showtimes: [{ id: 'st-1-1645', time: '16:45', is3D: true }],
    },
    {
      experience: 'Standard',
      showtimes: [{ id: 'st-1-1300', time: '13:00', is3D: false }],
    },
  ],
  [PLACEHOLDER_DATES[2]]: [
    {
      experience: 'IMAX',
      showtimes: [{ id: 'st-2-1915', time: '19:15', is3D: true }],
    },
    {
      experience: 'Standard',
      showtimes: [{ id: 'st-2-1500', time: '15:00', is3D: false }],
    },
  ],
};

@Component({
  selector: 'booking-section',
  imports: [RouterLink, DatePipe, LucideDynamicIcon, Time12hPipe],
  templateUrl: './booking-section.html',
  styleUrl: './booking-section.scss',
})
export class BookingSectionComponent {
  protected readonly icons = {
    CalendarIcon,
  };

  readonly movieId = input.required<string>();

  readonly bookingOpened = input.required<boolean>();

  readonly releaseDate = input<string>();

  protected readonly releaseInFuture = computed(() => {
    const releaseDate = this.releaseDate();
    return releaseDate !== undefined && isFuture(parseISO(releaseDate));
  });

  // TODO: replace placeholder reads with a service once the backend is ready —
  // one call for the date list (when bookingOpened), one for the active day's groups.
  protected readonly dates = computed<DateOption[]>(() =>
    this.bookingOpened() ? PLACEHOLDER_DATES.map((date) => this.buildDateOption(date)) : [],
  );

  protected readonly activeDate = linkedSignal(() => this.dates()[0]?.date);

  protected readonly dayShowtimes = computed<ExperienceShowtimes[]>(
    () => PLACEHOLDER_SHOWTIMES_BY_DATE[this.activeDate()] ?? [],
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
