import { Component, computed, effect, input, output, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { differenceInSeconds } from 'date-fns';
import { ClockIcon } from '../../../shared/icons';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

@Component({
  selector: 'hold-timer',
  imports: [LucideDynamicIcon],
  templateUrl: './hold-timer.html',
  styleUrl: './hold-timer.scss',
})
export class HoldTimerComponent {
  protected readonly icons = {
    ClockIcon,
  };

  readonly expiresAt = input<string>();

  readonly expired = output<void>();

  protected readonly secondsLeft = signal<number | null>(null);

  protected readonly expiring = computed(() => {
    const seconds = this.secondsLeft();
    return seconds !== null && seconds <= 120;
  });
  protected readonly countdown = computed(() => {
    const seconds = this.secondsLeft();
    return seconds === null ? null : formatCountdown(seconds);
  });

  constructor() {
    effect((onCleanup) => {
      const expiresAt = this.expiresAt();
      if (!expiresAt) {
        this.secondsLeft.set(null);
        return;
      }

      let emitted = false;
      const tick = () => {
        const remaining = Math.max(0, differenceInSeconds(expiresAt, Date.now()));
        this.secondsLeft.set(remaining);
        if (remaining === 0 && !emitted) {
          emitted = true;
          clearInterval(id);
          this.expired.emit();
        }
      };

      tick();
      const id = setInterval(tick, 1000);
      onCleanup(() => clearInterval(id));
    });
  }
}
