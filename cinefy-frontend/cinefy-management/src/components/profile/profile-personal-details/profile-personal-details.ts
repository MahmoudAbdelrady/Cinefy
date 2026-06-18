import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import {
  AtSignIcon,
  SaveIcon,
  EditIcon,
  EmailIcon,
  PhoneIcon,
  LockIcon,
  UserIcon,
} from '../../../shared/icons';
import {
  InputField,
  LoadingSpinnerComponent,
  DEFAULT_COUNTRY,
  PhoneInput,
  phoneNumberValidator,
  toE164Digits,
  parsePhoneDigits,
  type PhoneCountryCode,
} from 'cinefy-ui/components';
import { ToastService } from 'cinefy-ui/services';
import { PhoneFormatPipe } from 'cinefy-ui/pipes';
import type { StaffMemberDetail } from '../../../shared/types';
import { NAME_PATTERN } from '../../../shared/validation';
import { StaffService } from '../../../services';

@Component({
  selector: 'profile-personal-details',
  imports: [
    ReactiveFormsModule,
    LucideDynamicIcon,
    InputField,
    PhoneInput,
    LoadingSpinnerComponent,
    PhoneFormatPipe,
  ],
  templateUrl: './profile-personal-details.html',
  styleUrl: './profile-personal-details.scss',
})
export class ProfilePersonalDetailsComponent {
  protected readonly icons = {
    EmailIcon,
    PhoneIcon,
    EditIcon,
    SaveIcon,
    AtSignIcon,
    UserIcon,
    LockIcon,
  };

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = input.required<StaffMemberDetail>();

  readonly updated = output<StaffMemberDetail>();

  protected readonly isEditing = signal(false);
  protected readonly saving = signal(false);

  protected readonly personalForm = new FormGroup({
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
    const profile = this.profile();
    this.currentFormValue();
    const value = this.personalForm.getRawValue();
    const phoneNumber = toE164Digits(this.personalForm.controls.phoneCountry, value.phoneNumber);
    return (
      value.firstName !== profile.firstName ||
      value.lastName !== profile.lastName ||
      phoneNumber !== profile.phoneNumber
    );
  });

  constructor() {
    this.personalForm.controls.phoneNumber.addValidators(
      phoneNumberValidator(this.personalForm.controls.phoneCountry),
    );
  }

  protected startEditing(): void {
    const profile = this.profile();
    const { country, nationalNumber } = parsePhoneDigits(profile.phoneNumber);
    this.personalForm.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneCountry: country,
      phoneNumber: nationalNumber,
    });
    this.isEditing.set(true);
  }

  protected cancelEditing(): void {
    this.isEditing.set(false);
  }

  protected save(): void {
    if (this.personalForm.invalid || this.saving() || !this.hasChanges()) return;

    const value = this.personalForm.getRawValue();
    this.saving.set(true);
    this.staffService
      .updateCurrentStaffMember({
        firstName: value.firstName,
        lastName: value.lastName,
        phoneNumber: toE164Digits(this.personalForm.controls.phoneCountry, value.phoneNumber),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.staffService.patchCurrentStaffMember({
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: `${profile.firstName} ${profile.lastName}`,
          });
          this.updated.emit(profile);
          this.saving.set(false);
          this.isEditing.set(false);
          this.toastService.success('Profile updated');
        },
        error: () => this.saving.set(false),
      });
  }
}
