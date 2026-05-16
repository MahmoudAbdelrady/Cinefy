import { Component } from '@angular/core';
import { STAFF_POSITION_LABELS, StaffPosition } from '../../../shared/types';

interface PositionCoverageResult {
  total: number;
  positions: PositionCoverageItem[];
}

interface PositionCoverageItem {
  position: StaffPosition;
  count: number;
}

@Component({
  selector: 'staff-position-coverage',
  imports: [],
  templateUrl: './staff-position-coverage.html',
  styleUrl: './staff-position-coverage.scss',
})
export class StaffPositionCoverageComponent {
  protected readonly positionCoverageItems: PositionCoverageResult = {
    total: 6,
    positions: [
      { position: 'MANAGER', count: 1 },
      { position: 'CASHIER', count: 1 },
      { position: 'CASHIER', count: 2 },
      { position: 'USHER', count: 1 },
      { position: 'USHER', count: 1 },
    ],
  };

  protected readonly positionLabels = STAFF_POSITION_LABELS;

  protected percentage(count: number): number {
    const total = this.positionCoverageItems.total;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }
}
