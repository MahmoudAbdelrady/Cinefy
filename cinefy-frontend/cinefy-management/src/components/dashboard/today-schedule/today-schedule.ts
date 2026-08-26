import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInMinutes, parse } from 'date-fns';
import { MediaImageComponent } from 'cinefy-ui/components';
import { Time12hPipe } from 'cinefy-ui/pipes';
import { CalendarIcon, ClockIcon, TicketIcon } from '../../../shared/icons';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface Screening {
  id: string;
  title: string;
  poster: string;
  hall: string;
  sold: number;
  capacity: number;
  startsAt: string;
  endsAt: string;
}

interface ScreeningState {
  running: boolean;
  startsSoon: boolean;
}

const STARTS_SOON_MINUTES = 20;

const TICK_INTERVAL_MS = 30_000;

const TIME_FORMAT = 'HH:mm';

const TODAY_SCREENINGS: Screening[] = [
  {
    id: 'sh_01',
    title: 'Wicked',
    poster:
      'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 2',
    sold: 166,
    capacity: 180,
    startsAt: '13:15',
    endsAt: '15:56',
  },
  {
    id: 'sh_02',
    title: 'Dune: Part Two',
    poster:
      'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 1',
    sold: 172,
    capacity: 220,
    startsAt: '14:00',
    endsAt: '16:46',
  },
  {
    id: 'sh_07',
    title: 'Inside Out 2',
    poster:
      'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 5',
    sold: 94,
    capacity: 140,
    startsAt: '14:50',
    endsAt: '16:26',
  },
  {
    id: 'sh_03',
    title: 'Nosferatu',
    poster:
      'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 4',
    sold: 37,
    capacity: 60,
    startsAt: '15:00',
    endsAt: '16:47',
  },
  {
    id: 'sh_04',
    title: 'Dune: Part Two',
    poster:
      'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 1',
    sold: 26,
    capacity: 220,
    startsAt: '17:30',
    endsAt: '20:16',
  },
  {
    id: 'sh_05',
    title: 'The Brutalist',
    poster:
      'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 4',
    sold: 44,
    capacity: 60,
    startsAt: '20:30',
    endsAt: '23:45',
  },
  {
    id: 'sh_06',
    title: 'Inside Out 2',
    poster:
      'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    hall: 'Hall 5',
    sold: 71,
    capacity: 140,
    startsAt: '10:30',
    endsAt: '12:06',
  },
];

@Component({
  selector: 'today-schedule',
  imports: [DashboardWidgetComponent, LucideDynamicIcon, MediaImageComponent, Time12hPipe],
  templateUrl: './today-schedule.html',
  styleUrl: './today-schedule.scss',
})
export class TodayScheduleComponent {
  protected readonly icons = {
    CalendarIcon,
    ClockIcon,
    TicketIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  protected readonly screenings = TODAY_SCREENINGS;

  private readonly now = signal(new Date());

  private readonly states = computed(() => {
    const now = this.now();

    return new Map<string, ScreeningState>(
      TODAY_SCREENINGS.map((screening) => {
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
  }

  protected stateOf(screening: Screening): ScreeningState {
    return this.states().get(screening.id) ?? { running: false, startsSoon: false };
  }
}
