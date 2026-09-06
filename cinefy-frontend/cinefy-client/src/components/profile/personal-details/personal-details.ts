import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  DEFAULT_COUNTRY,
  CinefyInput,
  LoadingSpinnerComponent,
  parsePhoneDigits,
  PhoneInput,
  phoneNumberValidator,
  toE164Digits,
  type PhoneCountryCode,
} from 'cinefy-ui/components';
import { PhoneFormatPipe } from 'cinefy-ui/pipes';
import { CinefyToastService } from 'cinefy-ui/services';
import { ClientService } from '../../../services';
import { EmailIcon, PhoneIcon, UserIcon } from '../../../shared/icons';
import { NAME_PATTERN } from '../../../shared/validation';
import type { CurrentUser, UpdateProfilePayload } from '../../../shared/types';

@Component({
  selector: 'personal-details',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    CinefyInput,
    PhoneInput,
    LoadingSpinnerComponent,
    PhoneFormatPipe,
  ],
  templateUrl: './personal-details.html',
  styleUrl: './personal-details.scss',
})
export class PersonalDetailsComponent {
  protected readonly icons = {
    UserIcon,
    EmailIcon,
    PhoneIcon,
  };

  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(CinefyToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = signal<CurrentUser | null>(null);
  protected readonly loading = signal(true);
  protected readonly isEditing = signal(false);
  protected readonly saving = signal(false);
  private readonly initialFormSnapshot = signal<string | null>(null);

  protected readonly personalForm = new FormGroup({
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN),
      ],
    }),
    phoneCountry: new FormControl<PhoneCountryCode>(DEFAULT_COUNTRY, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly currentFormValue = toSignal(this.personalForm.valueChanges, {
    initialValue: this.personalForm.getRawValue(),
  });

  protected readonly hasChanges = computed(() => {
    const snapshot = this.initialFormSnapshot();
    if (snapshot === null) return true;
    this.currentFormValue();
    return JSON.stringify(this.personalForm.getRawValue()) !== snapshot;
  });

  constructor() {
    this.personalForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.personalForm.controls.phoneCountry),
    );
    afterNextRender(() => this.loadCurrentUser());
  }

  private loadCurrentUser(): void {
    this.clientService
      .getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected startEditing(): void {
    const user = this.currentUser();
    if (!user) return;

    const { country, nationalNumber } = parsePhoneDigits(user.phoneNumber);
    this.personalForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneCountry: country,
      phoneNumber: nationalNumber,
    });
    this.personalForm.markAllAsTouched();
    this.initialFormSnapshot.set(JSON.stringify(this.personalForm.getRawValue()));
    this.isEditing.set(true);
  }

  protected cancelEditing(): void {
    this.isEditing.set(false);
  }

  protected save(): void {
    if (this.personalForm.invalid || this.saving() || !this.hasChanges()) return;

    const { firstName, lastName, phoneNumber } = this.personalForm.getRawValue();
    const payload: UpdateProfilePayload = {
      firstName,
      lastName,
      phoneNumber: toE164Digits(this.personalForm.controls.phoneCountry, phoneNumber),
    };

    this.saving.set(true);
    this.clientService
      .updateCurrentUser(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.saving.set(false);
          this.isEditing.set(false);
          this.toastService.success('Profile updated');
        },
        error: () => this.saving.set(false),
      });
  }
}
