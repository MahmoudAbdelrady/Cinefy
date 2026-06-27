import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { LucideDynamicIcon } from "@lucide/angular";
import { CircleCheckIcon } from "../icons";

@Component({
  selector: "password-checklist",
  imports: [LucideDynamicIcon],
  templateUrl: "./password-checklist.html",
  styleUrl: "./password-checklist.scss",
})
export class PasswordChecklist implements OnInit {
  protected readonly icons = {
    CircleCheckIcon,
  };

  private readonly destroyRef = inject(DestroyRef);

  readonly control = input.required<FormControl<string>>();

  private readonly value = signal("");

  protected readonly checks = computed(() => {
    const pw = this.value();
    return [
      { ok: pw.length >= 8, label: "At least 8 characters" },
      { ok: /[a-z]/.test(pw), label: "One lowercase letter" },
      { ok: /[A-Z]/.test(pw), label: "One uppercase letter" },
      { ok: /[0-9]/.test(pw), label: "One number" },
      { ok: /[^A-Za-z0-9]/.test(pw), label: "One special character" },
    ];
  });

  ngOnInit(): void {
    const control = this.control();
    this.value.set(control.value);
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.value.set(value));
  }
}
