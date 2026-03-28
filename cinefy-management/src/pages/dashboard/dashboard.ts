import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import {
  ArrowUp,
  ArrowDown,
  LucideAngularModule,
  LucideIconData,
  Ticket,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  Film,
  Plus,
  ChevronDown,
  Clock,
  LayoutTemplate,
} from 'lucide-angular';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import {
  NowShowingComponent,
  UpcomingMoviesComponent,
  TodayScheduleComponent,
} from '../../components';
import { HeaderActionsService } from '../../services';

interface DropDownMenuItem {
  icon: LucideIconData;
  label: string;
  code: string;
}

@Component({
  selector: 'dashboard-page',
  imports: [
    DatePipe,
    LucideAngularModule,
    NowShowingComponent,
    UpcomingMoviesComponent,
    TodayScheduleComponent,
    NgpButton,
    NgpMenu,
    NgpMenuItem,
    NgpMenuTrigger,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {
  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);

  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  protected currentDate = new Date();
  protected ArrowUpIcon = ArrowUp;
  protected ArrowDownIcon = ArrowDown;
  protected TicketIcon = Ticket;
  protected DollarSignIcon = DollarSign;
  protected TrendingUpIcon = TrendingUp;
  protected LayoutIcon = LayoutDashboard;
  protected FilmIcon = Film;
  protected PlusIcon = Plus;
  protected ChevronDownIcon = ChevronDown;

  protected readonly quickAddMenuItems: DropDownMenuItem[] = [
    { icon: Film, label: 'Movie', code: 'movie' },
    { icon: LayoutTemplate, label: 'Hall', code: 'hall' },
    { icon: Clock, label: 'Showtime', code: 'showtime' },
  ];

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
