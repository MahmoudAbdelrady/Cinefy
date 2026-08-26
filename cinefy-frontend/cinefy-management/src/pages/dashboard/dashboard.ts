import { Component } from '@angular/core';
import {
  ActiveGatewayComponent,
  HallsSummaryComponent,
  OnShiftSummaryComponent,
  TodayScheduleComponent,
  TodayStatisticsComponent,
} from '../../components';

@Component({
  selector: 'dashboard-page',
  imports: [
    TodayStatisticsComponent,
    TodayScheduleComponent,
    HallsSummaryComponent,
    ActiveGatewayComponent,
    OnShiftSummaryComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {}
