import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  ChevronRightIcon,
  ClockIcon,
  LayoutIcon,
  TicketIcon,
} from '../../../shared/icons';
import { RouterLink } from '@angular/router';

interface TodayScheduleMovie {
  poster: string;
  title: string;
  hall: string;
  ticketsSold: string;
  durationInterval: string;
  status: string;
}

@Component({
  selector: 'today-schedule-component',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './today-schedule.html',
  styleUrl: './today-schedule.scss',
})
export class TodayScheduleComponent {
  protected readonly icons = {
    ChevronRightIcon,
    ClockIcon,
    LayoutIcon,
    TicketIcon,
  };
  protected todayScheduleMovies: TodayScheduleMovie[] = [
    {
      poster:
        'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'The Matrix Resurrections',
      hall: 'Hall 1',
      ticketsSold: '120/150',
      durationInterval: '14:30 - 16:45',
      status: 'In Progress',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Dune: Part Two',
      hall: 'Hall 2',
      ticketsSold: '100/150',
      durationInterval: '15:00 - 17:30',
      status: 'Upcoming',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1758232589439-f5ec09dc92c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Spider-Man: No Way Home',
      hall: 'Hall 3',
      ticketsSold: '80/150',
      durationInterval: '16:00 - 18:20',
      status: 'Upcoming',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1753944847480-92f369a5f00e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'Avatar: The Way of Water',
      hall: 'Hall 4',
      ticketsSold: '60/150',
      durationInterval: '18:30 - 21:15',
      status: 'Upcoming',
    },
    {
      poster:
        'https://images.unsplash.com/photo-1618410321132-9f4cebb2f7f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      title: 'The Dark Knight Returns',
      hall: 'Hall 5',
      ticketsSold: '40/150',
      durationInterval: '19:00 - 21:30',
      status: 'Upcoming',
    },
  ];
}
