import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomSelectV2 } from 'cinefy-ui/components';

interface HallOption {
  id: string;
  label: string;
  short: string;
  value: string;
}

const HALL_OPTIONS: HallOption[] = [
  { id: 't1', label: 'Hall A — IMAX', short: 'A', value: 'hall-a' },
  { id: 't2', label: 'Hall B — Standard', short: 'B', value: 'hall-b' },
  { id: 't3', label: 'Hall C — VIP', short: 'C', value: 'hall-c' },
  { id: 't4', label: 'Hall D — 4DX', short: 'D', value: 'hall-d' },
];

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, CustomSelectV2],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly hallOptions = HALL_OPTIONS;

  protected readonly selectForm = new FormGroup({
    hall: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    halls: new FormControl<string[] | null>(null),
  });
}
