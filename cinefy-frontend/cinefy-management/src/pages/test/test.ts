import { Component, signal, viewChild } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Popover } from 'primeng/popover';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
];

@Component({
  selector: 'test-page',
  imports: [ButtonDirective, Popover],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  private readonly popover = viewChild.required(Popover);

  protected readonly presets = PRESETS;

  protected readonly selectedPreset = signal(7);

  protected togglePopover(event: Event): void {
    this.popover().toggle(event);
  }

  protected selectPreset(days: number): void {
    this.selectedPreset.set(days);
    this.popover().hide();
  }
}
