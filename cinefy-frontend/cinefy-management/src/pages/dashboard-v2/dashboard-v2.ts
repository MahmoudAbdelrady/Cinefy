import { Component } from '@angular/core';
import { TodayStatisticsComponent } from '../../components';

@Component({
  selector: 'dashboard-v2-page',
  imports: [TodayStatisticsComponent],
  templateUrl: './dashboard-v2.html',
  styleUrl: './dashboard-v2.scss',
})
export class DashboardV2Page {}
