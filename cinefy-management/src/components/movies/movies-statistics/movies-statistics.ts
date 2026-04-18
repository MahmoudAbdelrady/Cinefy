import { Component } from '@angular/core';
import { Calendar, Clock, Film, TrendingUp } from 'lucide-angular';
import { StatsComponent } from '../../stats/stats';
import type { StatsCard } from '../../../shared/types';

@Component({
  selector: 'movies-statistics',
  imports: [StatsComponent],
  templateUrl: './movies-statistics.html',
  styleUrl: './movies-statistics.scss',
})
export class MoviesStatisticsComponent {
  protected readonly cards: StatsCard[] = [
    { label: 'Total Movies', value: '10', icon: Film },
    { label: 'Total Showtimes', value: '15', icon: Calendar },
    { label: "Today's Showtimes", value: '7', icon: Clock },
    { label: 'Upcoming This Month', value: '3', icon: TrendingUp },
  ];
}
