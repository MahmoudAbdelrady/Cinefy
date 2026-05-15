import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AtSign,
  BriefcaseBusiness,
  Calendar,
  Clock,
  LucideAngularModule,
  Mail,
  Phone,
  SquarePen,
} from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { Time12hPipe } from '../../../shared/pipes';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import {
  EMPLOYMENT_TYPE_LABELS,
  STAFF_POSITION_LABELS,
  WEEK_DAY_LABELS,
  type StaffMemberDetail,
} from '../../../shared/types';
import { StaffService, ToastService } from '../../../services';

@Component({
  selector: 'staff-details',
  imports: [ModalComponent, LucideAngularModule, LoadingSpinnerComponent, DatePipe, Time12hPipe],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.scss',
})
export class StaffDetailsComponent {
  protected readonly UsernameIcon = AtSign;
  protected readonly EmailIcon = Mail;
  protected readonly PhoneIcon = Phone;
  protected readonly CalendarIcon = Calendar;
  protected readonly ClockIcon = Clock;
  protected readonly BriefCaseIcon = BriefcaseBusiness;
  protected readonly EditIcon = SquarePen;

  private readonly staffService = inject(StaffService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<() => void>();
  readonly staffMemberId = input.required<string>();
  readonly editRequested = output<StaffMemberDetail>();

  protected readonly staffMember = signal<StaffMemberDetail | null>(null);
  protected readonly loading = signal(false);

  protected readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly positionLabels = STAFF_POSITION_LABELS;
  protected readonly weekDayLabels = WEEK_DAY_LABELS;

  constructor() {
    effect(() => {
      const id = this.staffMemberId();
      this.loading.set(true);
      this.staffService
        .getStaffMember(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (member) => {
            this.staffMember.set(member);
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.toastService.error(err.error?.message ?? 'Failed to load staff member');
          },
        });
    });
  }

  protected requestEdit(): void {
    const member = this.staffMember();
    if (!member) return;
    this.close()();
    this.editRequested.emit(member);
  }
}
