import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HallSummary, Movie, ShowtimeDraft } from '../../../shared/types';
import { DatePicker } from '../../date-time/date-picker/date-picker';
import { TimePicker } from '../../date-time/time-picker/time-picker';
import { PaginatedSelectComponent } from '../../drop-down/paginated-select/paginated-select';
import { HallsService } from '../../../services';
import { NgpTextarea } from 'ng-primitives/textarea';

@Component({
  selector: 'manage-showtime-modal',
  imports: [FormsModule, DatePicker, TimePicker, PaginatedSelectComponent, NgpTextarea, DatePipe],
  templateUrl: './manage-showtime-modal.html',
  styleUrl: './manage-showtime-modal.scss',
})
export class ManageShowtimeModalComponent {
  readonly selectedMovie = input.required<Movie>();
  readonly changeMovie = output<void>();

  protected hallsService = inject(HallsService);

  protected readonly fetchHalls = (page: number, size: number, search?: string) =>
    this.hallsService.getHalls(search, { page, size });

  protected readonly hallDisplayFn = (hall: HallSummary) => hall.name;
  protected readonly hallValueFn = (hall: HallSummary) => hall.id;

  protected showtimeDate = signal<Date | undefined>(undefined);
  protected showtimeTime = signal<string | null>(null);
  protected showtimeSpecialNotes = signal('');
  protected selectedHall = signal<HallSummary | null>(null);

  readonly canSubmit = computed(
    () => !!this.showtimeDate() && !!this.showtimeTime() && !!this.selectedHall(),
  );

  protected onMovieChange() {
    this.changeMovie.emit();
  }

  protected onHallChange(hall: HallSummary | null) {
    this.selectedHall.set(hall);
  }

  submit(): ShowtimeDraft | null {
    if (!this.canSubmit()) return null;
    return {
      movieId: this.selectedMovie().id,
      date: this.showtimeDate()!,
      time: this.showtimeTime()!,
      hallId: this.selectedHall()!.id,
      specialNotes: this.showtimeSpecialNotes(),
    };
  }
}
