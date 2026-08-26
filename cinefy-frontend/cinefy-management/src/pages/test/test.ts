import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { DatePicker } from 'primeng/datepicker';
import { ClockIcon } from '../../shared/icons';

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, DatePicker, LucideDynamicIcon],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly icons = {
    ClockIcon,
  };

  protected readonly pickerForm = new FormGroup({
    date: new FormControl<Date | null>(null),
    time: new FormControl<Date | null>(null),
  });
}
