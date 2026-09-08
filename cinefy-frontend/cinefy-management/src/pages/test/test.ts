import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CinefyInputOtp } from 'cinefy-ui/components';

@Component({
  selector: 'test-page',
  imports: [ReactiveFormsModule, CinefyInputOtp],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class TestPage {
  protected readonly submitCount = signal(0);
  protected readonly lastSubmitted = signal('');
  protected readonly rawEnter = signal(0);
  protected readonly pseudoEnter = signal(0);
  protected readonly outputFired = signal(0);

  protected readonly code = new FormControl('', { nonNullable: true });

  protected onSubmit(): void {
    this.submitCount.update((count) => count + 1);
    this.lastSubmitted.set(this.code.value);
  }

  protected onRawKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    this.rawEnter.update((count) => count + 1);
  }
}
