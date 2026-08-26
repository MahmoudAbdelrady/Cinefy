import { Component, computed, signal } from '@angular/core';
import { ContactRoundIcon } from '../../../shared/icons';
import { USER_POSITION_LABELS } from '../../../shared/types';
import type { UserPosition } from '../../../shared/types';
import { DashboardWidgetComponent } from '../dashboard-widget/dashboard-widget';

interface ShiftCount {
  position: UserPosition;
  label: string;
  count: number;
}

const ON_SHIFT_COUNTS: Partial<Record<UserPosition, number>> = {
  MANAGER: 1,
  CASHIER: 2,
  USHER: 3,
};

const STAFF_TOTAL = 14;

@Component({
  selector: 'on-shift-summary',
  imports: [DashboardWidgetComponent],
  templateUrl: './on-shift-summary.html',
  styleUrl: './on-shift-summary.scss',
})
export class OnShiftSummaryComponent {
  protected readonly icons = { ContactRoundIcon };

  private readonly onShiftCounts = signal(ON_SHIFT_COUNTS);
  private readonly staffTotal = signal(STAFF_TOTAL);

  protected readonly positionCounts = computed<ShiftCount[]>(() =>
    (Object.entries(this.onShiftCounts()) as [UserPosition, number][]).map(([position, count]) => ({
      position,
      label: USER_POSITION_LABELS[position],
      count,
    })),
  );

  protected readonly subtitle = computed(() => {
    const onShift = this.positionCounts().reduce((sum, entry) => sum + entry.count, 0);
    return `${onShift} of ${this.staffTotal()} staff`;
  });
}
