import { Component, computed, effect, input, InputSignal, output, signal } from "@angular/core";
import { LucideDynamicIcon } from "@lucide/angular";
import { differenceInSeconds } from "date-fns";
import { ClockIcon } from "../icons";

const EXPIRING_THRESHOLD_SECONDS = 120;

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

@Component({
  selector: "cui-hold-timer",
  imports: [LucideDynamicIcon],
  templateUrl: "./cinefy-hold-timer.html",
  styleUrl: "./cinefy-hold-timer.scss",
})
export class CinefyHoldTimer {
  protected readonly icons = {
    ClockIcon,
  };

  readonly expiresAt: InputSignal<string | undefined> = input<string>();

  readonly expired = output<void>();

  protected readonly secondsLeft = signal<number | null>(null);

  protected readonly expiring = computed(() => {
    const seconds = this.secondsLeft();
    return seconds !== null && seconds <= EXPIRING_THRESHOLD_SECONDS;
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
