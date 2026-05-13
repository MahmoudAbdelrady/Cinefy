import { Component, computed, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AtSign, Check, LucideAngularModule, Mail, Phone, User } from 'lucide-angular';
import { NgpRadioGroup, NgpRadioItem } from 'ng-primitives/radio';
import { ModalComponent } from '../../modal/modal';
import { InputField } from '../../input-field/input-field';
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_POSITION_LABELS,
  type EmploymentType,
  type StaffPosition,
} from '../../../shared/types';
import { CustomSelectComponent } from '../../drop-down/custom-select/custom-select';
import { TimePicker } from '../../date-time/time-picker/time-picker';

const WEEK_DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
} as const;

type WeekDay = keyof typeof WEEK_DAY_LABELS;

@Component({
  selector: 'manage-staff-modal',
  imports: [
    ModalComponent,
    InputField,
    CustomSelectComponent,
    LucideAngularModule,
    NgpRadioGroup,
    NgpRadioItem,
    ReactiveFormsModule,
    TimePicker,
  ],
  templateUrl: './manage-staff-modal.html',
  styleUrl: './manage-staff-modal.scss',
})
export class ManageStaffModalComponent {
  protected readonly CheckIcon = Check;
  protected readonly FullNameIcon = User;
  protected readonly UsernameIcon = AtSign;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly EMPLOYMENT_TYPE_LABELS = EMPLOYMENT_TYPE_LABELS;

  readonly close = input.required<() => void>();

  protected readonly isEdit = signal(false);

  protected readonly modalTitle = computed(() =>
    this.isEdit() ? 'Edit staff member' : 'Add staff member',
  );

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
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
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

  protected readonly positionDisplayFn = (position: StaffPosition): string =>
    STAFF_POSITION_LABELS[position];

  protected readonly weekDayDisplayFn = (day: WeekDay): string => WEEK_DAY_LABELS[day];

  protected onPositionChange(position: StaffPosition): void {
    this.staffForm.controls.position.setValue(position);
  }

  protected onPositionCleared(): void {
    this.staffForm.controls.position.setValue(null);
  }

  protected onWorkingDayStartChange(day: WeekDay): void {
    this.staffForm.controls.workingDayStart.setValue(day);
  }

  protected onWorkingDayStartCleared(): void {
    this.staffForm.controls.workingDayStart.setValue(null);
  }

  protected onWorkingDayEndChange(day: WeekDay): void {
    this.staffForm.controls.workingDayEnd.setValue(day);
  }

  protected onWorkingDayEndCleared(): void {
    this.staffForm.controls.workingDayEnd.setValue(null);
  }

  protected saveMember() {}
}
