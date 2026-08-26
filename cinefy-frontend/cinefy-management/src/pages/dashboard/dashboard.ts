import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActiveGatewayComponent,
  HallsSummaryComponent,
  OnShiftSummaryComponent,
  TodayScheduleComponent,
  TodayStatisticsComponent,
} from '../../components';
import { StaffService } from '../../services';
import { canBook as canBookPosition, canManage as canManagePosition } from '../../shared/access';

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
export class DashboardPage {
  private readonly staffService = inject(StaffService);

  private readonly currentUser = toSignal(this.staffService.getCurrentStaffMember());

  protected readonly canManage = computed(() => {
    const user = this.currentUser();
    return user ? canManagePosition(user.position) : false;
  });

  protected readonly canBook = computed(() => {
    const user = this.currentUser();
    return user ? canBookPosition(user.position) : false;
  });
}
