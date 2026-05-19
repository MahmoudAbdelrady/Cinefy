import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Film,
  LayoutTemplate,
  LucideAngularModule,
  LucideIconData,
  TrendingUp,
} from 'lucide-angular';
import {
  ChevronDownIcon,
  DollarSignIcon,
  FilmIcon,
  LayoutIcon,
  PlusIcon,
  TicketIcon,
} from '../../shared/icons';
import { NgpButton } from 'ng-primitives/button';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import {
  NowShowingComponent,
  UpcomingMoviesWidgetComponent,
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
    UpcomingMoviesWidgetComponent,
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
  protected readonly icons = {
    ChevronDownIcon,
    DollarSignIcon,
    FilmIcon,
    LayoutIcon,
    PlusIcon,
    TicketIcon,
    ArrowUpIcon: ArrowUp,
    ArrowDownIcon: ArrowDown,
    TrendingUpIcon: TrendingUp,
  };
  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);

  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  protected currentDate = new Date();

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
