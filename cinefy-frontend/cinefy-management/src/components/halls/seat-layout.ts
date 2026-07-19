import type { Seat, SeatCategory } from '../../shared/types';

const POSITION_PATTERN = /^([A-Z]+)(\d+)$/;

export interface SeatStats {
  normal: number;
  vip: number;
  onsiteOnly: number;
  total: number;
}

export function rowLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  const repeat = Math.floor(index / 26) + 1;
  return letter.repeat(repeat);
}

export function rowLabelToIndex(label: string): number {
  const repeat = label.length;
  const letterCode = label.charCodeAt(0) - 65;
  return (repeat - 1) * 26 + letterCode;
}

export function comparePositions(a: string, b: string): number {
  const [, aRow, aCol] = a.match(POSITION_PATTERN) ?? [];
  const [, bRow, bCol] = b.match(POSITION_PATTERN) ?? [];
  const rowDiff = rowLabelToIndex(aRow) - rowLabelToIndex(bRow);
  return rowDiff !== 0 ? rowDiff : Number(aCol) - Number(bCol);
}

export function createSeatGrid(rows: number, cols: number): Seat[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'NORMAL' as SeatCategory, onsiteOnly: false })),
  );
}

export function resizeGrid(prev: Seat[][], rows: number, cols: number): Seat[][] {
  const layout: Seat[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: Seat[] = [];
    for (let j = 0; j < cols; j++) {
      if (i < prev.length && j < prev[i].length) {
        row.push(prev[i][j]);
      } else {
        row.push({ type: 'NORMAL', onsiteOnly: false });
      }
    }
    layout.push(row);
  }
  return layout;
}

export function seatStats(layout: Seat[][]): SeatStats {
  let normal = 0;
  let vip = 0;
  let onsiteOnly = 0;
  let total = 0;

  for (const row of layout) {
    for (const seat of row) {
      if (seat.type !== 'AISLE') {
        total++;
        if (seat.type === 'NORMAL') normal++;
        else if (seat.type === 'VIP') vip++;
        if (seat.onsiteOnly) onsiteOnly++;
      }
    }
  }

  return { normal, vip, onsiteOnly, total };
}
