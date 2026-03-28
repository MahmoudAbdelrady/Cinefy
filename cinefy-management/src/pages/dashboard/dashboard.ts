import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  ArrowUp,
  ArrowDown,
  LucideAngularModule,
  Ticket,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  Film,
} from 'lucide-angular';
import {
  NowShowingComponent,
  UpcomingMoviesComponent,
  TodayScheduleComponent,
} from '../../components';

@Component({
  selector: 'dashboard-page',
  imports: [
    DatePipe,
    LucideAngularModule,
    NowShowingComponent,
    UpcomingMoviesComponent,
    TodayScheduleComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  protected currentDate = new Date();
  protected ArrowUpIcon = ArrowUp;
  protected ArrowDownIcon = ArrowDown;
  protected TicketIcon = Ticket;
  protected DollarSignIcon = DollarSign;
  protected TrendingUpIcon = TrendingUp;
  protected LayoutIcon = LayoutDashboard;
  protected FilmIcon = Film;
}
