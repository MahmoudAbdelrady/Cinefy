import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CuiSelect } from 'cinefy-ui/components';

interface HallOption {
  id: string;
  label: string;
  shortLabel: string;
}

const HALL_OPTIONS: HallOption[] = [
  { id: 't1', label: 'Hall A — IMAX', shortLabel: 'HAI' },
  { id: 't2', label: 'Hall B — Standard', shortLabel: 'HAB' },
  { id: 't3', label: 'Hall C — VIP', shortLabel: 'HAV' },
  { id: 't4', label: 'Hall D — 4DX', shortLabel: 'HA4D' },
];

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, CuiSelect],
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
