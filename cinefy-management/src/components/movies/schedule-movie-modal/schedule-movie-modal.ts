import { Component, input } from '@angular/core';
import { ModalComponent } from '../../modal/modal';

@Component({
  selector: 'schedule-movie-modal',
  imports: [ModalComponent],
  templateUrl: './schedule-movie-modal.html',
  styleUrl: './schedule-movie-modal.scss',
})
export class ScheduleMovieModalComponent {
  readonly close = input.required<() => void>();
}
