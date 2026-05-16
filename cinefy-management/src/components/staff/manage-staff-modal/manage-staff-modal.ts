import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AtSign, Check, KeyRound, LucideAngularModule, Mail, Phone, User } from 'lucide-angular';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { ModalComponent } from '../../modal/modal';
import { InputField } from '../../input-field/input-field';
import { FieldErrorComponent } from '../../field-error/field-error';
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type EmploymentType,
  type StaffMemberDetail,
  type StaffMemberPayload,
  type StaffMemberSummary,
  type StaffPosition,
  type WeekDay,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { TimePicker } from '../../date-time/time-picker/time-picker';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const NAME_PATTERN = /^\p{L}+([ '\-]\p{L}+)*$/u;
const USERNAME_PATTERN = /^[a-z](?:[a-z0-9]|[._-](?=[a-z0-9]))*$/;
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  return PASSWORD_PATTERN.test(value) ? null : { passwordStrength: true };
}

@Component({
  selector: 'manage-staff-modal',
  imports: [
    ModalComponent,
    InputField,
    CustomSelectComponent,
    FieldErrorComponent,
    LucideAngularModule,
    NgpRadioGroup,
    NgpRadioItem,
    ReactiveFormsModule,
    TimePicker,
    LoadingSpinnerComponent,
  ],
  templateUrl: './manage-staff-modal.html',
  styleUrl: './manage-staff-modal.scss',
})
export class ManageStaffModalComponent {
  protected readonly CheckIcon = Check;
  protected readonly NameIcon = User;
  protected readonly UsernameIcon = AtSign;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly KeyIcon = KeyRound;
  protected readonly EMPLOYMENT_TYPE_LABELS = EMPLOYMENT_TYPE_LABELS;

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();
  readonly staffMemberId = input<string | null>(null);
  readonly selectedStaffMember = input<StaffMemberDetail | null>(null);
  readonly saved = output<{ member: StaffMemberSummary; isEdit: boolean }>();

  protected readonly resolvedStaffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly isEdit = computed(
    () => this.selectedStaffMember() !== null || this.staffMemberId() !== null,
  );

  protected readonly modalTitle = computed(() => {
    if (!this.isEdit()) return 'Add staff member';
    const member = this.resolvedStaffMember();
    return member ? `Edit ${member.firstName} ${member.lastName} info` : 'Edit staff member';
  });

  protected readonly modalDescription = computed(() =>
    this.isEdit()
      ? 'Update the details for this staff member.'
      : 'Add a new team member to manage Cinefy.',
  );

  protected readonly staffPositions = Object.keys(STAFF_POSITION_LABELS) as StaffPosition[];
  protected readonly weekDays = Object.keys(WEEK_DAY_LABELS) as WeekDay[];

  protected readonly employmentTypeEntries = Object.entries(EMPLOYMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value: value as EmploymentType, label }),
  );

  protected readonly staffForm = new FormGroup({
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
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(USERNAME_PATTERN),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [passwordStrengthValidator],
    }),
    position: new FormControl<StaffPosition | null>(null, {
      validators: [Validators.required],
    }),
    employmentType: new FormControl<EmploymentType | null>(null, {
      validators: [Validators.required],
    }),
    workingDayStart: new FormControl<WeekDay | null>(null, {
      validators: [Validators.required],
    }),
    workingDayEnd: new FormControl<WeekDay | null>(null, {
      validators: [Validators.required],
    }),
    workingHourStart: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    workingHourEnd: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.staffForm.controls.workingHourEnd.addValidators((control) => {
      const start = this.staffForm.controls.workingHourStart.value;
      const end = control.value;
      if (!start || !end) return null;
      return start === end ? { sameAsStart: true } : null;
    });
    this.staffForm.controls.workingHourStart.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.staffForm.controls.workingHourEnd.updateValueAndValidity());

    effect(() => {
      if (this.isEdit()) return;
      const passwordControl = this.staffForm.controls.password;
      passwordControl.addValidators(Validators.required);
      passwordControl.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const member = this.selectedStaffMember();
      if (member) {
        this.resolvedStaffMember.set(member);
        return;
      }
      const id = this.staffMemberId();
      if (id === null) return;
      this.loading.set(true);
      this.staffService
        .getStaffMember(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detail) => {
            this.resolvedStaffMember.set(detail);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to load staff member');
          },
        });
    });

    effect(() => {
      const member = this.resolvedStaffMember();
      if (!member) return;
      this.staffForm.patchValue({
        firstName: member.firstName,
        lastName: member.lastName,
        username: member.username,
        email: member.email,
        phoneNumber: member.phoneNumber,
        position: member.position,
        employmentType: member.employmentType,
        workingDayStart: member.workingDayStart,
        workingDayEnd: member.workingDayEnd,
        workingHourStart: member.workingHourStart,
        workingHourEnd: member.workingHourEnd,
      });
    });
  }

  protected readonly positionDisplayFn = (position: StaffPosition): string =>
    STAFF_POSITION_LABELS[position];

  protected readonly weekDayDisplayFn = (day: WeekDay): string => WEEK_DAY_LABELS[day];

  protected onPositionChange(position: StaffPosition): void {
    this.staffForm.controls.position.setValue(position);
    this.staffForm.controls.position.markAsTouched();
  }

  protected onPositionCleared(): void {
    this.staffForm.controls.position.setValue(null);
    this.staffForm.controls.position.markAsTouched();
  }

  protected onPositionTouched(): void {
    this.staffForm.controls.position.markAsTouched();
  }

  protected onWorkingDayStartChange(day: WeekDay): void {
    this.staffForm.controls.workingDayStart.setValue(day);
    this.staffForm.controls.workingDayStart.markAsTouched();
  }

  protected onWorkingDayStartCleared(): void {
    this.staffForm.controls.workingDayStart.setValue(null);
    this.staffForm.controls.workingDayStart.markAsTouched();
  }

  protected onWorkingDayStartTouched(): void {
    this.staffForm.controls.workingDayStart.markAsTouched();
  }

  protected onWorkingDayEndChange(day: WeekDay): void {
    this.staffForm.controls.workingDayEnd.setValue(day);
    this.staffForm.controls.workingDayEnd.markAsTouched();
  }

  protected onWorkingDayEndCleared(): void {
    this.staffForm.controls.workingDayEnd.setValue(null);
    this.staffForm.controls.workingDayEnd.markAsTouched();
  }

  protected onWorkingDayEndTouched(): void {
    this.staffForm.controls.workingDayEnd.markAsTouched();
  }

  protected saveMember() {
    if (this.staffForm.invalid || this.saving()) return;

    const value = this.staffForm.getRawValue();
    const payload: StaffMemberPayload = {
      firstName: value.firstName,
      lastName: value.lastName,
      username: value.username,
      email: value.email,
      phoneNumber: value.phoneNumber,
      position: value.position!,
      employmentType: value.employmentType!,
      workingDayStart: value.workingDayStart!,
      workingDayEnd: value.workingDayEnd!,
      workingHourStart: value.workingHourStart,
      workingHourEnd: value.workingHourEnd,
    };

    const payloadWithPassword = value.password ? { ...payload, password: value.password } : payload;
    const request$ = this.isEdit()
      ? this.staffService.updateStaffMember(this.resolvedStaffMember()!.id, payloadWithPassword)
      : this.staffService.createStaffMember(payloadWithPassword);

    this.saving.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (member) => {
        this.saving.set(false);
        this.toastService.success(this.isEdit() ? 'Staff member updated' : 'Staff member added');
        this.saved.emit({ member, isEdit: this.isEdit() });
        this.close()();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toastService.error(err.error?.message ?? 'Failed to save staff member');
      },
    });
  }
}
