import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButton } from 'primeng/radiobutton';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
];

const SHIFTS = [
  { value: 'MORNING', label: 'Morning', hint: '08:00 — 16:00' },
  { value: 'EVENING', label: 'Evening', hint: '16:00 — 00:00' },
  { value: 'NIGHT', label: 'Night', hint: '00:00 — 08:00' },
];

@Component({
  selector: 'test-page',
  imports: [FormsModule, RadioButton],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly employmentTypes = EMPLOYMENT_TYPES;
  protected readonly shifts = SHIFTS;

  protected employmentType = 'FULL_TIME';
  protected shift = 'MORNING';
}
