import { Component, computed, input } from '@angular/core';

export type ForgotPasswordStage = 'request' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'fp-progress-dots',
  imports: [],
  templateUrl: './progress-dots.html',
  styleUrl: './progress-dots.scss',
})
export class ProgressDots {
  protected readonly steps: { stage: ForgotPasswordStage; label: string }[] = [
    { stage: 'otp', label: 'Verify' },
    { stage: 'reset', label: 'New password' },
    { stage: 'done', label: 'Done' },
  ];

  readonly stage = input.required<ForgotPasswordStage>();

  protected readonly currentIndex = computed(() =>
    this.steps.findIndex((s) => s.stage === this.stage()),
  );
}
