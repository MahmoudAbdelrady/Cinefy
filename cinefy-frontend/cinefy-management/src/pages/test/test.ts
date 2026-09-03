import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';

const HALLS = [
  { id: '1', name: 'Hall A' },
  { id: '2', name: 'Hall B' },
  { id: '3', name: 'Hall C' },
  { id: '4', name: 'Hall D' },
];

@Component({
  selector: 'test-page',
  imports: [FormsModule, ButtonDirective, Dialog, Select],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly halls = HALLS;

  protected readonly visible = signal(false);

  protected selectedHall: string | null = null;
}
