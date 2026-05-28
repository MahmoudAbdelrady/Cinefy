import { Component, computed, DestroyRef, effect, inject, input, type InputSignal, signal } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideAngularModule } from "lucide-angular";
import { ChevronDownIcon, ChevronUpIcon, ClockIcon } from "../../icons";
import { NgpButton } from "ng-primitives/button";
import { NgpPopover, NgpPopoverTrigger } from "ng-primitives/popover";
import { FieldErrorComponent } from "../../field-error/field-error";

type Period = "AM" | "PM";

const pad = (n: number) => n.toString().padStart(2, "0");

@Component({
  selector: "time-picker",
  imports: [LucideAngularModule, NgpButton, NgpPopover, NgpPopoverTrigger, FieldErrorComponent],
  templateUrl: "./time-picker.html",
  styleUrl: "./time-picker.scss",
})
export class TimePicker {
  protected readonly icons = {
    ChevronDownIcon,
    ClockIcon,
    ChevronUpIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  readonly control: InputSignal<FormControl<string | null>> = input.required<FormControl<string | null>>();
  readonly hint: InputSignal<string | null> = input<string | null>(null);
  readonly errorMessages = input<Record<string, string>>({});

  private readonly value = signal<string | null>(null);

  protected readonly parts = computed(() => {
    const value = this.value();
    if (!value) return { hour24: 0, minute: 0, hasValue: false };
    const [h, m] = value.split(":").map(Number);
    return { hour24: h, minute: m, hasValue: true };
  });

  protected readonly hour12 = computed(() => {
    const h = this.parts().hour24;
    const mod = h % 12;
    return mod === 0 ? 12 : mod;
  });

  protected readonly period = computed<Period>(() => (this.parts().hour24 < 12 ? "AM" : "PM"));

  protected readonly displayLabel = computed(() => {
    const { hour24, minute, hasValue } = this.parts();
    if (!hasValue) return "";
    const mod = hour24 % 12;
    const h12 = mod === 0 ? 12 : mod;
    return `${h12}:${pad(minute)} ${hour24 < 12 ? "AM" : "PM"}`;
  });

  protected get required(): boolean {
    const c = this.control();
    return c.hasValidator(Validators.required) && c.enabled;
  }

  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      this.value.set(c.value);
      const sub = c.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
        this.value.set(v);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onHourInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, "").slice(0, 2);
    if (el.value !== digits) {
      el.value = digits;
    }
  }

  protected onHourBlur(event: Event) {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, "");
    if (!digits) {
      el.value = this.hour12().toString().padStart(2, "0");
      return;
    }
    const h12 = Math.max(1, Math.min(12, Number(digits)));
    this.commit(this.to24(h12, this.period()), this.parts().minute);
  }

  protected onMinuteInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, "").slice(0, 2);
    if (el.value !== digits) {
      el.value = digits;
    }
  }

  protected onMinuteBlur(event: Event) {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, "");
    if (!digits) {
      el.value = this.parts().minute.toString().padStart(2, "0");
      return;
    }
    const minute = Math.max(0, Math.min(59, Number(digits)));
    this.commit(this.parts().hour24, minute);
  }

  protected stepHour(delta: number) {
    const next = ((this.hour12() - 1 + delta + 12) % 12) + 1;
    this.commit(this.to24(next, this.period()), this.parts().minute);
  }

  protected stepMinute(delta: number) {
    const next = (this.parts().minute + delta + 60) % 60;
    this.commit(this.parts().hour24, next);
  }

  protected setPeriod(next: Period) {
    if (next === this.period()) return;
    const h = this.parts().hour24;
    this.commit(next === "AM" ? h - 12 : h + 12, this.parts().minute);
  }

  private commit(hour24: number, minute: number) {
    const value = `${pad(hour24)}:${pad(minute)}`;
    const c = this.control();
    c.setValue(value);
    c.markAsDirty();
    c.markAsTouched();
  }

  private to24(h12: number, period: Period): number {
    if (period === "AM") return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
  }
}
