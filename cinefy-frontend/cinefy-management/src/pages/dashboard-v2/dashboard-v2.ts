import { Component } from '@angular/core';
import {
  HallsSummaryComponent,
  TodayScheduleV2Component,
  TodayStatisticsComponent,
} from '../../components';

@Component({
  selector: 'dashboard-v2-page',
  imports: [TodayStatisticsComponent, TodayScheduleV2Component, HallsSummaryComponent],
  templateUrl: './dashboard-v2.html',
  styleUrl: './dashboard-v2.scss',
})
export class DashboardV2Page {}
