import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LucideDynamicIcon } from '@lucide/angular';
import { ArrowLeftIcon } from '../../shared/icons';

@Component({
  selector: 'seat-selection-page',
  imports: [RouterLink, LucideDynamicIcon],
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
}
