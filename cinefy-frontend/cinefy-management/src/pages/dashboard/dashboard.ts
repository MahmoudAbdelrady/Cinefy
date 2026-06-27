import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { LucideDynamicIcon, LucideIcon } from '@lucide/angular';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ClockIcon,
  DollarSignIcon,
  ClapperboardIcon,
  LayoutIcon,
  LayoutTemplateIcon,
  PlusIcon,
  TicketIcon,
  TrendingUpIcon,
} from '../../shared/icons';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';
import {
  NowShowingComponent,
  UpcomingMoviesWidgetComponent,
  TodayScheduleComponent,
} from '../../components';
import { HeaderActionsService } from '../../services';

interface DropDownMenuItem {
  icon: LucideIcon;
  label: string;
  code: string;
}

@Component({
  selector: 'dashboard-page',
  imports: [
    DatePipe,
    LucideDynamicIcon,
    NowShowingComponent,
    UpcomingMoviesWidgetComponent,
    TodayScheduleComponent,
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
    ClapperboardIcon,
    LayoutIcon,
    PlusIcon,
    TicketIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    TrendingUpIcon,
  };
  private headerActions = inject(HeaderActionsService);
  private destroyRef = inject(DestroyRef);

  private headerActionsTemplate = viewChild.required<TemplateRef<unknown>>('headerActionsTemplate');

  protected currentDate = new Date();

  protected readonly quickAddMenuItems: DropDownMenuItem[] = [
    { icon: ClapperboardIcon, label: 'Movie', code: 'movie' },
    { icon: LayoutTemplateIcon, label: 'Hall', code: 'hall' },
    { icon: ClockIcon, label: 'Showtime', code: 'showtime' },
  ];

  ngOnInit() {
    this.headerActions.template.set(this.headerActionsTemplate());
    this.destroyRef.onDestroy(() => this.headerActions.template.set(null));
  }
}
