import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInMinutes, format, parse, startOfMinute } from 'date-fns';
import { CinefyEmptyState, CinefyLoadingSpinner, CinefyMediaImage } from 'cinefy-ui/components';
import { Time12hPipe } from 'cinefy-ui/pipes';
import { skipServerErrorToast } from 'cinefy-ui/http';
import { ShowtimesService } from '../../../services';
import { DATE_FORMAT, TIME_FORMAT } from '../../../shared/constants';
import {
  CalendarClockIcon,
  CalendarIcon,
  ClockIcon,
  TicketIcon,
  WarningIcon,
} from '../../../shared/icons';
import type { ScheduledShowtime } from '../../../shared/types';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface ScreeningState {
  running: boolean;
  startsSoon: boolean;
}

const STARTS_SOON_MINUTES = 20;

const TICK_INTERVAL_MS = 30_000;

@Component({
  selector: 'today-schedule',
  imports: [
    DashboardWidgetComponent,
    LucideDynamicIcon,
    CinefyMediaImage,
    CinefyLoadingSpinner,
    CinefyEmptyState,
    Time12hPipe,
  ],
  templateUrl: './today-schedule.html',
  styleUrl: './today-schedule.scss',
})
export class TodayScheduleComponent {
  protected readonly icons = {
    CalendarIcon,
    CalendarClockIcon,
    ClockIcon,
    TicketIcon,
    WarningIcon,
  };

  private readonly showtimesService = inject(ShowtimesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly screenings = signal<ScheduledShowtime[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  private readonly now = signal(new Date());

  private readonly states = computed(() => {
    const now = startOfMinute(this.now());

    return new Map<string, ScreeningState>(
      this.screenings().map((screening) => {
        const startsIn = differenceInMinutes(parse(screening.startsAt, TIME_FORMAT, now), now);
        const endsIn = differenceInMinutes(parse(screening.endsAt, TIME_FORMAT, now), now);

        return [
          screening.id,
          {
            running: startsIn <= 0 && endsIn > 0,
            startsSoon: startsIn > 0 && startsIn <= STARTS_SOON_MINUTES,
          },
        ];
      }),
    );
  });

  constructor() {
    const ticker = setInterval(() => this.now.set(new Date()), TICK_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(ticker));

    afterNextRender(() => this.load());
  }

  protected stateOf(screening: ScheduledShowtime): ScreeningState {
    return this.states().get(screening.id) ?? { running: false, startsSoon: false };
  }

  private load(): void {
    this.showtimesService
      .getScheduleForDate(format(new Date(), DATE_FORMAT), skipServerErrorToast())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (screenings) => {
          this.screenings.set(screenings);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }
}
