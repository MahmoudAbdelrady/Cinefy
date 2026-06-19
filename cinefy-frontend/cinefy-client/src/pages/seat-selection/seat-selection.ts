import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { SeatMapComponent } from '../../components';
import { ArrowLeftIcon } from '../../shared/icons';
import type { Seat, SeatKind, SeatLayout, SeatLayoutResponse } from '../../shared/types';

// TODO: placeholder seat layout — replace with the real seat-layout endpoint once
// the backend exposes one. `buildHall` is the production mapping; only MOCK_LAYOUT
// is throwaway.
const MOCK_LAYOUT: SeatLayoutResponse = {
  numberOfRows: 6,
  seatsPerRow: 7,
  layout: {
    categories: {
      AISLE: ['B2', 'B6', 'B7', 'B1', 'A7', 'A1', 'A6', 'A2'],
      VIP: ['E2', 'F3', 'E7', 'E4', 'F7', 'E5', 'E6', 'F4', 'F5', 'E3', 'F2', 'F6', 'E1', 'F1'],
    },
    onSiteOnly: ['D2', 'D3', 'F6'],
    reserved: ['F7', 'D1', 'F5'],
  },
};

function seatKind(id: string, layout: SeatLayout): SeatKind {
  if (layout.categories.AISLE?.includes(id)) return 'AISLE';
  if (layout.reserved.includes(id) || layout.onSiteOnly.includes(id)) return 'TAKEN';
  if (layout.categories.VIP?.includes(id)) return 'VIP';
  return 'NORMAL';
}

function buildHall(response: SeatLayoutResponse): Seat[][] {
  const { numberOfRows, seatsPerRow, layout } = response;
  return Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const row = String.fromCharCode(65 + rowIdx);
    return Array.from({ length: seatsPerRow }, (_, c) => {
      const number = c + 1;
      const id = `${row}${number}`;
      return { id, row, number, kind: seatKind(id, layout) };
    });
  });
}

@Component({
  selector: 'seat-selection-page',
  imports: [RouterLink, LucideDynamicIcon, SeatMapComponent],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelectionPage {
  protected readonly icons = {
    ArrowLeftIcon,
  };

  private readonly route = inject(ActivatedRoute);

  protected readonly movieId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('movieId')))),
  );

  // TODO: no "get showtime by id" endpoint yet — date/hall/format are placeholders
  // until the backend exposes a showtime-detail contract.
  protected readonly showtimeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('showtimeId'))),
  );

  protected readonly hall = buildHall(MOCK_LAYOUT);
}
