import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { XIcon } from '../../../shared/icons';

@Component({
  selector: 'booking-cancelled',
  imports: [RouterLink, LucideDynamicIcon],
  templateUrl: './booking-cancelled.html',
  styleUrl: './booking-cancelled.scss',
})
export class BookingCancelledComponent {
  protected readonly icons = {
    XIcon,
  };

  readonly movieId = input.required<number | string>();
}
