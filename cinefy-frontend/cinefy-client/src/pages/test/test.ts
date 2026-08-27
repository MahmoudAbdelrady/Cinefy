import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomSelectV2 } from 'cinefy-ui/components';

interface HallOption {
  id: string;
  label: string;
}

const HALL_OPTIONS: HallOption[] = [
  { id: 't1', label: 'Hall A — IMAX' },
  { id: 't2', label: 'Hall B — Standard' },
  { id: 't3', label: 'Hall C — VIP' },
  { id: 't4', label: 'Hall D — 4DX' },
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
    hall: new FormControl<string | null>(null),
    halls: new FormControl<string[] | null>(null),
  });
}
